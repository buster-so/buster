-- Migration: add_database_identifier_to_datasets
-- Created: 2025-02-06-220857
-- Original: 2025-02-06-220857_add_database_identifier_to_datasets

ALTER TABLE datasets ADD COLUMN database_identifier TEXT NULL;