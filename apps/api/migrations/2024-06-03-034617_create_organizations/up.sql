-- Your SQL goes here
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;