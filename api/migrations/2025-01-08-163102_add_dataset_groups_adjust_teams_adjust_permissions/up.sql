-- Your SQL goes here
-- Update user_organization_role enum
ALTER TABLE users_to_organizations ALTER COLUMN role DROP DEFAULT;

ALTER TYPE user_organization_role_enum RENAME TO user_organization_role_enum_old;

CREATE TYPE user_organization_role_enum AS ENUM (
    'workspace_admin',
    'data_admin', 
    'querier',
    'restricted_querier',
    'viewer'
);

ALTER TABLE users_to_organizations 
    ALTER COLUMN role TYPE user_organization_role_enum 
    USING CASE 
        WHEN role::text = 'owner' THEN 'workspace_admin'
        WHEN role::text = 'admin' THEN 'data_admin'
        ELSE 'querier'
    END::user_organization_role_enum;

-- Set new default
ALTER TABLE users_to_organizations ALTER COLUMN role SET DEFAULT 'querier';

DROP TYPE user_organization_role_enum_old;

-- Add status enum and column
CREATE TYPE user_organization_status_enum AS ENUM (
    'active',
    'inactive',
    'pending',
    'guest'
);

ALTER TABLE users_to_organizations
    ADD COLUMN status user_organization_status_enum NOT NULL DEFAULT 'active';

-- Create dataset_groups table
CREATE TABLE dataset_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add index on deleted_at for soft delete queries
CREATE INDEX dataset_groups_deleted_at_idx ON dataset_groups(deleted_at);

-- Add indexes
CREATE INDEX dataset_groups_organization_id_idx ON dataset_groups(organization_id);

-- Create datasets_to_dataset_groups join table
CREATE TABLE datasets_to_dataset_groups (
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    dataset_group_id UUID NOT NULL REFERENCES dataset_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (dataset_id, dataset_group_id)
);

-- Add index for faster lookups
CREATE INDEX datasets_to_dataset_groups_dataset_group_id_idx ON datasets_to_dataset_groups(dataset_group_id);

-- Create permission_groups_to_users join table
CREATE TABLE permission_groups_to_users (
    permission_group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (permission_group_id, user_id)
);

-- Add index for faster lookups
CREATE INDEX permission_groups_to_users_user_id_idx ON permission_groups_to_users(user_id);

-- Create dataset_permissions table
CREATE TABLE dataset_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL,
    permission_type VARCHAR NOT NULL CHECK (
        permission_type IN ('user', 'dataset_group', 'permission_group')
    ),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(dataset_id, permission_id, permission_type)
);

-- Add indexes for faster lookups and soft deletes
CREATE INDEX dataset_permissions_deleted_at_idx ON dataset_permissions(deleted_at);
CREATE INDEX dataset_permissions_permission_lookup_idx ON dataset_permissions(permission_id, permission_type);
CREATE INDEX dataset_permissions_dataset_id_idx ON dataset_permissions(dataset_id);

-- Add indexes
CREATE INDEX dataset_permissions_organization_id_idx ON dataset_permissions(organization_id);

-- Drop default before type change
ALTER TABLE teams_to_users ALTER COLUMN role DROP DEFAULT;

-- Update team_role_enum
ALTER TYPE team_role_enum RENAME TO team_role_enum_old;
CREATE TYPE team_role_enum AS ENUM ('manager', 'member');
ALTER TABLE teams_to_users ALTER COLUMN role TYPE team_role_enum USING 
  CASE 
    WHEN role::text = 'owner' THEN 'manager'::team_role_enum
    WHEN role::text = 'admin' THEN 'manager'::team_role_enum
    ELSE 'member'::team_role_enum
  END;

-- Set new default
ALTER TABLE teams_to_users ALTER COLUMN role SET DEFAULT 'member';

DROP TYPE team_role_enum_old;


