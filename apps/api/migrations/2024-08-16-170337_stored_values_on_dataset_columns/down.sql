-- This file should undo anything in `up.sql`
alter table
    dataset_columns drop column stored_values_last_synced;

alter table
    dataset_columns drop column stored_values_count;

alter table
    dataset_columns drop column stored_values_error;

alter table
    dataset_columns drop column stored_values_status;

alter table
    dataset_columns drop column stored_values;

drop type stored_values_status_enum;