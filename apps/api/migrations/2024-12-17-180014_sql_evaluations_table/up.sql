-- Your SQL goes here
create table sql_evaluations (
    id uuid primary key default uuid_generate_v4(),
    evaluation_obj jsonb not null,
    evaluation_summary text not null,
    score text not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone
);

alter table messages add column sql_evaluation_id uuid;