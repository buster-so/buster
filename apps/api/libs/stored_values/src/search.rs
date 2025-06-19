use anyhow::{Context, Result};
use database::pool::get_sqlx_pool;
use futures::future;
use serde_yaml;
use sqlx::FromRow;
use tracing::{debug, warn};
use uuid::Uuid;

/// Represents a single search result from the searchable_column_values table.
#[derive(FromRow, Debug, Clone)]
pub struct StoredValueResult {
    pub id: Uuid,
    pub value: String,
    pub database_name: String,
    pub column_name: String,
    pub table_name: String,
    pub schema_name: String, // This is the schema within the source DB, not the Postgres schema
    pub synced_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Represents a table and column to search within
#[derive(Debug, Clone)]
pub struct SearchTarget {
    pub database_name: String,
    pub schema_name: String,
    pub table_name: String,
    pub column_name: String,
}

/// Searches for values based on semantic similarity using embeddings.
///
/// Assumes the target table has an `embedding` column of type `vector`.
/// Returns results ordered by similarity.
///
/// # Arguments
///
/// * `pool` - The `sqlx::PgPool` for database connections.
/// * `data_source_id` - UUID of the data source to construct the schema name.
/// * `query_embedding` - The pre-computed embedding slice for the query.
/// * `limit` - The maximum number of results.
///
/// # Returns
///
/// A `Result` containing a `Vec` of `StoredValueResult` ordered by similarity.
pub async fn search_values_by_embedding(
    data_source_id: Uuid,
    query_embedding: &[f32],
    limit: i64,
) -> Result<Vec<StoredValueResult>> {
    let schema_name = format!("ds_{}", data_source_id.to_string().replace('-', "_"));

    // 1. Validate embedding
    if query_embedding.is_empty() {
        warn!(%data_source_id, "search_values_by_embedding called with an empty embedding vector.");
        return Ok(vec![]); // Or return an error if appropriate
    }

    // 2. Use embedding array directly in SQL
    // NOTE: If your embedding column is 'halfvec', change '::vector' to '::halfvec' below.
    let vector_literal = format!(
        "'[{}]'::halfvec", // <-- Change to ::halfvec if needed
        query_embedding
            .iter()
            .map(|f| f.to_string())
            .collect::<Vec<String>>()
            .join(",")
    );

    let query_sql = format!(
        r#"
        SELECT
            id, value, database_name, column_name, table_name, schema_name, synced_at
        FROM
            "{schema_name}"."searchable_column_values" as searchable_column_values
        ORDER BY
            searchable_column_values.embedding <=> {vector_literal} ASC
        LIMIT $1
        "#
    );

    debug!(
        %data_source_id,
        %schema_name,
        embedding_len = query_embedding.len(),
        %limit,
        "Executing stored value embedding search with inline vector"
    );

    let mut conn = get_sqlx_pool().acquire().await?;

    // Now we only need to bind the limit parameter
    let results = sqlx::query_as::<_, StoredValueResult>(&query_sql)
        .bind(limit)
        .fetch_all(&mut *conn)
        .await
        .map_err(|db_err| {
            // Log the detailed database error
            warn!(
                %data_source_id,
                %schema_name,
                error = %db_err,
                "Failed to execute embedding search query"
            );
            // Wrap the error with context for upstream handling
            anyhow::Error::new(db_err).context(format!(
                "Failed to execute embedding search query in schema '{}'",
                schema_name
            ))
        })?;

    Ok(results)
}

/// Searches for values based on semantic similarity using embeddings with specific filters.
///
/// This function allows for more targeted searches by filtering on database, schema, table, and column names.
/// All filter parameters are optional - if None is provided for any filter, that filter will not be applied.
///
/// # Arguments
///
/// * `data_source_id` - UUID of the data source to construct the schema name.
/// * `query_embedding` - The pre-computed embedding slice for the query.
/// * `limit` - The maximum number of results.
/// * `database_name` - Optional filter for database name.
/// * `schema_name` - Optional filter for schema name within the source database.
/// * `table_name` - Optional filter for table name.
/// * `column_name` - Optional filter for column name.
///
/// # Returns
///
/// A `Result` containing a `Vec` of `StoredValueResult` ordered by similarity.
pub async fn search_values_by_embedding_with_filters(
    data_source_id: Uuid,
    query_embedding: &[f32],
    limit: i64,
    database_name: Option<&str>,
    schema_name: Option<&str>,
    table_name: Option<&str>,
    column_name: Option<&str>,
) -> Result<Vec<StoredValueResult>> {
    let pg_schema_name = format!("ds_{}", data_source_id.to_string().replace('-', "_"));

    // 1. Validate embedding
    if query_embedding.is_empty() {
        warn!(%data_source_id, "search_values_by_embedding_with_filters called with an empty embedding vector.");
        return Ok(vec![]);
    }

    // 2. Build WHERE clause based on provided filters
    let mut filters = Vec::new();
    let mut bind_idx = 2; // Start at 2 because we have the limit as $1

    if let Some(_) = database_name {
        filters.push(format!("database_name = ${}", bind_idx));
        bind_idx += 1;
    }

    if let Some(_) = schema_name {
        filters.push(format!("schema_name = ${}", bind_idx));
        bind_idx += 1;
    }

    if let Some(_) = table_name {
        filters.push(format!("table_name = ${}", bind_idx));
        bind_idx += 1;
    }

    if let Some(_) = column_name {
        filters.push(format!("column_name = ${}", bind_idx));
        bind_idx += 1;
    }

    // 3. Use embedding array directly in SQL
    // NOTE: If your embedding column is 'halfvec', change '::vector' to '::halfvec' below.
    let vector_literal = format!(
        "'[{}]'::halfvec", // <-- Change to ::halfvec if needed
        query_embedding
            .iter()
            .map(|f| f.to_string())
            .collect::<Vec<String>>()
            .join(",")
    );

    let where_clause = if filters.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", filters.join(" AND "))
    };

