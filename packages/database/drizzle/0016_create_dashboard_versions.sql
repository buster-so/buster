-- Migration: create_dashboard_versions
-- Created: 2024-06-03-224321
-- Original: 2024-06-03-224321_create_dashboard_versions

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