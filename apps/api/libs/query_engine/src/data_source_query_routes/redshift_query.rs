use chrono::Utc;
use futures::TryStreamExt;
use indexmap::IndexMap;

use anyhow::{Error, Result};
use sqlx::{types::BigDecimal, Column, Pool, Postgres, Row};
use num_traits::cast::ToPrimitive;

use crate::data_types::DataType;

pub async fn redshift_query(
    pg_pool: Pool<Postgres>,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<std::string::String, DataType>>, Error> {
    // Get the limit value, defaulting to 5000 if not specified
    let default_limit = 5000;
    let limit_value = limit.unwrap_or(default_limit) as usize;
    
    // Create query stream without appending LIMIT 
    let mut stream = sqlx::query(&query).fetch(&pg_pool);

    // Pre-allocate result vector with estimated capacity
    let mut result: Vec<IndexMap<String, DataType>> = Vec::with_capacity(limit_value);

    // Process rows sequentially until we reach the limit
    while let Some(row) = stream.try_next().await? {
        let mut row_map: IndexMap<String, DataType> = IndexMap::with_capacity(row.len());

        for (i, column) in row.columns().iter().enumerate() {
            let column_name = column.name();
            let type_info = column.type_info().clone().to_string();
            
            let column_value = match type_info.as_str() {
                "BOOL" => DataType::Bool(row.try_get::<Option<bool>, _>(i).unwrap_or(None)),
                "BYTEA" => DataType::Bytea(row.try_get::<Option<Vec<u8>>, _>(i).unwrap_or(None)),
                "CHAR" => DataType::Char(row.try_get::<Option<String>, _>(i).unwrap_or(None)),
                "INT8" => DataType::Int8(row.try_get::<Option<i64>, _>(i).unwrap_or(None)),
                "INT4" => DataType::Int4(row.try_get::<Option<i32>, _>(i).unwrap_or(None)),
                "INT2" => DataType::Int2(row.try_get::<Option<i16>, _>(i).unwrap_or(None)),
                "TEXT" | "VARCHAR" | "CHARACTER VARYING" => DataType::Text(row.try_get::<Option<String>, _>(i).unwrap_or(None)),
                "FLOAT4" => DataType::Float4(row.try_get::<Option<f32>, _>(i).unwrap_or(None)),
                "FLOAT8" => DataType::Float8(row.try_get::<Option<f64>, _>(i).unwrap_or(None)),
                "NUMERIC" => {
                    match row.try_get::<Option<BigDecimal>, _>(i).unwrap_or(None) {
                        Some(value) => DataType::Float8(value.to_f64()),
                        None => DataType::Float8(None),
                    }
                }
                "UUID" => DataType::Uuid(row.try_get::<Option<uuid::Uuid>, _>(i).unwrap_or(None)),
                "TIMESTAMP" => DataType::Timestamp(row.try_get::<Option<chrono::NaiveDateTime>, _>(i).unwrap_or(None)),
                "DATE" => DataType::Date(row.try_get::<Option<chrono::NaiveDate>, _>(i).unwrap_or(None)),
                "TIME" => DataType::Time(row.try_get::<Option<chrono::NaiveTime>, _>(i).unwrap_or(None)),
                "TIMESTAMPTZ" => DataType::Timestamptz(row.try_get::<Option<chrono::DateTime<Utc>>, _>(i).unwrap_or(None)),
                "JSON" | "JSONB" => DataType::Json(row.try_get::<Option<serde_json::Value>, _>(i).unwrap_or(None)),
                _ => DataType::Unknown(row.try_get::<Option<String>, _>(i).unwrap_or(None)),
            };

            row_map.insert(column_name.to_string(), column_value);
        }

        result.push(row_map);
        
        // Stop processing if we've reached the limit
        if result.len() >= limit_value {
            break;
        }
    }
    
    Ok(result)
}
