-- Your SQL goes here

-- Ensure the pgvector extension is available (optional, but good practice)

DO $$
DECLARE
    ds_id UUID;
    schema_name TEXT;
    create_schema_sql TEXT;
    create_table_sql TEXT;
    create_index_sql TEXT;
    index_name TEXT;
    filter_index_name TEXT;
    create_filter_index_sql TEXT;
    input_fn_name TEXT;
    create_input_fn_sql TEXT;
    insert_trigger_name TEXT;
    create_insert_trigger_sql TEXT;
    update_trigger_name TEXT;
    create_update_trigger_sql TEXT;
    index_name_filter TEXT;
    index_name_unique TEXT;
BEGIN
    RAISE NOTICE 'Starting backfill of stored value schemas for existing data sources...';

    FOR ds_id IN
        SELECT id FROM public.data_sources WHERE deleted_at IS NULL
    LOOP
        schema_name := format('ds_%s', replace(ds_id::text, '-', '_'));
        index_name := format('idx_embedding_hnsw_%s', replace(ds_id::text, '-', '_'));

        RAISE NOTICE 'Processing data_source_id: %, Creating schema: %', ds_id, schema_name;

        -- Create Schema
        create_schema_sql := format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
        RAISE NOTICE 'Executing: %', create_schema_sql;
        EXECUTE create_schema_sql;

        -- Create Table
        create_table_sql := format(
            'CREATE TABLE IF NOT EXISTS %I.searchable_column_values ('
                'id uuid PRIMARY KEY DEFAULT gen_random_uuid(), '
                'value text NOT NULL, '
                'database_name text NOT NULL, '
                'column_name text NOT NULL, '
                'table_name text NOT NULL, '
                'schema_name text NOT NULL, '
                'embedding public.halfvec(1536), ' -- Ensure public.halfvec or correct schema
                'synced_at timestamp with time zone DEFAULT now()'
            ')', schema_name
        );
        RAISE NOTICE 'Executing: %', create_table_sql;
        EXECUTE create_table_sql;

        -- Create Index
        create_index_sql := format(
            'CREATE INDEX IF NOT EXISTS %I ON %I.searchable_column_values '
            'USING hnsw (embedding public.halfvec_cosine_ops)', -- Ensure correct opclass schema
            index_name, schema_name
        );
        RAISE NOTICE 'Executing: %', create_index_sql;
        EXECUTE create_index_sql;

        -- Create Composite Filter Index
        filter_index_name := format('idx_filter_%s', replace(ds_id::text, '-', '_'));
        create_filter_index_sql := format(
            'CREATE INDEX IF NOT EXISTS %I ON %I.searchable_column_values (database_name, schema_name, table_name, column_name)',
            filter_index_name, schema_name
        );
        RAISE NOTICE 'Executing: %', create_filter_index_sql;
        EXECUTE create_filter_index_sql;

        -- Create a composite B-tree index for filtering if it doesn't exist
        index_name_filter := 'idx_filter_' || schema_name;
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I."searchable_column_values" (database_name, schema_name, table_name, column_name);', index_name_filter, schema_name);

        -- Create a unique index for the combination of value and identifiers if it doesn't exist
        index_name_unique := 'idx_unique_value_' || schema_name;
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I."searchable_column_values" (value, database_name, schema_name, table_name, column_name);', index_name_unique, schema_name);

    END LOOP;

    RAISE NOTICE 'Finished backfill of stored value schemas.';
END;
$$ LANGUAGE plpgsql;
