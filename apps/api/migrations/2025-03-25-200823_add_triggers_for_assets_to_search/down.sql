-- This file should undo anything in `up.sql`

-- Drop triggers
DROP TRIGGER IF EXISTS sync_collections_search ON collections;
DROP TRIGGER IF EXISTS sync_dashboard_files_search ON dashboard_files;
DROP TRIGGER IF EXISTS sync_metric_files_search ON metric_files;

-- Drop functions
DROP FUNCTION IF EXISTS sync_collections_to_search();
DROP FUNCTION IF EXISTS sync_dashboard_files_to_search();
DROP FUNCTION IF EXISTS sync_metric_files_to_search();
