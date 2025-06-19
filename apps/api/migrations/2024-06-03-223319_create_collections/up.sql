-- Your SQL goes here
create table collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    updated_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ,
    organization_id UUID NOT NULL references organizations(id) on update cascade
);

-- Enable Row Level Security
ALTER TABLE
    collections ENABLE ROW LEVEL SECURITY;