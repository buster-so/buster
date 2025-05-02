-- Your SQL goes here

-- 1. Add metric version column (initially nullable)
ALTER TABLE metric_files_to_dashboard_files
ADD COLUMN metric_version_number INTEGER;

-- 2. Add dashboard version column (initially nullable)
ALTER TABLE metric_files_to_dashboard_files
ADD COLUMN dashboard_version_number INTEGER;

-- 3. Populate metric_version_number
WITH latest_metric_versions AS (
    SELECT
        id AS metric_file_id,
        (
            SELECT MAX(key::INTEGER)
            FROM jsonb_object_keys(version_history) AS key
            WHERE key ~ '^[0-9]+$'
        ) AS latest_version
    FROM metric_files
    WHERE jsonb_typeof(version_history) = 'object' AND version_history::text != '{}'::text
)
UPDATE metric_files_to_dashboard_files AS mtd
SET metric_version_number = COALESCE(lmv.latest_version, 1)
FROM latest_metric_versions AS lmv
WHERE mtd.metric_file_id = lmv.metric_file_id;

-- Set default metric version for rows not updated (e.g., null/empty history)
UPDATE metric_files_to_dashboard_files
SET metric_version_number = 1
WHERE metric_version_number IS NULL;

-- 4. Populate dashboard_version_number (Assuming dashboard_files has similar version_history)
WITH latest_dashboard_versions AS (
    SELECT
        id AS dashboard_file_id,
        (
            SELECT MAX(key::INTEGER)
            FROM jsonb_object_keys(version_history) AS key
            WHERE key ~ '^[0-9]+$'
        ) AS latest_version
    FROM dashboard_files -- Assuming this table exists and has version_history
    WHERE jsonb_typeof(version_history) = 'object' AND version_history::text != '{}'::text
)
UPDATE metric_files_to_dashboard_files AS mtd
SET dashboard_version_number = COALESCE(ldv.latest_version, 1)
FROM latest_dashboard_versions AS ldv
WHERE mtd.dashboard_file_id = ldv.dashboard_file_id;

-- Set default dashboard version for rows not updated (e.g., null/empty history)
UPDATE metric_files_to_dashboard_files
SET dashboard_version_number = 1
WHERE dashboard_version_number IS NULL;


-- 5. Make both columns non-nullable
ALTER TABLE metric_files_to_dashboard_files
ALTER COLUMN metric_version_number SET NOT NULL;

ALTER TABLE metric_files_to_dashboard_files
ALTER COLUMN dashboard_version_number SET NOT NULL;