    let query_sql = format!(
        r#"
        SELECT
            id, value, database_name, column_name, table_name, schema_name, synced_at
        FROM
            "{pg_schema_name}"."searchable_column_values" as searchable_column_values
        {where_clause}
        ORDER BY
            searchable_column_values.embedding <=> {vector_literal} ASC
        LIMIT $1
        "#
    );

    debug!(
        %data_source_id,
        %pg_schema_name,
        embedding_len = query_embedding.len(),
        filters = ?filters,
        %limit,
        "Executing filtered stored value embedding search with inline vector"
    );

    // 5. Execute the Query with all bind parameters
    let mut conn = get_sqlx_pool().acquire().await?;
    let mut query = sqlx::query_as::<_, StoredValueResult>(&query_sql).bind(limit);

    // Add filter bind parameters
    if let Some(db_name) = database_name {
        query = query.bind(db_name);
    }
    if let Some(schema) = schema_name {
        query = query.bind(schema);
    }
    if let Some(table) = table_name {
        query = query.bind(table);
    }
    if let Some(column) = column_name {
        query = query.bind(column);
    }

    let results = query.fetch_all(&mut *conn).await.map_err(|db_err| {
        warn!(
            %data_source_id,
            %pg_schema_name,
            error = %db_err,
            "Failed to execute filtered embedding search query"
        );
        anyhow::Error::new(db_err).context(format!(
            "Failed to execute filtered embedding search query in schema '{}'",
            pg_schema_name
        ))
    })?;

    Ok(results)
}

