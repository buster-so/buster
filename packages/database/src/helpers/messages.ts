import type { InferSelectModel } from 'drizzle-orm';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../connection';
import { messages } from '../schema';

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
 * Efficiently update the responseMessages JSONB field for a specific message
 * Optimized for frequent streaming updates - replaces entire JSONB content
 * @param messageId - The ID of the message to update
 * @param responseMessages - The new response messages content (will completely replace existing)
 * @returns Success status
 */
export async function updateMessageResponseMessages(
  messageId: string,
  responseMessages: any
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

    await db
      .update(messages)
      .set({
        responseMessages,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update message responseMessages:', error);
    // Re-throw our specific validation errors
    if (error instanceof Error && error.message.includes('Message not found')) {
      throw error;
    }
    throw new Error(`Failed to update response messages for message ${messageId}`);
  }
}

/**
 * Efficiently update the reasoning JSONB field for a specific message
 * Optimized for frequent streaming updates - replaces entire JSONB content
 * Note: reasoning field has NOT NULL constraint, so null values are not allowed
 * @param messageId - The ID of the message to update
 * @param reasoning - The new reasoning content (will completely replace existing)
 * @returns Success status
 */
export async function updateMessageReasoning(
  messageId: string,
  reasoning: any
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

    // Validate reasoning is not null (database constraint)
    if (reasoning === null || reasoning === undefined) {
      throw new Error('Reasoning cannot be null - database constraint violation');
    }

    await db
      .update(messages)
      .set({
        reasoning,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update message reasoning:', error);
    // Re-throw our specific validation errors
    if (
      error instanceof Error &&
      (error.message.includes('Message not found') ||
        error.message.includes('Reasoning cannot be null'))
    ) {
      throw error;
    }
    throw new Error(`Failed to update reasoning for message ${messageId}`);
  }
}

/**
 * Efficiently update both responseMessages and reasoning JSONB fields in a single query
 * Most efficient option when both fields need updating during streaming
 * Note: reasoning field has NOT NULL constraint, so null values are not allowed
 * @param messageId - The ID of the message to update
 * @param responseMessages - The new response messages content
 * @param reasoning - The new reasoning content (cannot be null)
 * @returns Success status
 */
export async function updateMessageStreamingFields(
  messageId: string,
  responseMessages: any,
  reasoning: any
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

    // Validate reasoning is not null (database constraint)
    if (reasoning === null || reasoning === undefined) {
      throw new Error('Reasoning cannot be null - database constraint violation');
    }

    await db
      .update(messages)
      .set({
        responseMessages,
        reasoning,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update message streaming fields:', error);
    // Re-throw our specific validation errors
    if (
      error instanceof Error &&
      (error.message.includes('Message not found') ||
        error.message.includes('Reasoning cannot be null'))
    ) {
      throw error;
    }
    throw new Error(`Failed to update streaming fields for message ${messageId}`);
  }
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
    responseMessages?: any;
    reasoning?: any;
    rawLlmMessages?: any;
    finalReasoningMessage?: string;
  }
): Promise<{ success: boolean }> {
  try {
    // Validate reasoning is not null if provided (database constraint)
    if ('reasoning' in fields && (fields.reasoning === null || fields.reasoning === undefined)) {
      throw new Error('Reasoning cannot be null - database constraint violation');
    }

    // Build update object with only provided fields
    const updateData: any = {
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

    // Remove undefined fields and build update object
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
