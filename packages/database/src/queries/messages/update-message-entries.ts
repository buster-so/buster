import type { ModelMessage } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { messages } from '../../schema';
import { ReasoningMessageSchema, ResponseMessageSchema } from '../../schema-types/message-schemas';
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

// Simple in-memory queue for each messageId
const updateQueues = new Map<string, Promise<{ success: boolean }>>();

/**
 * Internal function that performs the actual update logic.
 * This is separated so it can be queued.
 */
async function performUpdate({
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

    // Merge all entries concurrently
    const [mergedResponseMessages, mergedReasoning, mergedRawLlmMessages] = await Promise.all([
      responseMessages
        ? Promise.resolve(mergeResponseMessages(existingEntries.responseMessages, responseMessages))
        : Promise.resolve(existingEntries.responseMessages),
      reasoningMessages
        ? Promise.resolve(mergeReasoningMessages(existingEntries.reasoning, reasoningMessages))
        : Promise.resolve(existingEntries.reasoning),
      rawLlmMessages
        ? Promise.resolve(mergeRawLlmMessages(existingEntries.rawLlmMessages, rawLlmMessages))
        : Promise.resolve(existingEntries.rawLlmMessages),
    ]);

    const mergedEntries = {
      responseMessages: mergedResponseMessages,
      reasoning: mergedReasoning,
      rawLlmMessages: mergedRawLlmMessages,
    };

    // Update cache immediately (cache is source of truth during streaming)
    messageEntriesCache.set(messageId, mergedEntries);

    // Build update data
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

    // Update database for persistence (after cache is updated)
    await db
      .update(messages)
      .set(updateData)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));

    return { success: true };
  } catch (error) {
    console.error('Failed to update message entries:', error);
    throw new Error(`Failed to update message entries for message ${messageId}`);
  }
}

/**
 * Updates message entries with cache-first approach for streaming.
 * Cache is the source of truth during streaming, DB is updated for persistence.
 *
 * Updates are queued per messageId to ensure they execute in order.
 *
 * Merge logic:
 * - responseMessages: upsert by 'id' field, maintaining order
 * - reasoningMessages: upsert by 'id' field, maintaining order
 * - rawLlmMessages: upsert by combination of 'role' and 'toolCallId', maintaining order
 */
export async function updateMessageEntries(
  params: UpdateMessageEntriesParams
): Promise<{ success: boolean }> {
  const { messageId } = params;

  // Get the current promise for this messageId, or use a resolved promise as the starting point
  const currentQueue = updateQueues.get(messageId) ?? Promise.resolve({ success: true });

  // Chain the new update to run after the current queue completes
  const newQueue = currentQueue
    .then(() => performUpdate(params))
    .catch(() => performUpdate(params)); // Still try to run even if previous failed

  // Update the queue for this messageId
  updateQueues.set(messageId, newQueue);

  // Clean up the queue entry once this update completes
  newQueue.finally(() => {
    // Only remove if this is still the current queue
    if (updateQueues.get(messageId) === newQueue) {
      updateQueues.delete(messageId);
    }
  });

  return newQueue;
}
