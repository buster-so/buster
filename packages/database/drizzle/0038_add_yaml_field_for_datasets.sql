-- Migration: add_yaml_field_for_datasets
-- Created: 2025-01-09-044455
-- Original: 2025-01-09-044455_add_yaml_field_for_datasets

ALTER TABLE datasets
ADD COLUMN yml_file TEXT;