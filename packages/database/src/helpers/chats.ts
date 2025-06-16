import { and, eq, isNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../connection';
import { chats, messages, userFavorites, users } from '../schema';

// Type inference from schema
export type Chat = InferSelectModel<typeof chats>;
export type Message = InferSelectModel<typeof messages>;
export type User = InferSelectModel<typeof users>;

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
          responseMessages: {},
          reasoning: {},
          title: validated.content.substring(0, 255), // Ensure title fits in database
          rawLlmMessages: {},
          isCompleted: false,
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
 * Check if a user has permission to access a chat
 */
export async function checkChatPermission(chatId: string, userId: string): Promise<boolean> {
  const chat = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)))
    .limit(1);

  if (!chat.length) {
    return false;
  }

  // For now, only check if user is the creator
  // TODO: Add more sophisticated permission checking with asset_permissions table
  return chat[0]?.createdBy === userId;
}

/**
 * Get all messages for a chat
 */
export async function getMessagesForChat(chatId: string): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)))
    .orderBy(messages.createdAt);
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

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only add fields that are actually provided (not undefined)
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'deletedAt') {
        updateData[key] = value;
      }
    }

    // If updatedAt was explicitly provided, use that instead
    if ('updatedAt' in fields && fields.updatedAt !== undefined) {
      updateData.updatedAt = fields.updatedAt;
    }

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
