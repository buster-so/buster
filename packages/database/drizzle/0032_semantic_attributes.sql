-- Migration: semantic_attributes
-- Created: 2024-11-26-170536
-- Original: 2024-11-26-170536_semantic_attributes

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