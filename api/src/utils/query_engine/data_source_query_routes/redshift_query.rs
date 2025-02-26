use chrono::Utc;
use futures::TryStreamExt;
use indexmap::IndexMap;

use anyhow::{Error, Result};
use sqlx::{Column, Pool, Postgres, Row};
use tokio::task;

use crate::utils::query_engine::data_types::DataType;

pub async fn redshift_query(
    pg_pool: Pool<Postgres>,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<std::string::String, DataType>>, Error> {
    let mut stream = sqlx::query(&query).fetch(&pg_pool);

    let mut result: Vec<IndexMap<String, DataType>> = Vec::new();
    let mut count = 0;
    let batch_size = 100;

    let mut rows = Vec::new();

    while let Some(row) = stream.try_next().await? {
        rows.push(row);
        count += 1;

        if count % batch_size == 0 {
            let batch_result = process_batch(rows).await?;
            result.extend(batch_result);
            rows = Vec::new();
        }

        if let Some(limit) = limit {
            if count >= limit {
                break;
            }
        } else if count >= 1000 {
            // Default limit of 1000 if no limit is specified
            break;
        }
    }

    // Process any remaining rows
    if !rows.is_empty() {
        let batch_result = process_batch(rows).await?;
        result.extend(batch_result);
    }

    Ok(result)
}

async fn process_batch(
    rows: Vec<sqlx::postgres::PgRow>,
) -> Result<Vec<IndexMap<String, DataType>>, Error> {
    let mut tasks = Vec::new();

    for (index, row) in rows.into_iter().enumerate() {
        let task = task::spawn(async move {
            let mut row_map: IndexMap<String, DataType> = IndexMap::with_capacity(row.len());

            for (i, column) in row.columns().iter().enumerate() {
                let column_name = column.name();
                let type_info = column.type_info().clone().to_string();
                let column_value = match type_info.as_str() {
                    "BOOL" => DataType::Bool(row.try_get::<bool, _>(i).ok()),
                    "BYTEA" => DataType::Bytea(row.try_get::<Vec<u8>, _>(i).ok()),
                    "CHAR" => DataType::Char(row.try_get::<String, _>(i).ok()),
                    "INT8" => DataType::Int8(row.try_get::<i64, _>(i).ok()),
                    "INT4" => DataType::Int4(row.try_get::<i32, _>(i).ok()),
                    "INT2" => DataType::Int2(row.try_get::<i16, _>(i).ok()),
                    "TEXT" | "VARCHAR" => DataType::Text(row.try_get::<String, _>(i).ok()),
                    "FLOAT4" => DataType::Float4(row.try_get::<f32, _>(i).ok()),
                    "FLOAT8" => DataType::Float8(row.try_get::<f64, _>(i).ok()),
                    "NUMERIC" => {
                        DataType::Float8(row.try_get(i).ok().and_then(
                            |v: sqlx::types::BigDecimal| v.to_string().parse::<f64>().ok(),
                        ))
                    }
                    "UUID" => DataType::Uuid(row.try_get::<uuid::Uuid, _>(i).ok()),
                    "TIMESTAMP" => {
                        DataType::Timestamp(row.try_get::<chrono::NaiveDateTime, _>(i).ok())
                    }
                    "DATE" => DataType::Date(row.try_get::<chrono::NaiveDate, _>(i).ok()),
                    "TIME" => DataType::Time(row.try_get::<chrono::NaiveTime, _>(i).ok()),
                    "TIMESTAMPTZ" => {
                        DataType::Timestamptz(row.try_get::<chrono::DateTime<Utc>, _>(i).ok())
                    }
                    "JSON" | "JSONB" => DataType::Json(row.try_get::<serde_json::Value, _>(i).ok()),
                    _ => DataType::Unknown(row.try_get::<String, _>(i).ok()),
                };

                row_map.insert(column_name.to_string(), column_value);
            }

            (index, row_map)
        });

        tasks.push(task);
    }

    let batch_result: Vec<_> = match futures::future::try_join_all(tasks).await {
        Ok(batch_result) => batch_result,
        Err(e) => {
            tracing::error!("Error joining tasks: {:?}", e);
            Vec::new()
        }
    };

    let mut sorted_result: Vec<(usize, IndexMap<String, DataType>)> =
        batch_result.into_iter().collect();

    sorted_result.sort_by_key(|(index, _)| *index);

    let final_result: Vec<IndexMap<String, DataType>> = sorted_result
        .into_iter()
        .map(|(_, row_map)| row_map)
        .collect();

    Ok(final_result)
}
