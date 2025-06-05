-- Migration: create_terms_to_datasets
-- Created: 2024-07-24-194453
-- Original: 2024-07-24-194453_create_terms_to_datasets

create table terms_to_datasets (
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (term_id, dataset_id)
);

alter table
    terms_to_datasets enable row level security;