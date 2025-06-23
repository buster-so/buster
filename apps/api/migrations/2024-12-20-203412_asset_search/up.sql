-- Your SQL goes here
create table asset_search (
    id uuid primary key default gen_random_uuid(),
    asset_id uuid not null,
    asset_type text not null,
    content text not null,
    organization_id uuid not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone
);

CREATE EXTENSION IF NOT EXISTS pgroonga;
CREATE INDEX pgroonga_content_index ON asset_search USING pgroonga (content);

create unique index on asset_search(asset_id, asset_type);

ALTER TABLE asset_search ENABLE ROW LEVEL SECURITY;




