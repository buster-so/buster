import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { storedValuesSyncJobs } from '../../schema';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const SyncJobStatusSchema = z.enum([
  'pending',
  'pending_manual',
  'pending_initial',
  'in_progress',
  'success',
  'failed',
  'cancelled',
  'skipped',
]);

export const UpdateSyncJobStatusInputSchema = z.object({
  jobId: z.string().uuid(),
  status: SyncJobStatusSchema,
  metadata: z
    .object({
      processedCount: z.number().int().min(0).optional(),
      existingCount: z.number().int().min(0).optional(),
      newCount: z.number().int().min(0).optional(),
      skippedCount: z.number().int().min(0).optional(),
      errorCount: z.number().int().min(0).optional(),
      duration: z.number().min(0).optional(), // Duration in milliseconds
      errorMessage: z.string().optional(),
      syncedAt: z.string().datetime().optional(),
    })
    .optional(),
});

export const UpdateSyncJobOutputSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  lastSyncedAt: z.string().datetime().nullable(),
  errorMessage: z.string().nullable(),
  updatedAt: z.string().datetime(),
});

export const GetSyncJobStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});

export const GetSyncJobStatusOutputSchema = z.object({
  id: z.string().uuid(),
  dataSourceId: z.string().uuid(),
  databaseName: z.string(),
  schemaName: z.string(),
  tableName: z.string(),
  columnName: z.string(),
  status: z.string(),
  lastSyncedAt: z.string().datetime().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const BulkUpdateSyncJobsInputSchema = z.object({
  jobIds: z.array(z.string().uuid()).min(1),
  status: SyncJobStatusSchema,
  errorMessage: z.string().optional(),
});

export const BulkUpdateSyncJobsOutputSchema = z.object({
  updated: z.number().int().min(0),
  jobIds: z.array(z.string().uuid()),
});

// ============================================================================
// TYPES
// ============================================================================

export type SyncJobStatus = z.infer<typeof SyncJobStatusSchema>;
export type UpdateSyncJobStatusInput = z.infer<typeof UpdateSyncJobStatusInputSchema>;
export type UpdateSyncJobOutput = z.infer<typeof UpdateSyncJobOutputSchema>;
export type GetSyncJobStatusInput = z.infer<typeof GetSyncJobStatusInputSchema>;
export type GetSyncJobStatusOutput = z.infer<typeof GetSyncJobStatusOutputSchema>;
export type BulkUpdateSyncJobsInput = z.infer<typeof BulkUpdateSyncJobsInputSchema>;
export type BulkUpdateSyncJobsOutput = z.infer<typeof BulkUpdateSyncJobsOutputSchema>;

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Update the status of a sync job
 * Records completion, failure, or progress updates
 */
export async function updateSyncJobStatus(
  input: UpdateSyncJobStatusInput
): Promise<UpdateSyncJobOutput> {
  try {
    const validated = UpdateSyncJobStatusInputSchema.parse(input);

    // Build update object
    const updateData: Record<string, unknown> = {
      status: validated.status,
    };

    // Handle success case
    if (validated.status === 'success' && validated.metadata?.syncedAt) {
      updateData.lastSyncedAt = validated.metadata.syncedAt;
      updateData.errorMessage = null; // Clear any previous error
    }

    // Handle failure case
    if (validated.status === 'failed' && validated.metadata?.errorMessage) {
      updateData.errorMessage = validated.metadata.errorMessage;
    }

    // Update the job
    const [updated] = await db
      .update(storedValuesSyncJobs)
      .set(updateData)
      .where(eq(storedValuesSyncJobs.id, validated.jobId))
      .returning({
        id: storedValuesSyncJobs.id,
        status: storedValuesSyncJobs.status,
        lastSyncedAt: storedValuesSyncJobs.lastSyncedAt,
        errorMessage: storedValuesSyncJobs.errorMessage,
      });

    if (!updated) {
      throw new Error(`Sync job not found: ${validated.jobId}`);
    }

    return UpdateSyncJobOutputSchema.parse({
      ...updated,
      lastSyncedAt: updated.lastSyncedAt ? new Date(updated.lastSyncedAt).toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in updateSyncJobStatus: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Database error in updateSyncJobStatus: ${error.message}`);
    }

    throw new Error(`Unknown error in updateSyncJobStatus: ${String(error)}`);
  }
}

/**
 * Get the current status of a sync job
 * Useful for monitoring and debugging
 */
export async function getSyncJobStatus(
  input: GetSyncJobStatusInput
): Promise<GetSyncJobStatusOutput> {
  try {
    const validated = GetSyncJobStatusInputSchema.parse(input);

    const [job] = await db
      .select({
        id: storedValuesSyncJobs.id,
        dataSourceId: storedValuesSyncJobs.dataSourceId,
        databaseName: storedValuesSyncJobs.databaseName,
        schemaName: storedValuesSyncJobs.schemaName,
        tableName: storedValuesSyncJobs.tableName,
        columnName: storedValuesSyncJobs.columnName,
        status: storedValuesSyncJobs.status,
        lastSyncedAt: storedValuesSyncJobs.lastSyncedAt,
        errorMessage: storedValuesSyncJobs.errorMessage,
        createdAt: storedValuesSyncJobs.createdAt,
      })
      .from(storedValuesSyncJobs)
      .where(eq(storedValuesSyncJobs.id, validated.jobId))
      .limit(1);

    if (!job) {
      throw new Error(`Sync job not found: ${validated.jobId}`);
    }

    return GetSyncJobStatusOutputSchema.parse({
      ...job,
      lastSyncedAt: job.lastSyncedAt ? new Date(job.lastSyncedAt).toISOString() : null,
      createdAt: new Date(job.createdAt).toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in getSyncJobStatus: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Database error in getSyncJobStatus: ${error.message}`);
    }

    throw new Error(`Unknown error in getSyncJobStatus: ${String(error)}`);
  }
}

/**
 * Mark a sync job as in progress
 * Called when starting to process a job
 */
export async function markSyncJobInProgress(jobId: string): Promise<UpdateSyncJobOutput> {
  return updateSyncJobStatus({
    jobId,
    status: 'in_progress',
  });
}

/**
 * Mark a sync job as completed successfully
 */
export async function markSyncJobCompleted(
  jobId: string,
  metadata?: {
    processedCount?: number;
    existingCount?: number;
    newCount?: number;
    duration?: number;
  }
): Promise<UpdateSyncJobOutput> {
  return updateSyncJobStatus({
    jobId,
    status: 'success',
    metadata: {
      ...metadata,
      syncedAt: new Date().toISOString(),
    },
  });
}

/**
 * Mark a sync job as failed
 */
export async function markSyncJobFailed(
  jobId: string,
  errorMessage: string
): Promise<UpdateSyncJobOutput> {
  return updateSyncJobStatus({
    jobId,
    status: 'failed',
    metadata: {
      errorMessage,
    },
  });
}

/**
 * Bulk update multiple sync jobs
 * Useful for cancelling or resetting multiple jobs at once
 */
export async function bulkUpdateSyncJobs(
  input: BulkUpdateSyncJobsInput
): Promise<BulkUpdateSyncJobsOutput> {
  try {
    const validated = BulkUpdateSyncJobsInputSchema.parse(input);

    const updateData: Record<string, unknown> = {
      status: validated.status,
    };

    if (validated.errorMessage) {
      updateData.errorMessage = validated.errorMessage;
    }

    const updated = await db
      .update(storedValuesSyncJobs)
      .set(updateData)
      .where(inArray(storedValuesSyncJobs.id, validated.jobIds))
      .returning({
        id: storedValuesSyncJobs.id,
      });

    return BulkUpdateSyncJobsOutputSchema.parse({
      updated: updated.length,
      jobIds: updated.map((job) => job.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in bulkUpdateSyncJobs: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Database error in bulkUpdateSyncJobs: ${error.message}`);
    }

    throw new Error(`Unknown error in bulkUpdateSyncJobs: ${String(error)}`);
  }
}
