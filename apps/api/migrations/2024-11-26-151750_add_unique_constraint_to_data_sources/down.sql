-- This file should undo anything in `up.sql`
ALTER TABLE
    data_sources DROP CONSTRAINT data_sources_name_organization_id_env_key;