-- Migration: add_env_to_data_sources
-- Created: 2024-11-26-141715
-- Original: 2024-11-26-141715_add_env_to_data_sources

ALTER TABLE data_sources
ADD COLUMN env VARCHAR NOT NULL DEFAULT 'dev';