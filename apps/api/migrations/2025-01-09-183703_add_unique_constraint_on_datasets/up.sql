-- Your SQL goes here
        -- First delete any duplicate rows
        DELETE FROM datasets a USING datasets b 
        WHERE a.id > b.id 
        AND a.database_name = b.database_name 
        AND a.data_source_id = b.data_source_id;

        ALTER TABLE datasets
        ADD CONSTRAINT datasets_database_name_data_source_id_key UNIQUE (database_name, data_source_id);