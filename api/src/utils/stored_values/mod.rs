pub mod search;

pub use search::*;

use anyhow::Result;
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use uuid::Uuid;
use crate::database::enums::StoredValuesStatus;
use crate::database::{lib::get_pg_pool, schema::dataset_columns};
use crate::utils::clients::ai::embedding_router::embedding_router;
use diesel::sql_types::{Text, Uuid as SqlUuid, Array, Float4, Timestamptz, Integer};

use super::query_engine::{data_types::DataType, query_engine::query_engine};

#[derive(Debug, QueryableByName)]
pub struct StoredValueRow {
    #[diesel(sql_type = Text)]
    pub value: String,
}

#[derive(Debug, QueryableByName)]
pub struct StoredValueWithDistance {
    #[diesel(sql_type = Text)]
    pub value: String,
    #[diesel(sql_type = Text)]
    pub column_name: String,
    #[diesel(sql_type = SqlUuid)]
    pub column_id: Uuid,
}

const BATCH_SIZE: usize = 10_000;
const MAX_VALUE_LENGTH: usize = 50;
const TIMEOUT_SECONDS: u64 = 60;

pub async fn ensure_stored_values_schema(organization_id: &Uuid) -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    // Create schema and table using raw SQL
    let schema_name = organization_id.to_string().replace("-", "_");
    let create_schema_sql = format!(
        "CREATE SCHEMA IF NOT EXISTS {}_values",
        schema_name
    );

    let create_table_sql = format!(
        "CREATE TABLE IF NOT EXISTS {}_values.values_v1 (
            value text NOT NULL,
            dataset_id uuid NOT NULL,
            column_name text NOT NULL,
            column_id uuid NOT NULL,
            embedding vector(1024),
            created_at timestamp with time zone NOT NULL DEFAULT now(),
            UNIQUE(dataset_id, column_name, value)
        )",
        schema_name
    );

    let create_index_sql = format!(
        "CREATE INDEX IF NOT EXISTS values_v1_embedding_idx 
         ON {}_values.values_v1 
         USING ivfflat (embedding vector_cosine_ops)",
        schema_name
    );

    diesel::sql_query(create_schema_sql).execute(&mut conn).await?;
    diesel::sql_query(create_table_sql).execute(&mut conn).await?;
    diesel::sql_query(create_index_sql).execute(&mut conn).await?;

    Ok(())
}

