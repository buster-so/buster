-- Your SQL goes here

-- Add data_metadata column to metric_files table
ALTER TABLE metric_files ADD COLUMN data_metadata JSONB;

-- Create index for faster queries
CREATE INDEX metric_files_data_metadata_idx ON metric_files USING GIN (data_metadata);
