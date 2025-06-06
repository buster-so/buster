-- Migration: fix_dataset_to_dataset_groups_table
-- Created: 2025-01-21-184456
-- Original: 2025-01-21-184456_fix_dataset_to_dataset_groups_table

ALTER TABLE datasets_to_dataset_groups
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN deleted_at TIMESTAMPTZ;