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

// Simple in-memory queue for each reportId
const updateQueues = new Map<string, Promise<{
  id: string;
  name: string;
  content: string;
  versionHistory: VersionHistory | null;
}>>();

/**
 * Internal function that performs the actual update logic.
 * This is separated so it can be queued.
 */
async function performUpdate(
  params: BatchUpdateReportInput
): Promise<{
  id: string;
  name: string;
  content: string;
  versionHistory: VersionHistory | null;
}> {
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

    const result = await db
      .update(reportFiles)
      .set(updateData)
      .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)))
      .returning({
        id: reportFiles.id,
        name: reportFiles.name,
        content: reportFiles.content,
        versionHistory: reportFiles.versionHistory,
      });

    const updatedReport = result[0];
    if (!updatedReport) {
      throw new Error('Report not found or already deleted');
    }

    return updatedReport;
  } catch (error) {
    console.error('Error batch updating report:', {
      reportId,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to batch update report');
  }
}

/**
 * Updates a report with new content, optionally name, and version history in a single operation
 * This is more efficient than multiple individual updates
 * 
 * Updates are queued per reportId to ensure they execute in order.
 */
export const batchUpdateReport = async (
  params: BatchUpdateReportInput
): Promise<{
  id: string;
  name: string;
  content: string;
  versionHistory: VersionHistory | null;
}> => {
  const { reportId } = params;
  
  // Get the current promise for this reportId, or use a resolved promise as the starting point
  const currentQueue = updateQueues.get(reportId) ?? Promise.resolve({
    id: '',
    name: '',
    content: '',
    versionHistory: null
  });
  
  // Chain the new update to run after the current queue completes
  const newQueue = currentQueue
    .then(() => performUpdate(params))
    .catch(() => performUpdate(params)); // Still try to run even if previous failed
  
  // Update the queue for this reportId
  updateQueues.set(reportId, newQueue);
  
  // Clean up the queue entry once this update completes
  newQueue.finally(() => {
    // Only remove if this is still the current queue
    if (updateQueues.get(reportId) === newQueue) {
      updateQueues.delete(reportId);
    }
  });
  
  return newQueue;
};
