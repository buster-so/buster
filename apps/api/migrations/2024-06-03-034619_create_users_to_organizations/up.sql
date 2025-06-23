-- Your SQL goes here
create type user_organization_role_enum as enum ('owner', 'member', 'admin');

create type sharing_setting_enum as enum ('none', 'team', 'organization', 'public');

create table users_to_organizations (
    user_id uuid not null references users(id) on update cascade on delete cascade,
    organization_id uuid not null references organizations(id) on delete cascade,
    role user_organization_role_enum not null default 'member',
    sharing_setting public.sharing_setting_enum not null default 'none' :: sharing_setting_enum,
    edit_sql boolean not null default false,
    upload_csv boolean not null default false,
    export_assets boolean not null default false,
    email_slack_enabled boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    created_by uuid not null references users(id) on update cascade on delete cascade,
    updated_by uuid not null references users(id) on update cascade on delete cascade,
    deleted_by uuid references users(id) on update cascade on delete cascade,
    primary key (user_id, organization_id)
);

Alter table
    users_to_organizations enable row level security;