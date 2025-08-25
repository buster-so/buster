import type { ModelMessage } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../../connection';
import { messages } from '../../../schema';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../schemas/message-schemas';
import { type MessageEntriesCacheValue, messageEntriesCache } from '../message-entries-cache';

/**
 * Fetches message entries from cache or database
 * Returns cached value if available, otherwise fetches from DB and caches result
 */
export async function fetchMessageEntries(
  messageId: string
): Promise<MessageEntriesCacheValue | null> {
  // Check cache first
  const cached = messageEntriesCache.get(messageId);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const result = await db
    .select({
      responseMessages: messages.responseMessages,
      reasoning: messages.reasoning,
      rawLlmMessages: messages.rawLlmMessages,
    })
    .from(messages)
    .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
    .limit(1);

  if (!result[0]) {
    return null;
  }

  // Parse and validate the data
  const messageEntries: MessageEntriesCacheValue = {
    responseMessages: (result[0].responseMessages as ChatMessageResponseMessage[]) || [],
    reasoning: (result[0].reasoning as ChatMessageReasoningMessage[]) || [],
    rawLlmMessages: (result[0].rawLlmMessages as ModelMessage[]) || [],
  };

  // Cache the result
  messageEntriesCache.set(messageId, messageEntries);

  return messageEntries;
}
