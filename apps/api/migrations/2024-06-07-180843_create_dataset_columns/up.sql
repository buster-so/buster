-- Your SQL goes here
create table dataset_columns (
    id uuid primary key,
    dataset_id uuid not null,
    name text not null,
    type text not null,
    description text,
    nullable boolean not null,
    created_at timestamptz not null,
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

-- Add unique constraint for dataset_id and name combination
ALTER TABLE dataset_columns ADD CONSTRAINT unique_dataset_column_name UNIQUE (dataset_id, name);

-- Enable Row Level Security
ALTER TABLE dataset_columns ENABLE ROW LEVEL SECURITY;