pub async fn store_column_values(
    organization_id: &Uuid,
    dataset_id: &Uuid,
    column_name: &str,
    column_id: &Uuid,
    data_source_id: &Uuid,
    schema: &str,
    table_name: &str,
) -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    // Create schema and table if they don't exist
    ensure_stored_values_schema(organization_id).await?;

    // Query distinct values in batches
    let mut offset = 0;
    let mut first_batch = true;
    let schema_name = organization_id.to_string().replace("-", "_");

    loop {
        let query = format!(
            "SELECT DISTINCT \"{}\" as value 
             FROM {}.{} 
             WHERE \"{}\" IS NOT NULL 
             AND length(\"{}\") <= {} 
             ORDER BY \"{}\" 
             LIMIT {} OFFSET {}",
            column_name, schema, table_name, column_name, column_name, 
            MAX_VALUE_LENGTH, column_name, BATCH_SIZE, offset
        );

        let results = match query_engine(dataset_id, &query).await {
            Ok(results) => results,
            Err(e) => {
                tracing::error!("Error querying stored values: {:?}", e);
                if first_batch {
                    return Err(e);
                }
                vec![]
            }
        };
        
        if results.is_empty() {
            break;
        }

        // Extract values from the query results
        let values: Vec<String> = results
            .into_iter()
            .filter_map(|row| {
                if let Some(DataType::Text(Some(value))) = row.get("value") {
                    Some(value.clone())
                } else {
                    None
                }
            })
            .collect();

        if values.is_empty() {
            break;
        }

        // If this is the first batch and we have 15 or fewer values, handle as enum
        if first_batch && values.len() <= 15 {
            // Get current description
            let current_description = diesel::sql_query("SELECT description FROM dataset_columns WHERE id = $1")
                .bind::<SqlUuid, _>(column_id)
                .get_result::<StoredValueRow>(&mut conn)
                .await
                .ok()
                .and_then(|row| Some(row.value));

            // Format new description
            let enum_list = format!("Values for this column are: {}", values.join(", "));
            let new_description = match current_description {
                Some(desc) if !desc.is_empty() => format!("{}. {}", desc, enum_list),
                _ => enum_list,
            };

            // Update column description
            diesel::update(dataset_columns::table)
                .filter(dataset_columns::id.eq(column_id))
                .set((
                    dataset_columns::description.eq(new_description),
                    dataset_columns::stored_values_status.eq(StoredValuesStatus::Success),
                    dataset_columns::stored_values_count.eq(values.len() as i64),
                    dataset_columns::stored_values_last_synced.eq(Utc::now()),
                ))
                .execute(&mut conn)
                .await?;

            return Ok(());
        }

        // Create embeddings for the batch
        let embeddings = create_embeddings_batch(&values).await?;

        // Insert values and embeddings
        for (value, embedding) in values.iter().zip(embeddings.iter()) {
            let insert_sql = format!(
                "INSERT INTO {}_values.values_v1 
                 (value, dataset_id, column_name, column_id, embedding, created_at)
                 VALUES ($1::text, $2::uuid, $3::text, $4::uuid, $5::vector, $6::timestamptz)
                 ON CONFLICT (dataset_id, column_name, value) 
                 DO UPDATE SET created_at = EXCLUDED.created_at",
                schema_name
            );

            diesel::sql_query(insert_sql)
                .bind::<Text, _>(value)
                .bind::<SqlUuid, _>(dataset_id)
                .bind::<Text, _>(column_name)
                .bind::<SqlUuid, _>(column_id)
                .bind::<Array<Float4>, _>(embedding)
                .bind::<Timestamptz, _>(Utc::now())
                .execute(&mut conn)
                .await?;
        }

        first_batch = false;
        offset += BATCH_SIZE;
    }

    Ok(())
}

async fn create_embeddings_batch(values: &[String]) -> Result<Vec<Vec<f32>>> {
    let embeddings = embedding_router(values.to_vec(), true).await?;
    Ok(embeddings)
}

pub async fn search_stored_values(
    organization_id: &Uuid,
    dataset_id: &Uuid,
    query_embedding: Vec<f32>,
    limit: Option<i32>
) -> Result<Vec<(String, String, Uuid)>> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    let limit = limit.unwrap_or(10);

    let schema_name = organization_id.to_string().replace("-", "_");
    let query = format!(
        "SELECT value, column_name, column_id
         FROM {}_values.values_v1
         WHERE dataset_id = $2::uuid
         ORDER BY embedding <=> $1::vector
         LIMIT $3::integer",
        schema_name
    );

    let results: Vec<StoredValueWithDistance> = diesel::sql_query(query)
        .bind::<Array<Float4>, _>(query_embedding)
        .bind::<SqlUuid, _>(dataset_id)
        .bind::<Integer, _>(limit)
        .load(&mut conn)
        .await?;

    Ok(results.into_iter().map(|r| (r.value, r.column_name, r.column_id)).collect())
}

pub struct StoredValueColumn {
    pub organization_id: Uuid,
    pub dataset_id: Uuid,
    pub column_name: String,
    pub column_id: Uuid,
    pub data_source_id: Uuid,
    pub schema: String,
    pub table_name: String,
}

pub async fn process_stored_values_background(columns: Vec<StoredValueColumn>) {
    for column in columns {
        match store_column_values(
            &column.organization_id,
            &column.dataset_id,
            &column.column_name,
            &column.column_id,
            &column.data_source_id,
            &column.schema,
            &column.table_name,
        ).await {
            Ok(_) => {
                tracing::info!(
                    "Successfully processed stored values for column '{}' in dataset '{}'",
                    column.column_name,
                    column.table_name
                );
            }
            Err(e) => {
                tracing::error!(
                    "Failed to process stored values for column '{}' in dataset '{}': {:?}",
                    column.column_name,
                    column.table_name,
                    e
                );
            }
        }
    }
} 