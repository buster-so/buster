-- Your SQL goes here
create extension if not exists vector;

create table if not exists terms_search (
    id uuid primary key default gen_random_uuid(),
    term_id uuid not null,
    content text not null,
    definition text not null,
    fts tsvector generated always as (to_tsvector('simple', content)) stored,
    embedding vector(1024),
    organization_id uuid not null references organizations(id),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    deleted_at timestamp,
    constraint terms_search_term_id_key unique(term_id)
);

create index on terms_search(term_id, organization_id);

ALTER TABLE terms_search ENABLE ROW LEVEL SECURITY;

create index on terms_search using gin(fts);
create index on terms_search using hnsw (embedding vector_cosine_ops);


