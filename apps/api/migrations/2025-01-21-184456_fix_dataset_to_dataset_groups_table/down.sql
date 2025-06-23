-- This file should undo anything in `up.sql`
ALTER TABLE datasets_to_dataset_groups
DROP COLUMN deleted_at,
DROP COLUMN updated_at;
