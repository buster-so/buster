-- This file should undo anything in `up.sql`
ALTER TABLE
    dataset_columns DROP COLUMN semantic_type,
    DROP COLUMN dim_type,
    DROP COLUMN expr;

ALTER TABLE
    datasets DROP COLUMN model;