-- This file should undo anything in `up.sql`
ALTER TABLE datasets
DROP CONSTRAINT datasets_database_name_data_source_id_key;
