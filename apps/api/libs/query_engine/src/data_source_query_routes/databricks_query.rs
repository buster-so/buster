use indexmap::IndexMap;

use anyhow::{anyhow, Error};
use serde_json::Value;

use crate::{
    data_source_connections::get_databricks_client::Databricks, data_types::DataType,
};

pub async fn databricks_query(
    databricks_client: Databricks,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<std::string::String, DataType>>, Error> {
    // Get the limit value, defaulting to 5000 if not specified
    let default_limit = 5000;
    let limit_value = limit.unwrap_or(default_limit) as usize;
    
    // Execute the query without appending a LIMIT
    let results = match databricks_client.query(query).await {
        Ok(results) => results,
        Err(e) => {
            tracing::error!("Error executing Databricks query: {}", e);
            return Err(anyhow!(e.to_string()));
        }
    };

    // Create vector with estimated capacity
    let mut result: Vec<IndexMap<String, DataType>> = Vec::with_capacity(limit_value);

    // Get rows from results
    let rows = match results.result.data_array {
        Some(rows) => rows,
        None => return Ok(Vec::new()),
    };

    let columns = results.manifest.schema.columns;

    // Process rows with optimized type conversions
    for row in rows {
        // Stop processing if we've reached the limit
        if result.len() >= limit_value {
            break;
        }
        
        let mut row_map: IndexMap<String, DataType> = IndexMap::with_capacity(columns.len());
        
        for (i, column) in columns.iter().enumerate() {
            let column_name = column.name.clone();
            let type_info = column.type_name.clone();

            // Use match with string type info for efficient type conversion
            let column_value = match type_info.as_str() {
                "BIGINT" => DataType::Int8(row[i].parse::<i64>().ok()),
                "BOOL" => DataType::Bool(row[i].parse::<bool>().ok()),
                "DATE" => DataType::Date(row[i].parse::<chrono::NaiveDate>().ok()),
                "DECIMAL" => DataType::Float8(row[i].parse::<f64>().ok()),
                "DOUBLE" => DataType::Float8(row[i].parse::<f64>().ok()),
                "FLOAT" => DataType::Float8(row[i].parse::<f64>().ok()),
                "INT" => DataType::Int4(row[i].parse::<i32>().ok()),
                "VOID" => DataType::Unknown(Some(String::from("NULL"))),
                "SMALLINT" => DataType::Int2(row[i].parse::<i16>().ok()),
                "STRING" => DataType::Text(Some(row[i].clone())),
                "TIMESTAMP" => DataType::Timestamp(row[i].parse::<chrono::NaiveDateTime>().ok()),
                "TIMESTAMP_NTZ" => DataType::Timestamp(row[i].parse::<chrono::NaiveDateTime>().ok()),
                "TINYINT" => DataType::Int2(row[i].parse::<i16>().ok()),
                "MAP" => DataType::Json(serde_json::from_str::<Value>(row[i].as_str()).ok()),
                "STRUCT" => DataType::Json(serde_json::from_str::<Value>(row[i].as_str()).ok()),
                _ => DataType::Unknown(Some(row[i].to_string())),
            };

            row_map.insert(column_name, column_value);
        }
        
        result.push(row_map);
    }
    
    Ok(result)
}
