-- Your SQL goes here
create table terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    definition TEXT,
    sql_snippet TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    updated_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE
    terms ENABLE ROW LEVEL SECURITY;