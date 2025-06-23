use chrono::Utc;
use indexmap::IndexMap;

use anyhow::Error;
use futures::TryStreamExt;
use sqlx::{Column, MySql, Pool, Row};

use crate::data_types::DataType;

pub async fn mysql_query(
    pool: Pool<MySql>,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<std::string::String, DataType>>, Error> {
    // Get the limit value, defaulting to 5000 if not specified
    let default_limit = 5000;
    let limit_value = limit.unwrap_or(default_limit) as usize;
    
    // Create query stream without appending LIMIT
    let mut stream = sqlx::query(&query).fetch(&pool);

    // Pre-allocate result vector with estimated capacity to reduce allocations
    let mut result: Vec<IndexMap<String, DataType>> = Vec::with_capacity(limit_value);

    // Process all rows without spawning tasks per row
    while let Some(row) = stream.try_next().await? {
        let mut row_map: IndexMap<String, DataType> = IndexMap::with_capacity(row.len());

        for (i, column) in row.columns().iter().enumerate() {
            let column_name = column.name();
            let type_info = column.type_info().clone().to_string();

            let column_value = match type_info.as_str() {
                "BOOL" | "BOOLEAN" => DataType::Bool(row.try_get::<bool, _>(i).ok()),
                "BIT" => DataType::Bytea(row.try_get::<Vec<u8>, _>(i).ok()),
                "CHAR" => DataType::Char(row.try_get::<String, _>(i).ok()),
                "BIGINT" => DataType::Int8(row.try_get::<i64, _>(i).ok()),
                "MEDIUMINT" | "INT" | "INTEGER" => DataType::Int4(row.try_get::<i32, _>(i).ok()),
                "TINYINT" | "SMALLINT" => DataType::Int2(row.try_get::<i16, _>(i).ok()),
                "TEXT" | "VARCHAR" => DataType::Text(row.try_get::<String, _>(i).ok()),
                "FLOAT" => DataType::Float4(row.try_get::<f32, _>(i).ok()),
                "DOUBLE" => DataType::Float8(row.try_get::<f64, _>(i).ok()),
                "DECIMAL" | "DEC" => DataType::Float8(row.try_get::<f64, _>(i).ok()),
                "UUID" => DataType::Uuid(row.try_get::<uuid::Uuid, _>(i).ok()),
                "TIMESTAMP" | "DATETIME" => DataType::Timestamp(row.try_get::<chrono::NaiveDateTime, _>(i).ok()),
                "DATE" => DataType::Date(row.try_get::<chrono::NaiveDate, _>(i).ok()),
                "TIME" => DataType::Time(row.try_get::<chrono::NaiveTime, _>(i).ok()),
                "TIMESTAMPTZ" => DataType::Timestamptz(row.try_get::<chrono::DateTime<Utc>, _>(i).ok()),
                "JSON" | "JSONB" => DataType::Json(row.try_get::<serde_json::Value, _>(i).ok()),
                _ => DataType::Unknown(row.try_get::<String, _>(i).ok()),
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
