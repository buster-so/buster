-- Your SQL goes here
create type asset_permission_role_enum as enum ('owner', 'editor', 'viewer');

CREATE TYPE asset_type_enum AS ENUM ('dashboard', 'thread', 'collection');

create type identity_type_enum as enum ('user', 'team', 'organization');

create table asset_permissions (
    identity_id uuid not null,
    identity_type identity_type_enum not null,
    asset_id uuid not null,
    asset_type asset_type_enum not null,
    role asset_permission_role_enum not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    created_by uuid not null references users(id) on update cascade,
    updated_by uuid not null references users(id) on update cascade,
    primary key (identity_id, asset_id, asset_type, identity_type)
);

-- Enable Row Level Security
ALTER TABLE asset_permissions ENABLE ROW LEVEL SECURITY;