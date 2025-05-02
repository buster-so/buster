-- Your SQL goes here

-- Add the version_number column, initially allowing NULLs to avoid default value issues
ALTER TABLE metric_files_to_dashboard_files
ADD COLUMN version_number INTEGER;

-- Update the version_number based on the highest key in the metric_files.version_history JSONB
WITH latest_versions AS (
    SELECT
        id AS metric_file_id,
        -- Extract all keys, filter for numeric keys, unnest them, convert to integer, find the max
        (
            SELECT MAX(key::INTEGER)
            FROM jsonb_object_keys(version_history) AS key
            WHERE key ~ '^[0-9]+$' -- Only consider keys that are valid integers
        ) AS latest_version
    FROM metric_files
    WHERE jsonb_typeof(version_history) = 'object' AND version_history::text != '{}'::text
)
UPDATE metric_files_to_dashboard_files AS mtd
SET version_number = COALESCE(lv.latest_version, 1) -- Default to 1 if history is empty/null or no numeric keys found
FROM latest_versions AS lv
WHERE mtd.metric_file_id = lv.metric_file_id;

-- If there are metric files linked in the join table that were *not* updated
-- (e.g., because their version_history was null, empty, or had no numeric keys),
-- set their version_number to 1.
UPDATE metric_files_to_dashboard_files
SET version_number = 1
WHERE version_number IS NULL;

-- Now that the column is populated, make it non-nullable
ALTER TABLE metric_files_to_dashboard_files
ALTER COLUMN version_number SET NOT NULL;
