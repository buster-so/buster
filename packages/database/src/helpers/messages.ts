import type { InferSelectModel } from 'drizzle-orm';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { db } from '../connection';
import { messages } from '../schema';

export type Message = InferSelectModel<typeof messages>;

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
    .where(and(
      eq(messages.id, messageId),
      isNull(messages.deletedAt)
    ))
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
    .where(and(
      eq(messages.chatId, chatId),
      isNull(messages.deletedAt)
    ))
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
    .where(and(
      eq(messages.chatId, chatId),
      isNull(messages.deletedAt)
    ))
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
    .where(and(
      eq(messages.chatId, chatId),
      eq(messages.isCompleted, true),
      isNull(messages.deletedAt)
    ))
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
    .where(and(
      eq(messages.chatId, chatId),
      isNull(messages.deletedAt)
    ))
    .orderBy(desc(messages.createdAt));

  return result.map(msg => ({
    messageId: msg.id,
    rawLlmMessages: msg.rawLlmMessages,
    createdAt: msg.createdAt,
  }));
}