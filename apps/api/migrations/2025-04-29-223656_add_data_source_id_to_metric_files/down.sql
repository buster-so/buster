-- This file should undo anything in `up.sql`

-- Remove the foreign key constraint
ALTER TABLE metric_files
DROP CONSTRAINT IF EXISTS fk_data_source;

-- Drop the data_source_id column
ALTER TABLE metric_files
DROP COLUMN data_source_id;
