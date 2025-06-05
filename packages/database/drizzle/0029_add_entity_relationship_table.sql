-- Migration: add_entity_relationship_table
-- Created: 2024-11-19-195358
-- Original: 2024-11-19-195358_add_entity_relationship_table

create table entity_relationship (
    primary_dataset_id uuid not null,
    foreign_dataset_id uuid not null,
    relationship_type text not null,
    created_at timestamptz not null default now(),
    primary key (primary_dataset_id, foreign_dataset_id)
);