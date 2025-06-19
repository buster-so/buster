-- Your SQL goes here
create table permission_groups_to_identities (
    permission_group_id uuid not null,
    identity_id uuid not null,
    identity_type identity_type_enum not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    created_by uuid not null references users(id) on update cascade,
    updated_by uuid not null references users(id) on update cascade,
    primary key (permission_group_id, identity_id, identity_type)
);

-- Enable Row Level Security
ALTER TABLE permission_groups_to_identities ENABLE ROW LEVEL SECURITY;    