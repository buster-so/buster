-- Migration: add_unique_constraint_to_data_sources
-- Created: 2024-11-26-151750
-- Original: 2024-11-26-151750_add_unique_constraint_to_data_sources

ALTER TABLE data_sources 
ADD CONSTRAINT data_sources_name_organization_id_env_key 
UNIQUE (name, organization_id, env);