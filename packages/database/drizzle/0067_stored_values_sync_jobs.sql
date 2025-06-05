-- Migration: stored_values_sync_jobs
-- Created: 2025-04-23-131710
-- Original: 2025-04-23-131710_stored_values_sync_jobs

-- Create the table to track sync jobs
CREATE TABLE stored_values_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    database_name TEXT NOT NULL,
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE, -- Nullable initially, updated on successful sync
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL, -- Changed from sync_status_enum
    error_message TEXT -- Nullable, only populated on error status
);

-- Add indexes for common query patterns
CREATE INDEX idx_stored_values_sync_jobs_data_source_id ON stored_values_sync_jobs(data_source_id);
CREATE INDEX idx_stored_values_sync_jobs_status ON stored_values_sync_jobs(status);
DROP INDEX IF EXISTS idx_stored_values_sync_jobs_schema_table_column;
CREATE INDEX idx_stored_values_sync_jobs_db_schema_table_column ON stored_values_sync_jobs(database_name, schema_name, table_name, column_name);

COMMENT ON TABLE stored_values_sync_jobs IS 'Tracks the synchronization status of individual columns for stored value embeddings.';
COMMENT ON COLUMN stored_values_sync_jobs.last_synced_at IS 'Timestamp of the last successful synchronization for this column.';
COMMENT ON COLUMN stored_values_sync_jobs.status IS 'Current status (e.g., pending, success, error) of the synchronization job for this column.';
COMMENT ON COLUMN stored_values_sync_jobs.error_message IS 'Details of the error if the sync job failed.';