-- This file should undo anything in `up.sql`

-- Drop the composite primary key covering IDs and versions
ALTER TABLE metric_files_to_dashboard_files
DROP CONSTRAINT metric_files_to_dashboard_files_pkey;

-- Re-add the original primary key constraint
ALTER TABLE metric_files_to_dashboard_files
ADD CONSTRAINT metric_files_to_dashboard_files_pkey PRIMARY KEY (metric_file_id, dashboard_file_id);
