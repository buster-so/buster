-- Your SQL goes here
CREATE TYPE data_source_onboarding_status_enum AS enum (
    'notStarted',
    'inProgress',
    'completed',
    'failed'
);

CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    secret_id UUID NOT NULL,
    onboarding_status data_source_onboarding_status_enum NOT NULL DEFAULT 'notStarted',
    onboarding_error TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    updated_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE
    data_sources ENABLE ROW LEVEL SECURITY;