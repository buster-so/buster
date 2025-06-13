import {
  getAllRawLlmMessagesForChat,
  getRawLlmMessages as getDbRawLlmMessages,
} from '@buster/database';
import type { MessageHistory } from '../utils/memory/types';

export interface ChatHistoryResult {
  messageId: string;
  rawLlmMessages: MessageHistory; // JSONB data containing array of CoreMessage
  createdAt: Date;
}

/**
 * Fetches all raw LLM messages from the messages table for a specific chat
 * @param chatId - The UUID of the chat to fetch messages for
 * @returns Array of messages with their raw LLM message data
 */
export async function getChatHistory(chatId: string): Promise<ChatHistoryResult[]> {
  const results = await getAllRawLlmMessagesForChat(chatId);

  return results.map((result) => ({
    messageId: result.messageId,
    rawLlmMessages: result.rawLlmMessages as MessageHistory,
    createdAt: new Date(result.createdAt),
  }));
}

/**
 * Fetches just the raw LLM messages data for a specific chat (simplified version)
 * @param chatId - The UUID of the chat to fetch messages for
 * @returns Array of raw LLM message objects
 */
export async function getRawLlmMessages(chatId: string): Promise<MessageHistory[]> {
  const results = await getAllRawLlmMessagesForChat(chatId);

  return results.map((result) => result.rawLlmMessages as MessageHistory);
}

/**
 * Fetches raw LLM messages for a specific message ID
 * @param messageId - The UUID of the message to fetch
 * @returns Raw LLM message data or null if not found
 */
export async function getRawLlmMessagesByMessageId(
  messageId: string
): Promise<MessageHistory | null> {
  const result = await getDbRawLlmMessages(messageId);
  return result as MessageHistory | null;
}
