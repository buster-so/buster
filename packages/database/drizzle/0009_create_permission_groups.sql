-- Migration: create_permission_groups
-- Created: 2024-06-03-221610
-- Original: 2024-06-03-221610_create_permission_groups

create table permission_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    updated_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE
    permission_groups ENABLE ROW LEVEL SECURITY;