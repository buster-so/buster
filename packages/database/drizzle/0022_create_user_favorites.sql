-- Migration: create_user_favorites
-- Created: 2024-07-23-214547
-- Original: 2024-07-23-214547_create_user_favorites

create table user_favorites (
    user_id uuid not null references users(id) on update cascade,
    asset_id uuid not null,
    asset_type asset_type_enum not null,
    order_index integer not null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    primary key (user_id, asset_id, asset_type)
);

-- Enable Row Level Security
ALTER TABLE
    user_favorites ENABLE ROW LEVEL SECURITY;