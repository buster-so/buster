-- Your SQL goes here
create table dashboard_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE dashboard_versions ENABLE ROW LEVEL SECURITY;