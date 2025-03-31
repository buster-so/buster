use arrow::array::{Array, AsArray};
use arrow::array::{
    BinaryArray, BooleanArray, Date32Array, Date64Array, Decimal128Array, Decimal256Array,
    FixedSizeBinaryArray, Float32Array, Float64Array, Int16Array, Int32Array, Int64Array,
    Int8Array, LargeBinaryArray, LargeStringArray, StringArray, TimestampNanosecondArray,
    UInt16Array, UInt32Array, UInt64Array, UInt8Array,
};
use arrow::datatypes::TimeUnit;
use indexmap::IndexMap;

use anyhow::{anyhow, Error};
use chrono::{DateTime, LocalResult, NaiveTime, TimeZone, Utc};
use snowflake_api::SnowflakeApi;

use serde_json::Value;

use crate::utils::query_engine::data_types::DataType;

// Add helper functions at the top level
fn process_string_value(value: String) -> String {
    value.to_lowercase()
}

fn handle_snowflake_timestamp(value: &Value) -> Option<Value> {
    if let Value::Object(map) = value {
        if map.contains_key("epoch") {
            // If epoch is null, return null
            if map["epoch"].is_null() {
                return Some(Value::Null);
            }

            // If we have a valid epoch, convert it
            if let Some(epoch) = map["epoch"].as_i64() {
                match parse_snowflake_timestamp(epoch, 0) {
                    Ok(dt) => return Some(Value::String(dt.to_rfc3339())),
                    Err(_) => return Some(Value::Null),
                }
            }
        }
    }
    None
}

fn process_json_value(value: Value) -> Value {
    match value {
        Value::String(s) => Value::String(s.to_lowercase()),
        Value::Array(arr) => Value::Array(arr.into_iter().map(process_json_value).collect()),
        Value::Object(map) => {
            // First check if this object might be a Snowflake timestamp
            if let Some(processed) = handle_snowflake_timestamp(&Value::Object(map.clone())) {
                processed
            } else {
                // Otherwise process it as a normal object
                let new_map = map
                    .into_iter()
                    .map(|(k, v)| (k.to_lowercase(), process_json_value(v)))
                    .collect();
                Value::Object(new_map)
            }
        }
        _ => value,
    }
}

fn parse_snowflake_timestamp(epoch_data: i64, subsec_nanos: u32) -> Result<DateTime<Utc>, Error> {
    match Utc.timestamp_opt(epoch_data, subsec_nanos) {
        LocalResult::Single(dt) => Ok(dt),
        _ => Err(anyhow!("Invalid timestamp value")),
    }
}

// Add this helper function before the snowflake_query function
fn handle_snowflake_timestamp_struct(
    struct_array: &arrow::array::StructArray,
    row_idx: usize,
) -> Option<DateTime<Utc>> {
    if struct_array.is_null(row_idx) {
        return None;
    }

    // Get the epoch field
    let epoch_array = struct_array
        .column_by_name("epoch")
        .and_then(|col| col.as_any().downcast_ref::<Int64Array>());

    // Get the fraction field
    let fraction_array = struct_array
        .column_by_name("fraction")
        .and_then(|col| col.as_any().downcast_ref::<Int32Array>());

    match (epoch_array, fraction_array) {
        (Some(epoch), Some(fraction)) if !epoch.is_null(row_idx) => {
            let epoch_value = epoch.value(row_idx);
            let fraction_value = if fraction.is_null(row_idx) {
                0
            } else {
                fraction.value(row_idx)
            };
            
            // Convert fraction to nanoseconds if needed
            let nanos = (fraction_value as u32).min(999_999_999);
            
            match parse_snowflake_timestamp(epoch_value, nanos) {
                Ok(dt) => Some(dt),
                Err(e) => {
                    tracing::error!("Failed to parse timestamp: {}", e);
                    None
                }
            }
        }
        _ => None,
    }
}

