import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles } from '../../schema';

// Input validation schema for batch updating report
const BatchUpdateReportInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  content: z.string().describe('The final content after all edits'),
  name: z.string().optional().describe('Optional new name for the report'),
  versionHistory: z
    .record(
      z.string(),
      z.object({
        content: z.string(),
        updated_at: z.string(),
        version_number: z.number(),
      })
    )
    .optional()
    .describe('Updated version history'),
});

type BatchUpdateReportInput = z.infer<typeof BatchUpdateReportInputSchema>;

type VersionHistoryEntry = {
  content: string;
  updated_at: string;
  version_number: number;
};

type VersionHistory = Record<string, VersionHistoryEntry>;

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

type ReportUpdateQueueState = {
  tailPromise: Promise<void>;
  nextSequence: number;
  pending: Map<number, Deferred<void>>;
  lastCompletedSequence: number;
  finalSequence?: number;
  closed: boolean;
};

const updateQueues = new Map<string, ReportUpdateQueueState>();

function getOrCreateQueueState(reportId: string): ReportUpdateQueueState {
  const existing = updateQueues.get(reportId);
  if (existing) {
    return existing;
  }

  const initialState: ReportUpdateQueueState = {
    tailPromise: Promise.resolve(),
    nextSequence: 0,
    pending: new Map(),
    lastCompletedSequence: -1,
    closed: false,
  };

  updateQueues.set(reportId, initialState);
  return initialState;
}

function cleanupQueueIfIdle(reportId: string, state: ReportUpdateQueueState): void {
  if (
    state.closed &&
    state.finalSequence !== undefined &&
    state.lastCompletedSequence >= state.finalSequence &&
    state.pending.size === 0
  ) {
    updateQueues.delete(reportId);
  }
}

export function isReportUpdateQueueClosed(reportId: string): boolean {
  const queue = updateQueues.get(reportId);
  return queue?.closed ?? false;
}

type WaitForPendingReportUpdateOptions = {
  upToSequence?: number;
};

/**
 * Wait for all pending updates for a given reportId to complete.
 * This ensures all queued updates are flushed to the database before proceeding.
 */
export async function waitForPendingReportUpdates(
  reportId: string,
  options?: WaitForPendingReportUpdateOptions
): Promise<void> {
  const queue = updateQueues.get(reportId);
  if (!queue) {
    return;
  }

  const targetSequence = options?.upToSequence ?? queue.finalSequence;

  if (targetSequence === undefined) {
    await queue.tailPromise;
    cleanupQueueIfIdle(reportId, queue);
    return;
  }

  const maxKnownSequence = queue.nextSequence - 1;
  const effectiveTarget = Math.min(targetSequence, maxKnownSequence);

  if (effectiveTarget <= queue.lastCompletedSequence) {
    cleanupQueueIfIdle(reportId, queue);
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

  cleanupQueueIfIdle(reportId, queue);
}

/**
 * Internal function that performs the actual update logic.
 * This is separated so it can be queued.
 */
async function performUpdate(params: BatchUpdateReportInput): Promise<void> {
  const { reportId, content, name, versionHistory } = BatchUpdateReportInputSchema.parse(params);

  try {
    const updateData: {
      content: string;
      updatedAt: string;
      name?: string;
      versionHistory?: VersionHistory;
    } = {
      content,
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (versionHistory !== undefined) {
      updateData.versionHistory = versionHistory;
    }

    await db
      .update(reportFiles)
      .set(updateData)
      .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)));
  } catch (error) {
    console.error('Error updating report with version:', {
      reportId,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to update report with version');
  }
}

/**
 * Updates a report's content, name, and version history in a single operation.
 * Updates are queued per reportId to ensure they execute in order.
 */
type UpdateReportWithVersionOptions = {
  isFinal?: boolean;
};

type UpdateReportWithVersionResult = {
  sequenceNumber: number;
  skipped?: boolean;
};

export const updateReportWithVersion = async (
  params: BatchUpdateReportInput,
  options?: UpdateReportWithVersionOptions
): Promise<UpdateReportWithVersionResult> => {
  const { reportId } = params;
  const queue = getOrCreateQueueState(reportId);

  if (queue.closed) {
    const lastKnownSequence = queue.finalSequence ?? queue.nextSequence - 1;
    return {
      sequenceNumber: lastKnownSequence >= 0 ? lastKnownSequence : -1,
      skipped: true,
    };
  }

  const isFinal = options?.isFinal ?? false;

  if (isFinal) {
    queue.closed = true;
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

  const finalize = () => {
    queue.pending.delete(sequenceNumber);
    queue.lastCompletedSequence = Math.max(queue.lastCompletedSequence, sequenceNumber);
    if (isFinal) {
      queue.finalSequence = sequenceNumber;
    }
    cleanupQueueIfIdle(reportId, queue);
  };

  const resultPromise = runPromise
    .then(() => {
      deferred.resolve();
      finalize();
      return {
        sequenceNumber,
        skipped: false as const,
      };
    })
    .catch((error) => {
      deferred.reject(error);
      finalize();
      throw error;
    });

  return resultPromise;
};
