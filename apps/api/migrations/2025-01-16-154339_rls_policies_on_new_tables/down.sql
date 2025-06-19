-- This file should undo anything in `up.sql`
DROP POLICY dataset_groups_policy ON dataset_groups;
DROP POLICY dataset_permissions_policy ON dataset_permissions;
DROP POLICY datasets_to_dataset_groups_policy ON datasets_to_dataset_groups;
DROP POLICY datasets_to_permission_groups_policy ON datasets_to_permission_groups;
DROP POLICY permission_groups_to_users_policy ON permission_groups_to_users;
DROP POLICY diesel_schema_migrations_policy ON __diesel_schema_migrations;

ALTER TABLE dataset_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE datasets_to_dataset_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE datasets_to_permission_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE permission_groups_to_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE __diesel_schema_migrations DISABLE ROW LEVEL SECURITY;
