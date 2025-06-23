-- This file should undo anything in `up.sql`

-- Drop indexes
DROP INDEX IF EXISTS dashboard_files_deleted_at_idx;
DROP INDEX IF EXISTS dashboard_files_created_by_idx;
DROP INDEX IF EXISTS dashboard_files_organization_id_idx;

-- Drop table
DROP TABLE IF EXISTS dashboard_files;
