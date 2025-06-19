-- Create the junction table between metric_files and dashboard_files
CREATE TABLE metric_files_to_dashboard_files (
    metric_file_id UUID NOT NULL REFERENCES metric_files(id),
    dashboard_file_id UUID NOT NULL REFERENCES dashboard_files(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    PRIMARY KEY (metric_file_id, dashboard_file_id)
);

-- Add indexes for efficient querying
CREATE INDEX metric_files_to_dashboard_files_metric_id_idx ON metric_files_to_dashboard_files(metric_file_id);
CREATE INDEX metric_files_to_dashboard_files_dashboard_id_idx ON metric_files_to_dashboard_files(dashboard_file_id);
CREATE INDEX metric_files_to_dashboard_files_deleted_at_idx ON metric_files_to_dashboard_files(deleted_at);