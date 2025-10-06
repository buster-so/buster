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

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  promise.catch(() => undefined);

  return { promise, resolve, reject };
}

type MessageUpdateQueueState = {
  tailPromise: Promise<void>;
  nextSequence: number;
  pending: Map<number, Deferred<void>>;
  lastCompletedSequence: number;
  finalSequence?: number;
  closed: boolean;
};

const updateQueues = new Map<string, MessageUpdateQueueState>();

function getOrCreateQueueState(messageId: string): MessageUpdateQueueState {
  const existing = updateQueues.get(messageId);
  if (existing) {
    return existing;
  }

  const initialState: MessageUpdateQueueState = {
    tailPromise: Promise.resolve(),
    nextSequence: 0,
    pending: new Map(),
    lastCompletedSequence: -1,
    closed: false,
  };

  updateQueues.set(messageId, initialState);
  return initialState;
}

export function isMessageUpdateQueueClosed(messageId: string): boolean {
  const queue = updateQueues.get(messageId);
  return queue?.closed ?? false;
}

type WaitForPendingUpdateOptions = {
  upToSequence?: number;
};

/**
 * Wait for pending updates for a given messageId to complete.
 * Optionally provide a sequence number to wait through.
 */
export async function waitForPendingUpdates(
  messageId: string,
  options?: WaitForPendingUpdateOptions
): Promise<void> {
  const queue = updateQueues.get(messageId);
  if (!queue) {
    return;
  }

  const targetSequence = options?.upToSequence ?? queue.finalSequence;

  if (targetSequence === undefined) {
    await queue.tailPromise;
    return;
  }

  const maxKnownSequence = queue.nextSequence - 1;
  const effectiveTarget = Math.min(targetSequence, maxKnownSequence);

  if (effectiveTarget <= queue.lastCompletedSequence) {
    return;
  }

  const waits: Promise<unknown>[] = [];

  for (let sequence = queue.lastCompletedSequence + 1; sequence <= effectiveTarget; sequence += 1) {
    const deferred = queue.pending.get(sequence);
    if (deferred) {
      waits.push(deferred.promise.catch(() => undefined));
    }
  }

  if (waits.length > 0) {
    await Promise.all(waits);
  } else {
    await queue.tailPromise;
  }
}

export function closeMessageUpdateQueue(messageId: string): void {
  const queue = updateQueues.get(messageId);
  if (queue) {
    queue.closed = true;
  }
}

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
type UpdateMessageEntriesOptions = {
  isFinal?: boolean;
};

type UpdateMessageEntriesResult = {
  success: boolean;
  sequenceNumber: number;
  skipped?: boolean;
};

export async function updateMessageEntries(
  params: UpdateMessageEntriesParams,
  options?: UpdateMessageEntriesOptions
): Promise<UpdateMessageEntriesResult> {
  const { messageId } = params;

  const queue = getOrCreateQueueState(messageId);
  const isFinal = options?.isFinal ?? false;

  if (!isFinal && queue.closed) {
    const lastKnownSequence = queue.finalSequence ?? queue.nextSequence - 1;
    return {
      success: false,
      sequenceNumber: lastKnownSequence >= 0 ? lastKnownSequence : -1,
      skipped: true,
    };
  }

  const sequenceNumber = queue.nextSequence;
  queue.nextSequence += 1;

  const deferred = createDeferred<void>();
  queue.pending.set(sequenceNumber, deferred);

  const runUpdate = () => performUpdate(params);

  const runPromise = queue.tailPromise.then(runUpdate, runUpdate);

  queue.tailPromise = runPromise.then(
    () => undefined,
    () => undefined
  );

  const finalize = (success: boolean) => {
    queue.pending.delete(sequenceNumber);
    queue.lastCompletedSequence = Math.max(queue.lastCompletedSequence, sequenceNumber);
    if (isFinal) {
      queue.finalSequence = sequenceNumber;
    }
    return success;
  };

  const resultPromise = runPromise
    .then((result) => {
      deferred.resolve();
      finalize(true);
      return {
        ...result,
        sequenceNumber,
        skipped: false as const,
      };
    })
    .catch((error) => {
      deferred.reject(error);
      finalize(false);
      throw error;
    });

  return resultPromise;
}
