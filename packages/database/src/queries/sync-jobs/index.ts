/**
 * Sync Jobs Query Helpers
 *
 * Functions for managing searchable values sync jobs
 * Used by the searchable-values sync system to track and manage
 * synchronization of text values to Turbopuffer
 */

// ============================================================================
// EXISTING SYNC JOBS QUERIES
// ============================================================================
export {
  // Functions
  getExistingSyncJobs,
  getSyncJobsForDataSource,
  countPendingSyncJobs,
  // Types
  type GetExistingSyncJobsInput,
  type ExistingSyncJob,
  type GetExistingSyncJobsOutput,
  // Schemas
  GetExistingSyncJobsInputSchema,
  ExistingSyncJobSchema,
  GetExistingSyncJobsOutputSchema,
} from './get-existing-jobs';

// ============================================================================
// SYNC JOB CREATION
// ============================================================================
export {
  // Functions
  createSearchableValuesSyncJob,
  batchCreateSyncJobs,
  upsertSyncJob,
  // Types
  type CreateSyncJobInput,
  type CreateSyncJobOutput,
  type BatchCreateSyncJobsInput,
  type BatchCreateSyncJobsOutput,
  // Schemas
  CreateSyncJobInputSchema,
  CreateSyncJobOutputSchema,
  BatchCreateSyncJobsInputSchema,
  BatchCreateSyncJobsOutputSchema,
} from './create-sync-job';

// ============================================================================
// SYNC JOB STATUS UPDATES
// ============================================================================
export {
  // Functions
  updateSyncJobStatus,
  getSyncJobStatus,
  markSyncJobInProgress,
  markSyncJobCompleted,
  markSyncJobFailed,
  bulkUpdateSyncJobs,
  // Types
  type SyncJobStatus,
  type UpdateSyncJobStatusInput,
  type UpdateSyncJobOutput,
  type GetSyncJobStatusInput,
  type GetSyncJobStatusOutput,
  type BulkUpdateSyncJobsInput,
  type BulkUpdateSyncJobsOutput,
  // Schemas
  SyncJobStatusSchema,
  UpdateSyncJobStatusInputSchema,
  UpdateSyncJobOutputSchema,
  GetSyncJobStatusInputSchema,
  GetSyncJobStatusOutputSchema,
  BulkUpdateSyncJobsInputSchema,
  BulkUpdateSyncJobsOutputSchema,
} from './update-sync-job';
