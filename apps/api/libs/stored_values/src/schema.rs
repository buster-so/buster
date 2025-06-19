use anyhow::{Context, Result};
use sqlx::Executor;
use tracing::info;
use uuid::Uuid;

use database::pool::get_sqlx_pool;

/// Creates a dedicated schema and table for storing searchable column values and embeddings.
///
/// The schema name is derived from the data_source_id by replacing hyphens with underscores.
/// It also creates an HNSW index on the embedding column for efficient vector search.
pub async fn create_search_schema(data_source_id: Uuid) -> Result<()> {
    let schema_name = format!("ds_{}", data_source_id.to_string().replace('-', "_"));
    info!(%data_source_id, %schema_name, "Creating search schema and table");

    let pool = get_sqlx_pool();
    let mut conn = pool
        .acquire()
        .await
        .context("Failed to acquire DB connection from pool")?;

    // 1. Create the schema
    let create_schema_query = format!("CREATE SCHEMA IF NOT EXISTS \"{}\"", schema_name);
    conn.execute(create_schema_query.as_str())
        .await
        .with_context(|| format!("Failed to create schema: {}", schema_name))?;
    info!(%schema_name, "Schema created successfully");

    // 2. Create the table within the schema
    let create_table_query = format!(
        r#"
        CREATE TABLE IF NOT EXISTS "{}"."searchable_column_values" (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            value text NOT NULL,
            database_name text NOT NULL,
            column_name text NOT NULL,
            table_name text NOT NULL,
            schema_name text NOT NULL,
            embedding public.halfvec(1536), -- Assuming halfvec is in public or installed extension schema
            synced_at timestamp with time zone DEFAULT now()
        );
        "#,
        schema_name
    );
    conn.execute(create_table_query.as_str())
        .await
        .with_context(|| format!("Failed to create table searchable_column_values in schema {}", schema_name))?;
    info!(%schema_name, "Table searchable_column_values created successfully");

    // 3. Create the HNSW index on the embedding column
    let create_index_query = format!(
        r#"
        CREATE INDEX IF NOT EXISTS idx_embedding_hnsw_{} ON "{}"."searchable_column_values"
        USING hnsw (embedding public.halfvec_cosine_ops); -- Assuming opclass is in public or extension schema
        "#,
        schema_name, // Add schema name to index name for uniqueness
        schema_name
    );
    conn.execute(create_index_query.as_str())
        .await
        .with_context(|| format!("Failed to create HNSW index on embeddings in schema {}", schema_name))?;
    info!(%schema_name, "HNSW index on embeddings created successfully");

    // 4. Create a composite B-tree index for filtering
    let index_name_filter = format!("idx_filter_{}", schema_name); // Unique index name
    let create_filter_index_query = format!(
        r#"
        CREATE INDEX IF NOT EXISTS "{}" ON "{}"."searchable_column_values"
        (database_name, schema_name, table_name, column_name);
        "#,
        index_name_filter, schema_name
    );
    conn.execute(create_filter_index_query.as_str())
        .await
        .with_context(|| format!("Failed to create filter index in schema {}", schema_name))?;
    info!(%schema_name, "Filter index on (db, schema, table, column) created successfully");

    // 5. Create a unique constraint index for the combination of value and identifiers
    let index_name_unique = format!("idx_unique_value_{}", schema_name); // Unique index name
    let create_unique_index_query = format!(
        r#"
        CREATE UNIQUE INDEX IF NOT EXISTS "{}" ON "{}"."searchable_column_values"
        (value, database_name, schema_name, table_name, column_name);
        "#,
        index_name_unique, schema_name
    );
    conn.execute(create_unique_index_query.as_str())
        .await
        .with_context(|| format!("Failed to create unique value index in schema {}", schema_name))?;
    info!(%schema_name, "Unique index on (value, db, schema, table, column) created successfully");

    // 6. Create schema-specific embedding input function
    // let input_fn_name = format!("embedding_input_{}", schema_name);
    // let create_input_fn_query = format!(r#"
    //     CREATE OR REPLACE FUNCTION "{}"."{}"(rec "{}"."searchable_column_values")
    //     RETURNS text
    //     LANGUAGE plpgsql
    //     IMMUTABLE
    //     AS $body$
    //     BEGIN
    //       RETURN rec.value;
    //     END;
    //     $body$;
    //     "#,
    //     schema_name, // Create function within the target schema
    //     input_fn_name,
    //     schema_name // Reference table type within the schema
    // );
    // conn.execute(create_input_fn_query.as_str())
    //     .await
    //     .with_context(|| format!("Failed to create embedding input function in schema {}", schema_name))?;
    // info!(%schema_name, function_name=%input_fn_name, "Embedding input function created");

    // 7. Create INSERT trigger for embeddings
    // let insert_trigger_name = format!("embed_values_on_insert_{}", schema_name);
    // let create_insert_trigger_query = format!(r#"
    //     CREATE OR REPLACE TRIGGER "{}"
    //       AFTER INSERT
    //       ON "{}"."searchable_column_values"
    //       FOR EACH ROW
    //       EXECUTE FUNCTION util.queue_embeddings('{}.{}', 'embedding');
    //     "#,
    //     insert_trigger_name,
    //     schema_name, // Table schema
    //     schema_name, // Function schema
    //     input_fn_name // Function name
    // );
    // conn.execute(create_insert_trigger_query.as_str())
    //     .await
    //     .with_context(|| format!("Failed to create insert trigger for embeddings in schema {}", schema_name))?;
    // info!(%schema_name, trigger_name=%insert_trigger_name, "Insert trigger for embeddings created");

    // 8. Create UPDATE trigger for embeddings
    // let update_trigger_name = format!("embed_values_on_update_{}", schema_name);
    // let create_update_trigger_query = format!(r#"
    //     CREATE OR REPLACE TRIGGER "{}"
    //       AFTER UPDATE OF value -- Only trigger if 'value' changes
    //       ON "{}"."searchable_column_values"
    //       FOR EACH ROW
    //       WHEN (OLD.value IS DISTINCT FROM NEW.value) -- Ensure value actually changed
    //       EXECUTE FUNCTION util.queue_embeddings('{}.{}', 'embedding');
    //     "#,
    //     update_trigger_name,
    //     schema_name, // Table schema
    //     schema_name, // Function schema
    //     input_fn_name // Function name
    // );
    // conn.execute(create_update_trigger_query.as_str())
    //     .await
    //     .with_context(|| format!("Failed to create update trigger for embeddings in schema {}", schema_name))?;
    // info!(%schema_name, trigger_name=%update_trigger_name, "Update trigger for embeddings created");

    Ok(())
}

// Potential future functions:
// pub async fn store_column_value(...) -> Result<()> { ... }
// pub async fn search_similar_values(...) -> Result<Vec<SearchResult>> { ... } 