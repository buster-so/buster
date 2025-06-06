-- Migration: add_data_metadata_to_metric_files
-- Created: 2025-04-02-225201
-- Original: 2025-04-02-225201_add_data_metadata_to_metric_files

-- Add data_metadata column to metric_files table
ALTER TABLE metric_files ADD COLUMN data_metadata JSONB;

-- Create index for faster queries
CREATE INDEX metric_files_data_metadata_idx ON metric_files USING GIN (data_metadata);