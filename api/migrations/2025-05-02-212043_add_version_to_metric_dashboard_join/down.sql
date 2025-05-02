-- This file should undo anything in `up.sql`

ALTER TABLE metric_files_to_dashboard_files
DROP COLUMN version_number;
