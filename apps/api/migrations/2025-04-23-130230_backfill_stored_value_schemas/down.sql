-- This file should undo anything in `up.sql`

DO $$
DECLARE
    ds_id UUID;
    schema_name TEXT;
    drop_schema_sql TEXT;
    trigger_name_insert TEXT;
    trigger_name_update TEXT;
    input_fn_name TEXT;
    index_name_filter TEXT;
    index_name_unique TEXT;
    index_name_hnsw TEXT;
BEGIN
    RAISE NOTICE 'Starting rollback of stored value schemas for existing data sources...';

    FOR ds_id IN
        SELECT id FROM public.data_sources WHERE deleted_at IS NULL -- Assuming we only created for non-deleted
    LOOP
        schema_name := format('ds_%s', replace(ds_id::text, '-', '_'));

        RAISE NOTICE 'Processing data_source_id: %, Dropping schema: %', ds_id, schema_name;

        -- Drop Schema (CASCADE will remove the table and index within it)
        drop_schema_sql := format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
        RAISE NOTICE 'Executing: %', drop_schema_sql;
        EXECUTE drop_schema_sql;

        RAISE NOTICE 'Dropping HNSW index idx_embedding_hnsw_% on %.searchable_column_values', schema_name, schema_name;
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', schema_name, index_name_hnsw);

        -- Drop the unique value index
        index_name_unique := 'idx_unique_value_' || schema_name;
        RAISE NOTICE 'Dropping unique value index % on %.searchable_column_values', index_name_unique, schema_name;
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', schema_name, index_name_unique);

        RAISE NOTICE 'Finished rollback for schema: %', schema_name;

    END LOOP;

    RAISE NOTICE 'Finished rollback of stored value schemas.';
END;
$$ LANGUAGE plpgsql;

-- Note: Rolling back does not remove the 'halfvec' extension itself.
-- It only removes the schemas created by the corresponding up.sql.
