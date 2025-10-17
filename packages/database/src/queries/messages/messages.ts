import type { InferSelectModel } from 'drizzle-orm';
import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import { db } from '../../connection';
import { messages, users } from '../../schema';

export type Message = InferSelectModel<typeof messages>;

// Create a type for updateable message fields by excluding auto-managed fields
type UpdateableMessageFields = Partial<
  Omit<typeof messages.$inferInsert, 'id' | 'createdAt' | 'deletedAt'>
>;

/**
 * Get raw LLM messages from a specific message record
 * @param messageId - The ID of the message record
 * @returns The raw LLM messages stored in the message record
 */
export async function getRawLlmMessages(messageId: string) {
  const result = await db
    .select({
      rawLlmMessages: messages.rawLlmMessages,
    })
    .from(messages)
    .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
    .limit(1);

  return result[0]?.rawLlmMessages || null;
}

/**
 * Get all messages for a specific chat
 * @param chatId - The ID of the chat
 * @returns Array of messages for the chat
 */
export async function getMessagesForChat(chatId: string) {
  return await db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)))
    .orderBy(desc(messages.createdAt));
}

/**
 * Get all messages for a specific chat with user details
 * @param chatId - The ID of the chat
 * @returns Array of messages for the chat with user details
 */
export async function getMessagesForChatWithUserDetails(chatId: string) {
  return await db
    .select({ message: messages, user: users })
    .from(messages)
    .innerJoin(users, eq(messages.createdBy, users.id))
    .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)))
    .orderBy(desc(messages.createdAt));
}

/**
 * Get the latest message for a specific chat
 * @param chatId - The ID of the chat
 * @returns The most recent message for the chat
 */
export async function getLatestMessageForChat(chatId: string) {
  const result = await db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  return result[0] || null;
}

/**
 * Get completed messages for a specific chat
 * @param chatId - The ID of the chat
 * @returns Array of completed messages for the chat
 */
export async function getCompletedMessagesForChat(chatId: string) {
  return await db
    .select()
    .from(messages)
    .where(
      and(eq(messages.chatId, chatId), eq(messages.isCompleted, true), isNull(messages.deletedAt))
    )
    .orderBy(desc(messages.createdAt));
}

/**
 * Get raw LLM messages from all messages in a chat
 * @param chatId - The ID of the chat
 * @returns Array of raw LLM message objects from all messages in the chat
 */
export async function getAllRawLlmMessagesForChat(chatId: string) {
  const result = await db
    .select({
      id: messages.id,
      rawLlmMessages: messages.rawLlmMessages,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)))
    .orderBy(desc(messages.createdAt));

  return result.map((msg) => ({
    messageId: msg.id,
    rawLlmMessages: msg.rawLlmMessages,
    createdAt: msg.createdAt,
  }));
}

/**
 * Flexibly update message fields - only updates fields that are provided
 * Allows updating responseMessages, reasoning, and/or rawLlmMessages in a single query
 * Note: reasoning field has NOT NULL constraint, so null values are not allowed
 * @param messageId - The ID of the message to update
 * @param fields - Object containing the fields to update (only provided fields will be updated)
 * @returns Success status
 */
