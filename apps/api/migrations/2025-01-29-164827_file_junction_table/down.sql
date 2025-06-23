-- This file should undo anything in `up.sql`
-- Drop indexes
DROP INDEX IF EXISTS messages_files_file_id_idx;
DROP INDEX IF EXISTS messages_files_message_id_idx;

-- Drop foreign key constraints
ALTER TABLE messages_to_files
DROP CONSTRAINT IF EXISTS fk_dashboard_files;

ALTER TABLE messages_to_files 
DROP CONSTRAINT IF EXISTS fk_metric_files;

-- Drop table
DROP TABLE IF EXISTS messages_to_files;
