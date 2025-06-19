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
                "BOOL" => DataType::Bool(Some(row.get::<bool, _>(i))),
                "BYTEA" => DataType::Bytea(Some(row.get::<Vec<u8>, _>(i))),
                "CHAR" => DataType::Char(Some(row.get::<String, _>(i))),
                "INT8" => DataType::Int8(Some(row.get::<i64, _>(i))),
                "INT4" => DataType::Int4(Some(row.get::<i32, _>(i))),
                "INT2" => DataType::Int2(Some(row.get::<i16, _>(i))),
                "TEXT" | "VARCHAR" => DataType::Text(Some(row.get::<String, _>(i))),
                "FLOAT4" => DataType::Float4(Some(row.get::<f32, _>(i))),
                "FLOAT8" => DataType::Float8(Some(row.get::<f64, _>(i))),
                "NUMERIC" => {
                    let value: BigDecimal = row.get::<BigDecimal, _>(i);
                    let value: f64 = value.to_f64().unwrap();
                    DataType::Float8(Some(value))
                }
                "UUID" => DataType::Uuid(Some(row.get::<uuid::Uuid, _>(i))),
                "TIMESTAMP" => DataType::Timestamp(Some(row.get::<chrono::NaiveDateTime, _>(i))),
                "DATE" => DataType::Date(Some(row.get::<chrono::NaiveDate, _>(i))),
                "TIME" => DataType::Time(Some(row.get::<chrono::NaiveTime, _>(i))),
                "TIMESTAMPTZ" => {
                    DataType::Timestamptz(Some(row.get::<chrono::DateTime<Utc>, _>(i)))
                }
                "JSON" | "JSONB" => DataType::Json(Some(row.get::<serde_json::Value, _>(i))),
                _ => DataType::Unknown(Some(row.get::<String, _>(i))),
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
