import type { ModelMessage } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { messages } from '../../schema';
import { ReasoningMessageSchema, ResponseMessageSchema } from '../../schemas/message-schemas';
import { fetchMessageEntries } from './helpers/fetch-message-entries';
import {
  mergeRawLlmMessages,
  mergeReasoningMessages,
  mergeResponseMessages,
} from './helpers/merge-entries';
import { messageEntriesCache } from './message-entries-cache';

const UpdateMessageEntriesSchema = z.object({
  messageId: z.string().uuid(),
  rawLlmMessages: z.array(z.custom<ModelMessage>()).optional(),
  responseMessages: z.array(ResponseMessageSchema).optional(),
  reasoningMessages: z.array(ReasoningMessageSchema).optional(),
});

export type UpdateMessageEntriesParams = z.infer<typeof UpdateMessageEntriesSchema>;

/**
 * Updates message entries with cache-first approach for streaming.
 * Cache is the source of truth during streaming, DB is updated for persistence.
 *
 * Merge logic:
 * - responseMessages: upsert by 'id' field, maintaining order
 * - reasoningMessages: upsert by 'id' field, maintaining order
 * - rawLlmMessages: upsert by combination of 'role' and 'toolCallId', maintaining order
 */
export async function updateMessageEntries({
  messageId,
  rawLlmMessages,
  responseMessages,
  reasoningMessages,
}: UpdateMessageEntriesParams): Promise<{ success: boolean }> {
  try {
    // Fetch existing entries from cache or database
    const existingEntries = await fetchMessageEntries(messageId);

    if (!existingEntries) {
      throw new Error(`Message not found: ${messageId}`);
    }

    // Merge with new entries
    const mergedEntries = {
      responseMessages: responseMessages
        ? mergeResponseMessages(existingEntries.responseMessages, responseMessages)
        : existingEntries.responseMessages,
      reasoning: reasoningMessages
        ? mergeReasoningMessages(existingEntries.reasoning, reasoningMessages)
        : existingEntries.reasoning,
      rawLlmMessages: rawLlmMessages
        ? mergeRawLlmMessages(existingEntries.rawLlmMessages, rawLlmMessages)
        : existingEntries.rawLlmMessages,
    };

    // Update cache immediately (cache is source of truth during streaming)
    messageEntriesCache.set(messageId, mergedEntries);

    // Update database asynchronously for persistence (fire-and-forget)
    // If this fails, cache still has the latest state for next update
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (responseMessages) {
      updateData.responseMessages = mergedEntries.responseMessages;
    }

    if (reasoningMessages) {
      updateData.reasoning = mergedEntries.reasoning;
    }

    if (rawLlmMessages) {
      updateData.rawLlmMessages = mergedEntries.rawLlmMessages;
    }

    // Non-blocking DB update - don't await
    db.update(messages)
      .set(updateData)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      .catch((error) => {
        // Log but don't fail - cache has the truth
        console.error('Background DB update failed (cache still valid):', error);
      });

    return { success: true };
  } catch (error) {
    console.error('Failed to update message entries:', error);
    throw new Error(`Failed to update message entries for message ${messageId}`);
  }
}
