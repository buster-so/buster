-- This file should undo anything in `up.sql`

-- Drop index first
DROP INDEX IF EXISTS metric_files_data_metadata_idx;

-- Drop column
ALTER TABLE metric_files DROP COLUMN IF EXISTS data_metadata;
