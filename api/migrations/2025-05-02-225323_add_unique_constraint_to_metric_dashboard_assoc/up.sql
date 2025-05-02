-- Your SQL goes here
-- Drop the existing primary key constraint
ALTER TABLE metric_files_to_dashboard_files
DROP CONSTRAINT metric_files_to_dashboard_files_pkey;

-- Add the new composite primary key covering IDs and versions
ALTER TABLE metric_files_to_dashboard_files
ADD PRIMARY KEY (metric_file_id, dashboard_file_id, metric_version_number, dashboard_version_number);
