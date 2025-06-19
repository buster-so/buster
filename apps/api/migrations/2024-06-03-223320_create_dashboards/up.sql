-- Your SQL goes here
create table dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    publicly_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    publicly_enabled_by UUID references users(id) on update cascade,
    public_expiry_date TIMESTAMPTZ,
    password_secret_id UUID,
    created_by UUID NOT NULL references users(id) on update cascade,
    updated_by UUID NOT NULL references users(id) on update cascade,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    organization_id UUID NOT NULL references organizations(id) on update cascade
);

-- Enable Row Level Security
ALTER TABLE
    dashboards ENABLE ROW LEVEL SECURITY;