/// Searches for values across multiple specified tables and columns in parallel
///
/// This function allows for targeted searching across multiple tables and columns,
/// executing searches in parallel for better performance.
///
/// # Arguments
///
/// * `data_source_id` - UUID of the data source
/// * `query_embedding` - The pre-computed embedding slice for the query
/// * `limit_per_target` - Maximum number of results per target (table/column combination)
/// * `targets` - Vector of SearchTarget specifying which tables/columns to search
///
/// # Returns
///
/// A `Result` containing a `Vec` of `StoredValueResult` ordered by similarity
pub async fn search_values_across_targets(
    data_source_id: Uuid,
    query_embedding: &[f32],
    limit_per_target: i64,
    targets: Vec<SearchTarget>,
) -> Result<Vec<StoredValueResult>> {
    if targets.is_empty() {
        debug!(%data_source_id, "No search targets provided for search_values_across_targets");
        return Ok(vec![]);
    }

    // Create a shared copy of the embedding to avoid cloning for each task
    let embedding = query_embedding.to_vec();

    // Create a future for each search target
    let mut futures = Vec::with_capacity(targets.len());

    for target in targets {
        let target_embedding = embedding.clone();
        let future = tokio::spawn(async move {
            search_values_by_embedding_with_filters(
                data_source_id,
                &target_embedding,
                limit_per_target,
                Some(&target.database_name),
                Some(&target.schema_name),
                Some(&target.table_name),
                Some(&target.column_name),
            )
            .await
        });

        futures.push(future);
    }

    // Wait for all searches to complete
    let results = future::join_all(futures).await;

    // Process results
    let mut all_results = Vec::new();
    for result in results {
        match result {
            Ok(Ok(values)) => {
                all_results.extend(values);
            }
            Ok(Err(e)) => {
                warn!(%data_source_id, error = %e, "Error searching values for a target");
                // Continue with other results
            }
            Err(e) => {
                warn!(%data_source_id, error = %e, "Task join error when searching values");
                // Continue with other results
            }
        }
    }

    // Sort all results by similarity if needed
    // (This would require keeping the similarity score in the results)

    Ok(all_results)
}

// Rename the original function or remove it if no longer needed
// pub async fn search_values_by_substring(...) -> Result<Vec<StoredValueResult>> { ... }

// Tests would need updating to handle embeddings and mocks for LiteLLM

/// Extracts searchable columns from dataset YAML content.
///
/// This function parses the YAML content of a dataset and extracts information about
/// tables and columns that can be searched.
///
/// # Arguments
///
/// * `yml_content` - The YAML content of the dataset
///
/// # Returns
///
/// A `Result` containing a `Vec` of `SearchTarget` representing tables and columns to search
pub fn extract_searchable_columns_from_yaml(yml_content: &str) -> Result<Vec<SearchTarget>> {
    // Parse YAML content
    let yaml: serde_yaml::Value =
        serde_yaml::from_str(yml_content).context("Failed to parse dataset YAML content")?;

    let mut search_targets = Vec::new();

    // Extract database name
    let database_name = yaml["database"].as_str().unwrap_or("unknown");

    // Process tables
    if let Some(tables) = yaml["tables"].as_sequence() {
        for table in tables {
            let schema_name = table["schema"].as_str().unwrap_or("public");
            let table_name = table["name"]
                .as_str()
                .unwrap_or_else(|| table["table"].as_str().unwrap_or("unknown_table"));

            // Process columns
            if let Some(columns) = table["columns"].as_sequence() {
                for column in columns {
                    // Check if column is searchable - this could be based on a flag in the YAML
                    // or based on the data type, or other criteria
                    let column_name = column["name"].as_str().unwrap_or("unknown_column");

                    // For now, consider all text/string/varchar columns as searchable
                    // You might want to refine this based on your specific schema
                    let data_type = column["type"].as_str().unwrap_or("");
                    let is_searchable = data_type.to_lowercase().contains("text")
                        || data_type.to_lowercase().contains("char")
                        || data_type.to_lowercase().contains("string");

                    if is_searchable {
                        search_targets.push(SearchTarget {
                            database_name: database_name.to_string(),
                            schema_name: schema_name.to_string(),
                            table_name: table_name.to_string(),
                            column_name: column_name.to_string(),
                        });
                    }
                }
            }
        }
    }

    Ok(search_targets)
}