export async function updateMessageFields(
  messageId: string,
  fields: {
    responseMessages?: unknown;
    reasoning?: unknown;
    rawLlmMessages?: unknown;
    finalReasoningMessage?: string;
    isCompleted?: boolean;
  }
): Promise<{ success: boolean }> {
  try {
    // Validate reasoning is not null if provided (database constraint)
    if ('reasoning' in fields && (fields.reasoning === null || fields.reasoning === undefined)) {
      throw new Error('Reasoning cannot be null - database constraint violation');
    }

    // Build update object with only provided fields
    const updateData: {
      updatedAt: string;
      responseMessages?: unknown;
      reasoning?: unknown;
      rawLlmMessages?: unknown;
      finalReasoningMessage?: string;
      isCompleted?: boolean;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if ('responseMessages' in fields) {
      updateData.responseMessages = fields.responseMessages;
    }
    if ('reasoning' in fields) {
      updateData.reasoning = fields.reasoning;
    }
    if ('rawLlmMessages' in fields) {
      updateData.rawLlmMessages = fields.rawLlmMessages;
    }

    if ('finalReasoningMessage' in fields) {
      updateData.finalReasoningMessage = fields.finalReasoningMessage;
    }

    if ('isCompleted' in fields) {
      updateData.isCompleted = fields.isCompleted;
    }

    await db
      .update(messages)
      .set(updateData)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update message fields:', error);
    // Re-throw our specific validation errors
    if (
      error instanceof Error &&
      (error.message.includes('Message not found') ||
        error.message.includes('Reasoning cannot be null'))
    ) {
      throw error;
    }
    throw new Error(`Failed to update message fields for message ${messageId}`);
  }
}

/**
 * Flexibly update any message fields - only updates fields that are provided
 * Accepts a partial Message object and updates only the provided fields
 * Note: Some fields like id, createdAt, and deletedAt cannot be updated
 * Note: reasoning field has NOT NULL constraint, so null values are not allowed
 * @param messageId - The ID of the message to update
 * @param fields - Partial Message object containing the fields to update
 * @returns Success status
 */
export async function updateMessage(
  messageId: string,
  fields: UpdateableMessageFields
): Promise<{ success: boolean }> {
  try {
    // First verify the message exists and is not deleted
    const existingMessage = await db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      .limit(1);

    if (existingMessage.length === 0) {
      throw new Error(`Message not found or has been deleted: ${messageId}`);
    }

    // Validate reasoning is not null if provided (database constraint)
    if ('reasoning' in fields && (fields.reasoning === null || fields.reasoning === undefined)) {
      throw new Error('Reasoning cannot be null - database constraint violation');
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
      ...Object.fromEntries(
        Object.entries(fields).filter(
          ([key, value]) =>
            value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'deletedAt'
        )
      ),
    };

    // If updatedAt was explicitly provided, use that instead
    if ('updatedAt' in fields && fields.updatedAt !== undefined) {
      updateData.updatedAt = fields.updatedAt;
    }

    await db
      .update(messages)
      .set(updateData)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update message:', error);
    // Re-throw our specific validation errors
    if (
      error instanceof Error &&
      (error.message.includes('Message not found') ||
        error.message.includes('Reasoning cannot be null'))
    ) {
      throw error;
    }
    throw new Error(`Failed to update message ${messageId}`);
  }
}

/**
 * @param messageId - The ID of the message
 * @returns Object with status and optional errorReason
 */
export async function getMessageStatus(messageId: string): Promise<{
  status: 'Complete' | 'Failed' | 'InProgress';
  errorReason?: string;
}> {
  try {
    const [message] = await db
      .select({
        id: messages.id,
        isCompleted: messages.isCompleted,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      .limit(1);

    if (!message) {
      console.error(`Message not found: ${messageId}`);
      return {
        status: 'Failed',
        errorReason: 'Message not found',
      };
    }

    if (message.isCompleted) {
      return { status: 'Complete' };
    }

    return { status: 'InProgress' };
  } catch (error) {
    console.error('Failed to get message status:', error);
    return {
      status: 'Failed',
      errorReason: 'Failed to poll for message status. Please try again later.',
    };
  }
}

/**
 * Check for duplicate messages in the same chat
 * @param options - Options for duplicate checking
 * @returns Object indicating if duplicate exists and duplicate message IDs
 */
export async function checkForDuplicateMessages(options: {
  chatId: string;
  requestMessage: string;
  excludeMessageId?: string;
}): Promise<{ isDuplicate: boolean; duplicateMessageIds: string[] }> {
  const { chatId, requestMessage, excludeMessageId } = options;

  try {
    // Build query conditions
    const conditions = [
      eq(messages.chatId, chatId),
      eq(messages.requestMessage, requestMessage),
      isNull(messages.deletedAt),
    ];

    // Only add exclusion if messageId provided
    if (excludeMessageId) {
      conditions.push(ne(messages.id, excludeMessageId));
    }

    // Query for messages with same chatId and requestMessage
    const duplicateMessages = await db
      .select({
        id: messages.id,
      })
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt));

    return {
      isDuplicate: duplicateMessages.length > 0,
      duplicateMessageIds: duplicateMessages.map((msg) => msg.id),
    };
  } catch (error) {
    console.error('Failed to check for duplicate messages:', error);
    throw new Error(`Failed to check for duplicate messages in chat ${chatId}`);
  }
}

export async function getMessage(messageId: string): Promise<Message | undefined> {
  const result = await db
    .select()
    .from(messages)
    .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
    .limit(1);

  return result[0];
}
