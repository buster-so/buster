import { eq } from 'drizzle-orm';
import { getDb } from '../../../database/src/connection';
import { messages } from '../../../database/src/schema';

export interface ChatHistoryResult {
  id: string;
  rawLlmMessages: any; // jsonb data
  createdAt: string;
}

/**
 * Fetches all raw LLM messages from the messages table for a specific chat
 * @param chatId - The UUID of the chat to fetch messages for
 * @returns Array of messages with their raw LLM message data
 */
export async function getChatHistory(chatId: string): Promise<ChatHistoryResult[]> {
  const db = getDb();

  const result = await db
    .select({
      id: messages.id,
      rawLlmMessages: messages.rawLlmMessages,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);

  return result;
}

/**
 * Fetches just the raw LLM messages data for a specific chat (simplified version)
 * @param chatId - The UUID of the chat to fetch messages for
 * @returns Array of raw LLM message objects
 */
export async function getRawLlmMessages(chatId: string): Promise<any[]> {
  const db = getDb();

  const result = await db
    .select({
      rawLlmMessages: messages.rawLlmMessages,
    })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);

  return result.map((row) => row.rawLlmMessages);
}
