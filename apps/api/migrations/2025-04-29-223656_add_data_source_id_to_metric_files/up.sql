-- Your SQL goes here

-- Add the data_source_id column to metric_files
ALTER TABLE metric_files
ADD COLUMN data_source_id UUID;

-- Backfill the data_source_id using information from the content field and datasets table
WITH metric_dataset AS (
    SELECT
        mf.id AS metric_id,
        (mf.content->>'datasetIds')::jsonb ->> 0 AS first_dataset_id_str -- Extract the first datasetId as text
    FROM metric_files mf
    WHERE mf.content->>'datasetIds' IS NOT NULL AND jsonb_array_length((mf.content->>'datasetIds')::jsonb) > 0
),
 dataset_source AS (
    SELECT
        ds.id AS dataset_id,
        ds.data_source_id
    FROM datasets ds
)
UPDATE metric_files
SET data_source_id = ds.data_source_id
FROM metric_dataset md
JOIN dataset_source ds ON ds.dataset_id = (md.first_dataset_id_str)::uuid -- Cast the text datasetId to UUID for joining
WHERE metric_files.id = md.metric_id;

-- Identify metric_files to be deleted (those that couldn't be backfilled)
CREATE TEMP TABLE metric_files_to_delete AS
SELECT id FROM metric_files
WHERE data_source_id IS NULL;

-- Clean up related tables before deleting the metric_files
-- NOTE: Assumes the AssetTypeEnum value for metric files is 'metric_file'. Verify this.
DELETE FROM metric_files_to_dashboard_files WHERE metric_file_id IN (SELECT id FROM metric_files_to_delete);
DELETE FROM asset_permissions WHERE asset_id IN (SELECT id FROM metric_files_to_delete) AND asset_type = 'metric_file';
DELETE FROM collections_to_assets WHERE asset_id IN (SELECT id FROM metric_files_to_delete) AND asset_type = 'metric_file';
DELETE FROM user_favorites WHERE asset_id IN (SELECT id FROM metric_files_to_delete) AND asset_type = 'metric_file';

-- Delete metric_files that couldn't be backfilled
DELETE FROM metric_files
WHERE id IN (SELECT id FROM metric_files_to_delete);

-- Drop the temporary table
DROP TABLE metric_files_to_delete;

-- Add the NOT NULL constraint after backfilling and deleting orphans
ALTER TABLE metric_files
ALTER COLUMN data_source_id SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE metric_files
ADD CONSTRAINT fk_data_source
FOREIGN KEY (data_source_id)
REFERENCES data_sources (id);
