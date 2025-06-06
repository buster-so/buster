-- Migration: create_metric_files_to_datasets_join_table
-- Created: 2025-04-29-223855
-- Original: 2025-04-29-223855_create_metric_files_to_datasets_join_table

-- Create the metric_files_to_datasets join table
CREATE TABLE metric_files_to_datasets (
    metric_file_id UUID NOT NULL,
    dataset_id UUID NOT NULL,
    metric_version_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (metric_file_id, metric_version_number, dataset_id),
    CONSTRAINT fk_metric_file
        FOREIGN KEY (metric_file_id)
        REFERENCES metric_files (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets (id)
        ON DELETE CASCADE
);

-- Backfill the table using data from metric_files.content for version 1
INSERT INTO metric_files_to_datasets (metric_file_id, dataset_id, metric_version_number)
SELECT
    mf.id AS metric_file_id,
    ds.id AS dataset_id,
    1 AS metric_version_number
FROM
    metric_files mf,
    jsonb_array_elements_text((mf.content->>'datasetIds')::jsonb) AS extracted_dataset_id(id)
INNER JOIN datasets ds ON ds.id = (extracted_dataset_id.id)::uuid
WHERE
    mf.content->>'datasetIds' IS NOT NULL
    AND jsonb_typeof((mf.content->>'datasetIds')::jsonb) = 'array'
    AND jsonb_array_length((mf.content->>'datasetIds')::jsonb) > 0
ON CONFLICT (metric_file_id, metric_version_number, dataset_id) DO NOTHING;