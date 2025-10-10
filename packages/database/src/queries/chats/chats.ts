import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { chats, messages, userFavorites, users } from '../../schema';
import { MessageAnalysisModeSchema } from '../../schema-types';

// Type inference from schema
export type Chat = InferSelectModel<typeof chats>;
type Message = InferSelectModel<typeof messages>;
type User = InferSelectModel<typeof users>;

// Create a type for updateable chat fields by excluding auto-managed fields
type UpdateableChatFields = Partial<
  Omit<typeof chats.$inferInsert, 'id' | 'createdAt' | 'deletedAt'>
>;

/**
 * Input/output schemas for type safety
 */
export const CreateChatInputSchema = z.object({
  title: z.string().min(1),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export const GetChatInputSchema = z.object({
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const CreateMessageInputSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string(),
  userId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
  messageAnalysisMode: MessageAnalysisModeSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateChatInput = z.infer<typeof CreateChatInputSchema>;
export type GetChatInput = z.infer<typeof GetChatInputSchema>;
export type CreateMessageInput = z.infer<typeof CreateMessageInputSchema>;

/**
 * Create a new chat
 */
export async function createChat(input: CreateChatInput): Promise<Chat> {
  try {
    const validated = CreateChatInputSchema.parse(input);

    const [chat] = await db
      .insert(chats)
      .values({
        title: validated.title,
        organizationId: validated.organizationId,
        createdBy: validated.userId,
        updatedBy: validated.userId,
        publiclyAccessible: false,
      })
      .returning();

    if (!chat) {
      throw new Error('Failed to create chat');
    }

    return chat;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid chat input: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get a chat with user and favorite information
 */
export async function getChatWithDetails(input: GetChatInput): Promise<{
  chat: Chat;
  user: User | null;
  isFavorited: boolean;
} | null> {
  const validated = GetChatInputSchema.parse(input);

  // Get chat with creator info
  const result = await db
    .select({
      chat: chats,
      user: users,
    })
    .from(chats)
    .leftJoin(users, eq(chats.createdBy, users.id))
    .where(and(eq(chats.id, validated.chatId), isNull(chats.deletedAt)))
    .limit(1);

  if (!result.length || !result[0]?.chat) {
    return null;
  }

  // Check if favorited
  const favorite = await db
    .select()
    .from(userFavorites)
    .where(
      and(
        eq(userFavorites.userId, validated.userId),
        eq(userFavorites.assetId, validated.chatId),
        eq(userFavorites.assetType, 'chat')
      )
    )
    .limit(1);

  const { chat, user } = result[0];
  return {
    chat,
    user,
    isFavorited: favorite.length > 0,
  };
}

/**
 * Create a new message in a chat
 */
export async function createMessage(input: CreateMessageInput): Promise<Message> {
  try {
    const validated = CreateMessageInputSchema.parse(input);

    const messageId = validated.messageId || crypto.randomUUID();

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      const [message] = await tx
        .insert(messages)
        .values({
          id: messageId,
          chatId: validated.chatId,
          createdBy: validated.userId,
          requestMessage: validated.content,
          messageAnalysisMode: validated.messageAnalysisMode,
          title: validated.content.substring(0, 255), // Ensure title fits in database
          isCompleted: false,
          // Add the user message as the first raw LLM entry
          rawLlmMessages: [
            {
              role: 'user',
              content: validated.content,
            },
          ],
          metadata: validated.metadata || {},
        })
        .returning();

      if (!message) {
        throw new Error('Failed to create message');
      }

      // Update chat's updated_at timestamp
      await tx
        .update(chats)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(chats.id, validated.chatId));

      return message;
    });

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid message input: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Flexibly update chat fields - only updates fields that are provided
 * Accepts a partial Chat object and updates only the provided fields
 * Note: Some fields like id, createdAt, and deletedAt cannot be updated
 * @param chatId - The ID of the chat to update
 * @param fields - Object containing the fields to update (only provided fields will be updated)
 * @returns Success status
 */
export async function updateChat(
  chatId: string,
  fields: UpdateableChatFields
): Promise<{ success: boolean }> {
  try {
    // First verify the chat exists and is not deleted
    const existingChat = await db
      .select({ id: chats.id })
      .from(chats)
      .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)))
      .limit(1);

    if (existingChat.length === 0) {
      throw new Error(`Chat not found or has been deleted: ${chatId}`);
    }

    // Build update object with only provided fields, filtering out protected fields
    const updateData = {
      updatedAt: new Date().toISOString(),
      ...Object.fromEntries(
        Object.entries(fields).filter(
          ([key, value]) =>
            value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'deletedAt'
        )
      ),
    };

    await db
      .update(chats)
      .set(updateData)
      .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update chat fields:', error);
    // Re-throw our specific validation errors
    if (error instanceof Error && error.message.includes('Chat not found')) {
      throw error;
    }
    throw new Error(`Failed to update chat fields for chat ${chatId}`);
  }
}

/**
 * Updates a chat's sharing settings
 */
export async function updateChatSharing(
  chatId: string,
  userId: string,
  options: {
    publicly_accessible?: boolean;
    public_expiry_date?: string | null;
    workspace_sharing?: 'none' | 'can_view' | 'can_edit' | 'full_access';
  }
): Promise<{ success: boolean }> {
  const updateFields: UpdateableChatFields = {
    updatedBy: userId,
  };

  if (options.publicly_accessible !== undefined) {
    updateFields.publiclyAccessible = options.publicly_accessible;
    updateFields.publiclyEnabledBy = options.publicly_accessible ? userId : null;
  }

  if (options.public_expiry_date !== undefined) {
    updateFields.publicExpiryDate = options.public_expiry_date;
  }

  if (options.workspace_sharing !== undefined) {
    updateFields.workspaceSharing = options.workspace_sharing;

    if (options.workspace_sharing !== 'none') {
      updateFields.workspaceSharingEnabledBy = userId;
      updateFields.workspaceSharingEnabledAt = new Date().toISOString();
    } else {
      updateFields.workspaceSharingEnabledBy = null;
      updateFields.workspaceSharingEnabledAt = null;
    }
  }

  return await updateChat(chatId, updateFields);
}

/**
 * Get a chat by ID (simple version for sharing handlers)
 */
export async function getChatById(chatId: string): Promise<Chat | null> {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)))
    .limit(1);

  return chat || null;
}
