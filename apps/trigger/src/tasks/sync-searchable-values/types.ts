import { z } from 'zod';

// ============================================================================
// SYNC JOB PROCESSING TYPES
// ============================================================================

/**
 * Input schema for processing an individual sync job
 * This will be used in Ticket 8 for the actual sync orchestration
 */
export const SyncJobPayloadSchema = z.object({
  jobId: z.string().uuid('Job ID must be a valid UUID'),
  dataSourceId: z.string().uuid('Data source ID must be a valid UUID'),
  databaseName: z.string().min(1, 'Database name is required'),
  schemaName: z.string().min(1, 'Schema name is required'),
  tableName: z.string().min(1, 'Table name is required'),
  columnName: z.string().min(1, 'Column name is required'),
  columnType: z.string().optional(),
  maxValues: z.number().int().min(1).optional(), // Optional - when not provided, sync all values
});

export type SyncJobPayload = z.infer<typeof SyncJobPayloadSchema>;

/**
 * Output schema for sync job processing result
 */
export const SyncJobResultSchema = z.object({
  jobId: z.string().uuid(),
  success: z.boolean(),
  processedCount: z.number().int().min(0).optional(),
  existingCount: z.number().int().min(0).optional(),
  newCount: z.number().int().min(0).optional(),
  duration: z.number().int().min(0).optional(),
  error: z.string().optional(),
});

export type SyncJobResult = z.infer<typeof SyncJobResultSchema>;

// ============================================================================
// DAILY SYNC REPORT TYPES
// ============================================================================

/**
 * Summary statistics for a data source sync
 */
export const DataSourceSyncSummarySchema = z.object({
  dataSourceId: z.string().uuid(),
  dataSourceName: z.string(),
  totalColumns: z.number().int().min(0),
  successfulSyncs: z.number().int().min(0),
  failedSyncs: z.number().int().min(0),
  skippedSyncs: z.number().int().min(0),
  totalValuesProcessed: z.number().int().min(0),
  errors: z.array(z.string()).default([]),
});

export type DataSourceSyncSummary = z.infer<typeof DataSourceSyncSummarySchema>;

/**
 * Overall daily sync execution report
 */
export const DailySyncReportSchema = z.object({
  executionId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMs: z.number().int().min(0),
  totalDataSources: z.number().int().min(0),
  totalColumns: z.number().int().min(0),
  successfulSyncs: z.number().int().min(0),
  failedSyncs: z.number().int().min(0),
  skippedSyncs: z.number().int().min(0),
  totalValuesProcessed: z.number().int().min(0),
  dataSourceSummaries: z.array(DataSourceSyncSummarySchema).default([]),
  errors: z.array(z.string()).default([]),
});

export type DailySyncReport = z.infer<typeof DailySyncReportSchema>;

// ============================================================================
// SCHEDULED TASK PAYLOAD TYPES
// ============================================================================

/**
 * Payload received by the scheduled task
 * Includes metadata about the scheduled execution
 */
export const ScheduledTaskPayloadSchema = z.object({
  timestamp: z.string().datetime(),
  lastTimestamp: z.string().datetime().optional(),
  upcoming: z.array(z.string().datetime()).optional(),
});

export type ScheduledTaskPayload = z.infer<typeof ScheduledTaskPayloadSchema>;

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration for sync execution
 */
export const SyncConfigSchema = z.object({
  batchSize: z.number().int().min(1).max(100).default(10),
  maxConcurrentJobs: z.number().int().min(1).max(20).default(5),
  syncType: z.enum(['daily', 'manual', 'initial']).default('daily'),
  dryRun: z.boolean().default(false),
});

export type SyncConfig = z.infer<typeof SyncConfigSchema>;

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Structured error information
 */
export const SyncErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  context: z
    .object({
      dataSourceId: z.string().uuid().optional(),
      jobId: z.string().uuid().optional(),
      columnInfo: z
        .object({
          databaseName: z.string().optional(),
          schemaName: z.string().optional(),
          tableName: z.string().optional(),
          columnName: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  timestamp: z.string().datetime(),
});

export type SyncError = z.infer<typeof SyncErrorSchema>;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Status of a sync job
 * Matches the database schema from Ticket 6
 */
export const SyncJobStatusSchema = z.enum([
  'pending',
  'pending_manual',
  'pending_initial',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
  'skipped',
]);

export type SyncJobStatus = z.infer<typeof SyncJobStatusSchema>;
