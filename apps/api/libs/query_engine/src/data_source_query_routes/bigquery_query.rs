use indexmap::IndexMap;

use anyhow::{anyhow, Result};
use chrono::{NaiveDate, NaiveTime};
use gcp_bigquery_client::{model::query_request::QueryRequest, Client};
use serde_json::{Number, Value};


use crate::data_types::DataType;

pub async fn bigquery_query(
    client: Client,
    project_id: String,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<String, DataType>>> {
    let query_request = QueryRequest {
        connection_properties: None,
        default_dataset: None,
        dry_run: None,
        kind: None,
        labels: None,
        location: None,
        max_results: Some(limit.unwrap_or(5000).min(i32::MAX as i64) as i32),
        maximum_bytes_billed: None,
        parameter_mode: None,
        preserve_nulls: None,
        query,
        query_parameters: None,
        request_id: None,
        timeout_ms: Some(120000),
        use_legacy_sql: false,
        use_query_cache: None,
        format_options: None,
    };

    let result = match client.job().query(project_id.as_str(), query_request).await {
        Ok(res) => res,
        Err(e) => {
            tracing::error!("There was an issue while fetching the column values: {}", e);
            return Err(anyhow!(e));
        }
    };

    let fields = result.schema
        .as_ref()
        .and_then(|schema| schema.fields.as_ref())
        .ok_or_else(|| anyhow!("No schema found in response"))?;

    let typed_rows = result.rows
        .as_ref()
        .map(|rows| {
            rows.iter()
                .map(|row| {
                    let mut map = IndexMap::new();
                    if let Some(cols) = &row.columns {
                        for (i, value) in cols.iter().enumerate() {
                            if i < fields.len() {
                                let field_name = &fields[i].name;
                                let data_type = match &value.value {
                                    Some(Value::String(s)) => parse_string_to_datatype(s),
                                    Some(Value::Number(n)) => parse_number_to_datatype(n),
                                    Some(Value::Bool(b)) => DataType::Bool(Some(*b)),
                                    Some(Value::Object(_)) | Some(Value::Array(_)) => 
                                        DataType::Json(value.value.clone()),
                                    Some(Value::Null) | None => 
                                        DataType::Unknown(Some("NULL".to_string())),
                                };
                                map.insert(field_name.clone(), data_type);
                            }
                        }
                    }
                    map
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(typed_rows)
}

#[cfg_attr(test, allow(dead_code))]
pub fn parse_string_to_datatype(s: &str) -> DataType {
    // Fast path for empty strings or simple text
    if s.is_empty() || !s.starts_with(&['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 't', 'f', '{', '['][..]) {
        return DataType::Text(Some(s.to_string()));
    }
    
    // Check for boolean values first (very fast)
    if s == "true" {
        return DataType::Bool(Some(true));
    } else if s == "false" {
        return DataType::Bool(Some(false));
    }
    
    // Try to parse as integer first
    if let Ok(value) = s.parse::<i32>() {
        return DataType::Int4(Some(value));
    }
    
    // Check first character for efficiency
    match s.chars().next().unwrap() {
        // Likely number 
        '-' | '0'..='9' => {
            // Try larger integer types
            if let Ok(value) = s.parse::<i64>() {
                return DataType::Int8(Some(value));
            }
            
            // Try floating point
            if let Ok(value) = s.parse::<f64>() {
                if value >= f32::MIN as f64 && value <= f32::MAX as f64 {
                    return DataType::Float4(Some(value as f32));
                } else {
                    return DataType::Float8(Some(value));
                }
            }
            
            // Check for date format (YYYY-MM-DD)
            if s.len() == 10 && s.chars().nth(4) == Some('-') && s.chars().nth(7) == Some('-') {
                if let Ok(value) = NaiveDate::parse_from_str(s, "%Y-%m-%d") {
                    return DataType::Date(Some(value));
                }
            }
            
            // Check for time format
            if s.contains(':') && s.len() >= 8 {
                if let Ok(value) = NaiveTime::parse_from_str(s, "%H:%M:%S%.f") {
                    return DataType::Time(Some(value));
                }
            }
        },
        // Likely JSON object or array
        '{' | '[' => {
            if let Ok(value) = serde_json::from_str::<Value>(s) {
                return DataType::Json(Some(value));
            }
        },
        _ => {}
    }
    
    // Default to text
    DataType::Text(Some(s.to_string()))
}

#[cfg_attr(test, allow(dead_code))]
pub fn parse_number_to_datatype(n: &Number) -> DataType {
    // Check if it's an integer first (more common case)
    if n.is_i64() {
        let i = n.as_i64().unwrap();
        // Use 32-bit int where possible to save memory
        if i >= i32::MIN as i64 && i <= i32::MAX as i64 {
            return DataType::Int4(Some(i as i32));
        } else {
            return DataType::Int8(Some(i));
        }
    } 
    
    // Then check for float
    if n.is_f64() {
        let f = n.as_f64().unwrap();
        // Use 32-bit float where possible to save memory
        if f >= f32::MIN as f64 && f <= f32::MAX as f64 {
            return DataType::Float4(Some(f as f32));
        } else {
            return DataType::Float8(Some(f));
        }
    }
    
    // Should rarely happen
    DataType::Unknown(Some("Invalid number".to_string()))
}
