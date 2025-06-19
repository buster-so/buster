-- Your SQL goes here
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sharing_setting public.sharing_setting_enum not null default 'none' :: sharing_setting_enum,
    edit_sql boolean not null default false,
    upload_csv boolean not null default false,
    export_assets boolean not null default false,
    email_slack_enabled boolean not null default false,
    created_by UUID NOT NULL references users(id) on update cascade on delete cascade,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE
    teams ENABLE ROW LEVEL SECURITY;