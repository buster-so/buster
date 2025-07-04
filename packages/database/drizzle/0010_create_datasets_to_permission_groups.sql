-- Migration: create_datasets_to_permission_groups
-- Created: 2024-06-03-221828
-- Original: 2024-06-03-221828_create_datasets_to_permission_groups

create table datasets_to_permission_groups (
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    permission_group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ,
    primary key (dataset_id, permission_group_id)
);

-- Enable Row Level Security
ALTER TABLE datasets_to_permission_groups ENABLE ROW LEVEL SECURITY;