pub async fn snowflake_query(
    mut snowflake_client: SnowflakeApi,
    query: String,
) -> Result<Vec<IndexMap<std::string::String, DataType>>, Error> {
    const MAX_ROWS: usize = 1_000;

    let query_no_semicolon = query.trim_end_matches(';');
    let limited_query = if !query_no_semicolon.to_lowercase().contains("limit") {
        format!("{} FETCH FIRST {} ROWS ONLY", query_no_semicolon, MAX_ROWS)
    } else {
        query_no_semicolon.to_string()
    };

    let rows = match snowflake_client.exec(&limited_query).await {
        Ok(result) => match result {
            snowflake_api::QueryResult::Arrow(result) => {
                let mut all_rows = Vec::new();

                // Process each batch in order
                for batch in result.iter() {

                    let schema = batch.schema();
                    for row_idx in 0..batch.num_rows() {
                        let row = schema
                            .fields()
                            .iter()
                            .enumerate()
                            .map(|(col_idx, field)| {
                                let column = batch.column(col_idx);
                                let data_type = match column.data_type() {
                                    arrow::datatypes::DataType::Boolean => {
                                        let array =
                                            column.as_any().downcast_ref::<BooleanArray>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Bool(Some(array.value(row_idx)))
                                        }
                                    }
                                    arrow::datatypes::DataType::Int8 => {
                                        let array =
                                            column.as_any().downcast_ref::<Int8Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Int2(Some(array.value(row_idx) as i16))
                                        }
                                    }
                                    arrow::datatypes::DataType::Int16 => {
                                        let array =
                                            column.as_any().downcast_ref::<Int16Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Int2(Some(array.value(row_idx)))
                                        }
                                    }
                                    arrow::datatypes::DataType::Int32 => {
                                        let array =
                                            column.as_any().downcast_ref::<Int32Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Int4(Some(array.value(row_idx)))
                                        }
                                    }
                                    arrow::datatypes::DataType::Int64 => {
                                        let array =
                                            column.as_any().downcast_ref::<Int64Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Int8(Some(array.value(row_idx)))
                                        }
                                    }
                                    arrow::datatypes::DataType::UInt8 => {
                                        let array =
                                            column.as_any().downcast_ref::<UInt8Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Int2(Some(array.value(row_idx) as i16))
                                        }
                                    }
                                    arrow::datatypes::DataType::UInt16 => {
                                        let array =
                                            column.as_any().downcast_ref::<UInt16Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Int4(Some(array.value(row_idx) as i32))
                                        }
                                    }
                                    arrow::datatypes::DataType::UInt32 => {
                                        let array =
                                            column.as_any().downcast_ref::<UInt32Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Int8(Some(array.value(row_idx) as i64))
                                        }
                                    }
                                    arrow::datatypes::DataType::UInt64 => {
                                        let array =
                                            column.as_any().downcast_ref::<UInt64Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Int8(Some(array.value(row_idx) as i64))
                                        }
                                    }
                                    arrow::datatypes::DataType::Float32 => {
                                        let array =
                                            column.as_any().downcast_ref::<Float32Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Float4(Some(array.value(row_idx)))
                                        }
                                    }
                                    arrow::datatypes::DataType::Float64 => {
                                        let array =
                                            column.as_any().downcast_ref::<Float64Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Float8(Some(array.value(row_idx)))
                                        }
                                    }
                                    arrow::datatypes::DataType::Utf8 => {
                                        let array =
                                            column.as_any().downcast_ref::<StringArray>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Text(Some(process_string_value(
                                                array.value(row_idx).to_string(),
                                            )))
                                        }
                                    }
                                    arrow::datatypes::DataType::LargeUtf8 => {
                                        let array = column
                                            .as_any()
                                            .downcast_ref::<LargeStringArray>()
                                            .unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Text(Some(process_string_value(
                                                array.value(row_idx).to_string(),
                                            )))
                                        }
                                    }
                                    arrow::datatypes::DataType::Binary => {
                                        let array =
                                            column.as_any().downcast_ref::<BinaryArray>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Bytea(Some(array.value(row_idx).to_vec()))
                                        }
                                    }
                                    arrow::datatypes::DataType::LargeBinary => {
                                        let array = column
                                            .as_any()
                                            .downcast_ref::<LargeBinaryArray>()
                                            .unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Bytea(Some(array.value(row_idx).to_vec()))
                                        }
                                    }
                                    arrow::datatypes::DataType::Date32 => {
                                        let array =
                                            column.as_any().downcast_ref::<Date32Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let days = array.value(row_idx);
                                            let timestamp = days as i64 * 24 * 60 * 60;
                                            match Utc.timestamp_opt(timestamp, 0) {
                                                LocalResult::Single(dt) => {
                                                    DataType::Date(Some(dt.date_naive()))
                                                }
                                                _ => DataType::Null,
                                            }
                                        }
                                    }
                                    arrow::datatypes::DataType::Date64 => {
                                        let array =
                                            column.as_any().downcast_ref::<Date64Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let millis = array.value(row_idx);
                                            let secs = millis / 1000;
                                            let nanos = ((millis % 1000) * 1_000_000) as u32;
                                            match Utc.timestamp_opt(secs, nanos) {
                                                LocalResult::Single(dt) => {
                                                    DataType::Date(Some(dt.date_naive()))
                                                }
                                                _ => DataType::Null,
                                            }
                                        }
                                    }
                                    arrow::datatypes::DataType::Timestamp(unit, tz) => {
                                        let array = column
                                            .as_any()
                                            .downcast_ref::<TimestampNanosecondArray>()
                                            .unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let nanos = array.value(row_idx);
                                            let (secs, subsec_nanos) = match unit {
                                                TimeUnit::Second => (nanos, 0),
                                                TimeUnit::Millisecond => {
                                                    (nanos / 1000, (nanos % 1000) * 1_000_000)
                                                }
                                                TimeUnit::Microsecond => {
                                                    (nanos / 1_000_000, (nanos % 1_000_000) * 1000)
                                                }
                                                TimeUnit::Nanosecond => {
                                                    (nanos / 1_000_000_000, nanos % 1_000_000_000)
                                                }
                                            };

                                            match parse_snowflake_timestamp(
                                                secs as i64,
                                                subsec_nanos as u32,
                                            ) {
                                                Ok(dt) => match tz {
                                                    Some(_) => DataType::Timestamptz(Some(dt)),
                                                    None => {
                                                        DataType::Timestamp(Some(dt.naive_utc()))
                                                    }
                                                },
                                                Err(e) => {
                                                    tracing::error!(
                                                        "Failed to parse timestamp: {}",
                                                        e
                                                    );
                                                    DataType::Null
                                                }
                                            }
                                        }
                                    }
                                    arrow::datatypes::DataType::Decimal128(precision, scale) => {
                                        let array = column.as_any().downcast_ref::<Decimal128Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let val = array.value(row_idx);
                                            
                                            // Convert to string to handle the full precision
                                            let val_str = val.to_string();
                                            let val_len = val_str.len();
                                            
                                            // Determine significant digits based on precision
                                            let sig_digits = (*precision as usize).min(val_len);
                                            
                                            // Extract the significant digits
                                            let significant_part = if val_len > sig_digits {
                                                val_str[..sig_digits].to_string()
                                            } else {
                                                val_str
                                            };
                                            
                                            // Parse to f64 after applying precision
                                            if let Ok(precise_val) = significant_part.parse::<f64>() {
                                                // Apply scale
                                                let scale_adjustment = if *scale >= 0 {
                                                    10_f64.powi(-(*scale as i32))
                                                } else {
                                                    10_f64.powi((*scale as i32).abs())
                                                };
                                                
                                                let float_val = precise_val * scale_adjustment;
                                                DataType::Float8(Some(float_val))
                                            } else {
                                                DataType::Null
                                            }
                                        }
                                    }
                                    arrow::datatypes::DataType::Decimal256(precision, scale) => {
                                        let array = column.as_any().downcast_ref::<Decimal256Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let val = array.value(row_idx);
                                            let val_str = val.to_string();
                                            let val_len = val_str.len();
                                            
                                            // Determine significant digits based on precision
                                            let sig_digits = (*precision as usize).min(val_len);
                                            
                                            // Extract the significant digits
                                            let significant_part = if val_len > sig_digits {
                                                val_str[..sig_digits].to_string()
                                            } else {
                                                val_str
                                            };
                                            
                                            // Parse to f64 after applying precision
                                            if let Ok(precise_val) = significant_part.parse::<f64>() {
                                                // Apply scale
                                                let scale_adjustment = if *scale >= 0 {
                                                    10_f64.powi(-(*scale as i32))
                                                } else {
                                                    10_f64.powi((*scale as i32).abs())
                                                };
                                                
                                                let float_val = precise_val * scale_adjustment;
                                                DataType::Float8(Some(float_val))
                                            } else {
                                                DataType::Null
                                            }
                                        }
                                    }
                                    arrow::datatypes::DataType::Null => DataType::Null,
                                    arrow::datatypes::DataType::Float16 => {
                                        let array =
                                            column.as_any().downcast_ref::<Float32Array>().unwrap(); // Float16 gets converted to Float32 in Arrow
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Float4(Some(array.value(row_idx)))
                                        }
                                    }
                                    arrow::datatypes::DataType::Time32(time_unit) => {
                                        let array =
                                            column.as_any().downcast_ref::<Int32Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let val = array.value(row_idx);
                                            let nanos = match time_unit {
                                                TimeUnit::Second => val as i64 * 1_000_000_000,
                                                TimeUnit::Millisecond => val as i64 * 1_000_000,
                                                _ => val as i64,
                                            };
                                            let time =
                                                NaiveTime::from_num_seconds_from_midnight_opt(
                                                    (nanos / 1_000_000_000) as u32,
                                                    (nanos % 1_000_000_000) as u32,
                                                );
                                            match time {
                                                Some(t) => DataType::Time(Some(t)),
                                                None => DataType::Null,
                                            }
                                        }
                                    }
                                    arrow::datatypes::DataType::Time64(time_unit) => {
                                        let array =
                                            column.as_any().downcast_ref::<Int64Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let val = array.value(row_idx);
                                            let nanos = match time_unit {
                                                TimeUnit::Microsecond => val * 1000,
                                                TimeUnit::Nanosecond => val,
                                                _ => val * 1_000_000_000,
                                            };
                                            let time =
                                                NaiveTime::from_num_seconds_from_midnight_opt(
                                                    (nanos / 1_000_000_000) as u32,
                                                    (nanos % 1_000_000_000) as u32,
                                                );
                                            match time {
                                                Some(t) => DataType::Time(Some(t)),
                                                None => DataType::Null,
                                            }
                                        }
                                    }
                                    arrow::datatypes::DataType::Duration(_) => {
                                        // Convert duration to milliseconds as float for consistency
                                        let array =
                                            column.as_any().downcast_ref::<Int64Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Float8(Some(array.value(row_idx) as f64))
                                        }
                                    }
                                    arrow::datatypes::DataType::Interval(_) => {
                                        // Convert interval to a string representation
                                        let array =
                                            column.as_any().downcast_ref::<Int64Array>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Text(Some(array.value(row_idx).to_string()))
                                        }
                                    }
                                    arrow::datatypes::DataType::FixedSizeBinary(_) => {
                                        let array = column
                                            .as_any()
                                            .downcast_ref::<FixedSizeBinaryArray>()
                                            .unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Bytea(Some(array.value(row_idx).to_vec()))
                                        }
                                    }
                                    arrow::datatypes::DataType::BinaryView => {
                                        // BinaryView is similar to Binary
                                        let array =
                                            column.as_any().downcast_ref::<BinaryArray>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Bytea(Some(array.value(row_idx).to_vec()))
                                        }
                                    }
                                    arrow::datatypes::DataType::Utf8View => {
                                        // Utf8View is similar to Utf8
                                        let array =
                                            column.as_any().downcast_ref::<StringArray>().unwrap();
                                        if array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            DataType::Text(Some(array.value(row_idx).to_string()))
                                        }
                                    }
                                    arrow::datatypes::DataType::List(_)
                                    | arrow::datatypes::DataType::ListView(_)
                                    | arrow::datatypes::DataType::FixedSizeList(_, _)
                                    | arrow::datatypes::DataType::LargeList(_)
                                    | arrow::datatypes::DataType::LargeListView(_) => {
                                        let list_array = column
                                            .as_any()
                                            .downcast_ref::<arrow::array::ListArray>()
                                            .unwrap();
                                        if list_array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let values = list_array.value(row_idx);
                                            let json_array = Value::Array(
                                                (0..values.len())
                                                    .filter_map(|i| {
                                                        if values.is_null(i) {
                                                            None
                                                        } else if let Some(num) = values
                                                            .as_any()
                                                            .downcast_ref::<Int32Array>(
                                                        ) {
                                                            Some(Value::Number(num.value(i).into()))
                                                        } else if let Some(num) = values
                                                            .as_any()
                                                            .downcast_ref::<Int64Array>(
                                                        ) {
                                                            Some(Value::Number(num.value(i).into()))
                                                        } else if let Some(str) = values
                                                            .as_any()
                                                            .downcast_ref::<StringArray>(
                                                        ) {
                                                            Some(Value::String(
                                                                process_string_value(
                                                                    str.value(i).to_string(),
                                                                ),
                                                            ))
                                                        } else {
                                                            None
                                                        }
                                                    })
                                                    .collect(),
                                            );
                                            DataType::Json(Some(process_json_value(json_array)))
                                        }
                                    }
                                    arrow::datatypes::DataType::Struct(fields) => {
                                        let struct_array = column
                                            .as_any()
                                            .downcast_ref::<arrow::array::StructArray>()
                                            .unwrap();

                                        // Check if this is a Snowflake timestamp struct
                                        if fields.len() == 2 
                                            && fields.iter().any(|f| f.name() == "epoch")
                                            && fields.iter().any(|f| f.name() == "fraction")
                                            && field.metadata().get("logicalType").map_or(false, |v| v.contains("TIMESTAMP")) 
                                        {
                                            if let Some(dt) = handle_snowflake_timestamp_struct(struct_array, row_idx) {
                                                if field.metadata().get("logicalType").map_or(false, |v| v.contains("_TZ")) {
                                                    DataType::Timestamptz(Some(dt))
                                                } else {
                                                    DataType::Timestamp(Some(dt.naive_utc()))
                                                }
                                            } else {
                                                DataType::Null
                                            }
                                        } else {
                                            // Original struct handling for non-timestamp structs
                                            if struct_array.is_null(row_idx) {
                                                DataType::Null
                                            } else {
                                                let mut map = serde_json::Map::new();
                                                for (field, col) in fields.iter().zip(struct_array.columns().iter()) {
                                                    let field_name = field.name();
                                                    let value = match col.data_type() {
                                                        arrow::datatypes::DataType::Int32 => {
                                                            let array = col.as_any().downcast_ref::<Int32Array>().unwrap();
                                                            if array.is_null(row_idx) {
                                                                Value::Null
                                                            } else {
                                                                Value::Number(array.value(row_idx).into())
                                                            }
                                                        }
                                                        // Add more field types as needed
                                                        _ => Value::Null,
                                                    };
                                                    map.insert(field_name.to_string(), value);
                                                }
                                                DataType::Json(Some(process_json_value(Value::Object(map))))
                                            }
                                        }
                                    }
                                    arrow::datatypes::DataType::Union(_, _) => {
                                        // Unions are complex - convert to string representation
                                        DataType::Text(Some(
                                            "Union type not fully supported".to_string(),
                                        ))
                                    }
                                    arrow::datatypes::DataType::Dictionary(_, _) => {
                                        let dict_array = column
                                            .as_any()
                                            .downcast_ref::<arrow::array::DictionaryArray<
                                                arrow::datatypes::Int32Type,
                                            >>()
                                            .unwrap();
                                        if dict_array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let values = dict_array.values();
                                            match values.data_type() {
                                                arrow::datatypes::DataType::Utf8 => {
                                                    let string_values = values
                                                        .as_any()
                                                        .downcast_ref::<StringArray>()
                                                        .unwrap();
                                                    let key = dict_array.keys().value(row_idx);
                                                    DataType::Text(Some(
                                                        string_values
                                                            .value(key as usize)
                                                            .to_string(),
                                                    ))
                                                }
                                                _ => DataType::Text(Some(
                                                    "Unsupported dictionary type".to_string(),
                                                )),
                                            }
                                        }
                                    }
                                    arrow::datatypes::DataType::Map(_, _) => {
                                        // Convert map to JSON object
                                        let map_array = column.as_map();
                                        if map_array.is_null(row_idx) {
                                            DataType::Null
                                        } else {
                                            let entries = map_array.value(row_idx);
                                            let mut json_map = serde_json::Map::new();
                                            // Assuming string keys and numeric values for simplicity
                                            for i in 0..entries.len() {
                                                if let (Some(key), Some(value)) = (
                                                    entries
                                                        .column(0)
                                                        .as_any()
                                                        .downcast_ref::<StringArray>()
                                                        .map(|arr| arr.value(i)),
                                                    entries
                                                        .column(1)
                                                        .as_any()
                                                        .downcast_ref::<Int64Array>()
                                                        .map(|arr| arr.value(i)),
                                                ) {
                                                    json_map.insert(
                                                        key.to_string(),
                                                        Value::Number(value.into()),
                                                    );
                                                }
                                            }
                                            DataType::Json(Some(process_json_value(Value::Object(
                                                json_map,
                                            ))))
                                        }
                                    }
                                    arrow::datatypes::DataType::RunEndEncoded(_, _) => {
                                        // Convert run-length encoded data to its base type
                                        // This is a simplified handling
                                        DataType::Text(Some(
                                            "Run-length encoded type not fully supported"
                                                .to_string(),
                                        ))
                                    }
                                };
                                (field.name().clone(), data_type)
                            })
                            .collect::<IndexMap<String, DataType>>();
                        all_rows.push(row);
                    }
                }
                all_rows
            }
            _ => Vec::new(),
        },
        Err(e) => {
            tracing::error!("There was an issue while fetching the tables: {}", e);
            return Err(anyhow!(e));
        }
    };

    match snowflake_client.close_session().await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!(
                "There was an issue while closing the snowflake client: {}",
                e
            );
        }
    }

    Ok(rows)
}
