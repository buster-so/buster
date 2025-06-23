-- Your SQL goes here
ALTER TABLE
    dataset_columns
ADD
    COLUMN semantic_type TEXT,
ADD
    COLUMN dim_type TEXT,
ADD
    COLUMN expr TEXT;

-- Add model for referencing SQL model.
ALTER TABLE
    datasets
ADD
    COLUMN model TEXT;