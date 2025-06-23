-- Your SQL goes here
ALTER TABLE data_sources 
ADD CONSTRAINT data_sources_name_organization_id_env_key 
UNIQUE (name, organization_id, env);
