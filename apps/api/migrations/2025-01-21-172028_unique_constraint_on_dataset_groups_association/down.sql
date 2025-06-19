-- This file should undo anything in `up.sql`
ALTER TABLE dataset_groups_permissions
DROP CONSTRAINT unique_dataset_group_permission;
