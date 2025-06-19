-- This file should undo anything in `up.sql`
-- Revert team role enum changes
ALTER TYPE team_role_enum RENAME TO team_role_enum_old;
CREATE TYPE team_role_enum AS ENUM ('owner', 'member');
ALTER TABLE teams_to_users ALTER COLUMN role TYPE team_role_enum USING
  CASE 
    WHEN role::text = 'manager' THEN 'owner'::team_role_enum
    ELSE role::text::team_role_enum
  END;
DROP TYPE team_role_enum_old;

-- Drop dataset permissions related tables and indexes
DROP INDEX dataset_permissions_dataset_id_idx;
DROP INDEX dataset_permissions_permission_lookup_idx;
DROP INDEX dataset_permissions_deleted_at_idx;
DROP TABLE dataset_permissions;

-- Drop permission groups join table and index
DROP INDEX permission_groups_to_users_user_id_idx;
DROP TABLE permission_groups_to_users;

-- Drop dataset groups join table and index
DROP INDEX datasets_to_dataset_groups_dataset_group_id_idx;
DROP TABLE datasets_to_dataset_groups;

-- Drop dataset groups table and index
DROP INDEX dataset_groups_deleted_at_idx;
DROP TABLE dataset_groups;

-- Remove status column and enum
ALTER TABLE users_to_organizations DROP COLUMN status;
DROP TYPE user_organization_status_enum;

-- Revert user organization role changes
ALTER TABLE users_to_organizations ALTER COLUMN role DROP DEFAULT;

ALTER TYPE user_organization_role_enum RENAME TO user_organization_role_enum_old;
CREATE TYPE user_organization_role_enum AS ENUM ('owner', 'admin', 'querier');

ALTER TABLE users_to_organizations
    ALTER COLUMN role TYPE user_organization_role_enum
    USING CASE
        WHEN role::text = 'workspace_admin' THEN 'owner'
        WHEN role::text = 'data_admin' THEN 'admin'
        ELSE 'querier'
    END::user_organization_role_enum;

ALTER TABLE users_to_organizations ALTER COLUMN role SET DEFAULT 'querier';

DROP TYPE user_organization_role_enum_old;
