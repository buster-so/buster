-- Migration: add_dataset_gropus_to_permission_groups_and_users
-- Created: 2025-01-20-221752
-- Original: 2025-01-20-221752_add_dataset_gropus_to_permission_groups_and_users

CREATE TABLE dataset_groups_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_group_id UUID NOT NULL REFERENCES dataset_groups(id),
    permission_id UUID NOT NULL,
    permission_type VARCHAR NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX dataset_groups_permissions_dataset_group_id_idx ON dataset_groups_permissions(dataset_group_id);
CREATE INDEX dataset_groups_permissions_permission_id_idx ON dataset_groups_permissions(permission_id);
CREATE INDEX dataset_groups_permissions_organization_id_idx ON dataset_groups_permissions(organization_id);