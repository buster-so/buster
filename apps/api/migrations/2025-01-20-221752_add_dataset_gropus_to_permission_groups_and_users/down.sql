-- This file should undo anything in `up.sql`
DROP TRIGGER IF EXISTS update_dataset_groups_permissions_updated_at ON dataset_groups_permissions;
DROP INDEX IF EXISTS dataset_groups_permissions_organization_id_idx;
DROP INDEX IF EXISTS dataset_groups_permissions_permission_id_idx;
DROP INDEX IF EXISTS dataset_groups_permissions_dataset_group_id_idx;
DROP TABLE IF EXISTS dataset_groups_permissions;
