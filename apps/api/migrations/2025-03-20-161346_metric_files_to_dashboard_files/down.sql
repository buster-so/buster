-- Revert the migration by dropping the table and indexes
DROP INDEX IF EXISTS metric_files_to_dashboard_files_deleted_at_idx;
DROP INDEX IF EXISTS metric_files_to_dashboard_files_dashboard_id_idx;
DROP INDEX IF EXISTS metric_files_to_dashboard_files_metric_id_idx;
DROP TABLE IF EXISTS metric_files_to_dashboard_files;