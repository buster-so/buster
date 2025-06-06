-- Migration: stored_values_on_dataset_columns
-- Created: 2024-08-16-170337
-- Original: 2024-08-16-170337_stored_values_on_dataset_columns

create type stored_values_status_enum as enum ('syncing', 'success', 'failed');

alter table
    dataset_columns
add
    column stored_values boolean default false;

alter table
    dataset_columns
add
    column stored_values_status stored_values_status_enum;

alter table
    dataset_columns
add
    column stored_values_error text;

alter table
    dataset_columns
add
    column stored_values_count bigint;

alter table
    dataset_columns
add
    column stored_values_last_synced timestamptz;