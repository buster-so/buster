-- Your SQL goes here
CREATE TYPE dataset_type_enum AS enum ('table', 'view', 'materializedView');

CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    database_name TEXT NOT NULL,
    when_to_use TEXT,
    when_not_to_use TEXT,
    type dataset_type_enum NOT NULL,
    definition TEXT NOT NULL,
    schema TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    imported BOOLEAN NOT NULL DEFAULT FALSE,
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    updated_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE
    datasets ENABLE ROW LEVEL SECURITY;