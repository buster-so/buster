use arrow::array::{Array, AsArray};
use indexmap::IndexMap;
use arrow::array::{
    BooleanArray, Int8Array, Int16Array, Int32Array, Int64Array,
    UInt8Array, UInt16Array, UInt32Array, UInt64Array,
    Float32Array, Float64Array, StringArray, LargeStringArray,
    BinaryArray, LargeBinaryArray, Date32Array, Date64Array,
    TimestampNanosecondArray, Decimal128Array, Decimal256Array,
    FixedSizeBinaryArray,
};
use arrow::datatypes::TimeUnit;

use anyhow::{anyhow, Error};
use chrono::{DateTime, LocalResult, NaiveTime, TimeZone, Utc};
use snowflake_api::SnowflakeApi;

use serde_json::Value;

use crate::utils::query_engine::data_types::DataType;

// Add helper functions at the top level
fn process_string_value(value: String) -> String {
    value.to_lowercase()
}

fn process_json_value(value: Value) -> Value {
    match value {
        Value::String(s) => Value::String(s.to_lowercase()),
        Value::Array(arr) => Value::Array(arr.into_iter().map(process_json_value).collect()),
        Value::Object(map) => {
            let new_map = map.into_iter()
                .map(|(k, v)| (k.to_lowercase(), process_json_value(v)))
                .collect();
            Value::Object(new_map)
        }
        _ => value,
    }
}

fn parse_snowflake_timestamp(epoch_data: i64, subsec_nanos: u32) -> Result<DateTime<Utc>, Error> {
    match Utc.timestamp_opt(epoch_data, subsec_nanos) {
        LocalResult::Single(dt) => Ok(dt),
        _ => Err(anyhow!("Invalid timestamp value"))
    }
}

pub async fn snowflake_query(
    mut snowflake_client: SnowflakeApi,
    query: String,
) -> Result<Vec<IndexMap<std::string::String, DataType>>, Error> {
    const MAX_ROWS: usize = 5_000;
    
    // Wrap the original query in a limit clause
    let limited_query = format!("SELECT * FROM ({}) tmp_query LIMIT {}", query.replace(";", ""), MAX_ROWS);

    let rows = match snowflake_client.exec(&limited_query).await {
        Ok(result) => match result {
            snowflake_api::QueryResult::Arrow(result) => {
                result
                    .iter()
                    .flat_map(|batch| {
                        let schema = batch.schema();
                        (0..batch.num_rows()).map(move |row_idx| {
                            schema
                                .fields()
                                .iter()
                                .enumerate()
                                .map(|(col_idx, field)| {
                                    let column = batch.column(col_idx);
                                    let data_type = match column.data_type() {
                                        arrow::datatypes::DataType::Boolean => {
                                            let array = column.as_any().downcast_ref::<BooleanArray>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null } 
                                            else { DataType::Bool(Some(array.value(row_idx))) }
                                        }
                                        arrow::datatypes::DataType::Int8 => {
                                            let array = column.as_any().downcast_ref::<Int8Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Int2(Some(array.value(row_idx) as i16)) }
                                        }
                                        arrow::datatypes::DataType::Int16 => {
                                            let array = column.as_any().downcast_ref::<Int16Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Int2(Some(array.value(row_idx))) }
                                        }
                                        arrow::datatypes::DataType::Int32 => {
                                            let array = column.as_any().downcast_ref::<Int32Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Int4(Some(array.value(row_idx))) }
                                        }
                                        arrow::datatypes::DataType::Int64 => {
                                            let array = column.as_any().downcast_ref::<Int64Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Int8(Some(array.value(row_idx))) }
                                        }
                                        arrow::datatypes::DataType::UInt8 => {
                                            let array = column.as_any().downcast_ref::<UInt8Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Int2(Some(array.value(row_idx) as i16)) }
                                        }
                                        arrow::datatypes::DataType::UInt16 => {
                                            let array = column.as_any().downcast_ref::<UInt16Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Int4(Some(array.value(row_idx) as i32)) }
                                        }
                                        arrow::datatypes::DataType::UInt32 => {
                                            let array = column.as_any().downcast_ref::<UInt32Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Int8(Some(array.value(row_idx) as i64)) }
                                        }
                                        arrow::datatypes::DataType::UInt64 => {
                                            let array = column.as_any().downcast_ref::<UInt64Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Int8(Some(array.value(row_idx) as i64)) }
                                        }
                                        arrow::datatypes::DataType::Float32 => {
                                            let array = column.as_any().downcast_ref::<Float32Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Float4(Some(array.value(row_idx))) }
                                        }
                                        arrow::datatypes::DataType::Float64 => {
                                            let array = column.as_any().downcast_ref::<Float64Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Float8(Some(array.value(row_idx))) }
                                        }
                                        arrow::datatypes::DataType::Utf8 => {
                                            let array = column.as_any().downcast_ref::<StringArray>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Text(Some(process_string_value(array.value(row_idx).to_string()))) }
                                        }
                                        arrow::datatypes::DataType::LargeUtf8 => {
                                            let array = column.as_any().downcast_ref::<LargeStringArray>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Text(Some(process_string_value(array.value(row_idx).to_string()))) }
                                        }
                                        arrow::datatypes::DataType::Binary => {
                                            let array = column.as_any().downcast_ref::<BinaryArray>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Bytea(Some(array.value(row_idx).to_vec())) }
                                        }
                                        arrow::datatypes::DataType::LargeBinary => {
                                            let array = column.as_any().downcast_ref::<LargeBinaryArray>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Bytea(Some(array.value(row_idx).to_vec())) }
                                        }
                                        arrow::datatypes::DataType::Date32 => {
                                            let array = column.as_any().downcast_ref::<Date32Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let days = array.value(row_idx);
                                                let timestamp = days as i64 * 24 * 60 * 60;
                                                match Utc.timestamp_opt(timestamp, 0) {
                                                    LocalResult::Single(dt) => DataType::Date(Some(dt.date_naive())),
                                                    _ => DataType::Null,
                                                }
                                            }
                                        }
                                        arrow::datatypes::DataType::Date64 => {
                                            let array = column.as_any().downcast_ref::<Date64Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let millis = array.value(row_idx);
                                                let secs = millis / 1000;
                                                let nanos = ((millis % 1000) * 1_000_000) as u32;
                                                match Utc.timestamp_opt(secs, nanos) {
                                                    LocalResult::Single(dt) => DataType::Date(Some(dt.date_naive())),
                                                    _ => DataType::Null,
                                                }
                                            }
                                        }
                                        arrow::datatypes::DataType::Timestamp(unit, tz) => {
                                            let array = column.as_any().downcast_ref::<TimestampNanosecondArray>().unwrap();
                                            if array.is_null(row_idx) { 
                                                DataType::Null 
                                            } else {
                                                let nanos = array.value(row_idx);
                                                let (secs, subsec_nanos) = match unit {
                                                    TimeUnit::Second => (nanos, 0),
                                                    TimeUnit::Millisecond => (nanos / 1000, (nanos % 1000) * 1_000_000),
                                                    TimeUnit::Microsecond => (nanos / 1_000_000, (nanos % 1_000_000) * 1000),
                                                    TimeUnit::Nanosecond => (nanos / 1_000_000_000, nanos % 1_000_000_000),
                                                };
                                                
                                                match parse_snowflake_timestamp(secs as i64, subsec_nanos as u32) {
                                                    Ok(dt) => match tz {
                                                        Some(_) => DataType::Timestamptz(Some(dt)),
                                                        None => DataType::Timestamp(Some(dt.naive_utc())),
                                                    },
                                                    Err(e) => {
                                                        tracing::error!("Failed to parse timestamp: {}", e);
                                                        DataType::Null
                                                    }
                                                }
                                            }
                                        }
                                        arrow::datatypes::DataType::Decimal128(precision, scale) => {
                                            let array = column.as_any().downcast_ref::<Decimal128Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let val = array.value(row_idx);
                                                let scale_factor = 10_f64.powi(-(*scale as i32));
                                                let float_val = val as f64 * scale_factor;
                                                DataType::Float8(Some(float_val))
                                            }
                                        }
                                        arrow::datatypes::DataType::Decimal256(precision, scale) => {
                                            let array = column.as_any().downcast_ref::<Decimal256Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let val = array.value(row_idx);
                                                // Convert the i256 to string first to handle large numbers
                                                let val_str = val.to_string();
                                                if let Ok(float_val) = val_str.parse::<f64>() {
                                                    let scale_factor = 10_f64.powi(-(*scale as i32));
                                                    DataType::Float8(Some(float_val * scale_factor))
                                                } else {
                                                    DataType::Null
                                                }
                                            }
                                        }
                                        arrow::datatypes::DataType::Null => DataType::Null,
                                        arrow::datatypes::DataType::Float16 => {
                                            let array = column.as_any().downcast_ref::<Float32Array>().unwrap(); // Float16 gets converted to Float32 in Arrow
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Float4(Some(array.value(row_idx))) }
                                        }
                                        arrow::datatypes::DataType::Time32(time_unit) => {
                                            let array = column.as_any().downcast_ref::<Int32Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let val = array.value(row_idx);
                                                let nanos = match time_unit {
                                                    TimeUnit::Second => val as i64 * 1_000_000_000,
                                                    TimeUnit::Millisecond => val as i64 * 1_000_000,
                                                    _ => val as i64,
                                                };
                                                let time = NaiveTime::from_num_seconds_from_midnight_opt(
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
                                            let array = column.as_any().downcast_ref::<Int64Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let val = array.value(row_idx);
                                                let nanos = match time_unit {
                                                    TimeUnit::Microsecond => val * 1000,
                                                    TimeUnit::Nanosecond => val,
                                                    _ => val * 1_000_000_000,
                                                };
                                                let time = NaiveTime::from_num_seconds_from_midnight_opt(
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
                                            let array = column.as_any().downcast_ref::<Int64Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Float8(Some(array.value(row_idx) as f64)) }
                                        }
                                        arrow::datatypes::DataType::Interval(_) => {
                                            // Convert interval to a string representation
                                            let array = column.as_any().downcast_ref::<Int64Array>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Text(Some(array.value(row_idx).to_string())) }
                                        }
                                        arrow::datatypes::DataType::FixedSizeBinary(_) => {
                                            let array = column.as_any().downcast_ref::<FixedSizeBinaryArray>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Bytea(Some(array.value(row_idx).to_vec())) }
                                        }
                                        arrow::datatypes::DataType::BinaryView => {
                                            // BinaryView is similar to Binary
                                            let array = column.as_any().downcast_ref::<BinaryArray>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Bytea(Some(array.value(row_idx).to_vec())) }
                                        }
                                        arrow::datatypes::DataType::Utf8View => {
                                            // Utf8View is similar to Utf8
                                            let array = column.as_any().downcast_ref::<StringArray>().unwrap();
                                            if array.is_null(row_idx) { DataType::Null }
                                            else { DataType::Text(Some(array.value(row_idx).to_string())) }
                                        }
                                        arrow::datatypes::DataType::List(_) |
                                        arrow::datatypes::DataType::ListView(_) |
                                        arrow::datatypes::DataType::FixedSizeList(_, _) |
                                        arrow::datatypes::DataType::LargeList(_) |
                                        arrow::datatypes::DataType::LargeListView(_) => {
                                            let list_array = column.as_any().downcast_ref::<arrow::array::ListArray>().unwrap();
                                            if list_array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let values = list_array.value(row_idx);
                                                let json_array = Value::Array(
                                                    (0..values.len())
                                                        .filter_map(|i| {
                                                            if values.is_null(i) {
                                                                None
                                                            } else if let Some(num) = values.as_any().downcast_ref::<Int32Array>() {
                                                                Some(Value::Number(num.value(i).into()))
                                                            } else if let Some(num) = values.as_any().downcast_ref::<Int64Array>() {
                                                                Some(Value::Number(num.value(i).into()))
                                                            } else if let Some(str) = values.as_any().downcast_ref::<StringArray>() {
                                                                Some(Value::String(process_string_value(str.value(i).to_string())))
                                                            } else {
                                                                None
                                                            }
                                                        })
                                                        .collect()
                                                );
                                                DataType::Json(Some(process_json_value(json_array)))
                                            }
                                        }
                                        arrow::datatypes::DataType::Struct(fields) => {
                                            let struct_array = column.as_any().downcast_ref::<arrow::array::StructArray>().unwrap();
                                            if struct_array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let mut map = serde_json::Map::new();
                                                for (field, col) in fields.iter().zip(struct_array.columns().iter()) {
                                                    let field_name = field.name();
                                                    let value = match col.data_type() {
                                                        arrow::datatypes::DataType::Int32 => {
                                                            let array = col.as_any().downcast_ref::<Int32Array>().unwrap();
                                                            if array.is_null(row_idx) { Value::Null }
                                                            else { Value::Number(array.value(row_idx).into()) }
                                                        }
                                                        // Add more field types as needed
                                                        _ => Value::Null,
                                                    };
                                                    map.insert(field_name.to_string(), value);
                                                }
                                                DataType::Json(Some(process_json_value(Value::Object(map))))
                                            }
                                        }
                                        arrow::datatypes::DataType::Union(_, _) => {
                                            // Unions are complex - convert to string representation
                                            DataType::Text(Some("Union type not fully supported".to_string()))
                                        }
                                        arrow::datatypes::DataType::Dictionary(_, _) => {
                                            let dict_array = column.as_any().downcast_ref::<arrow::array::DictionaryArray<arrow::datatypes::Int32Type>>().unwrap();
                                            if dict_array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let values = dict_array.values();
                                                match values.data_type() {
                                                    arrow::datatypes::DataType::Utf8 => {
                                                        let string_values = values.as_any().downcast_ref::<StringArray>().unwrap();
                                                        let key = dict_array.keys().value(row_idx);
                                                        DataType::Text(Some(string_values.value(key as usize).to_string()))
                                                    }
                                                    _ => DataType::Text(Some("Unsupported dictionary type".to_string())),
                                                }
                                            }
                                        }
                                        arrow::datatypes::DataType::Map(_, _) => {
                                            // Convert map to JSON object
                                            let map_array = column.as_map();
                                            if map_array.is_null(row_idx) { DataType::Null }
                                            else {
                                                let entries = map_array.value(row_idx);
                                                let mut json_map = serde_json::Map::new();
                                                // Assuming string keys and numeric values for simplicity
                                                for i in 0..entries.len() {
                                                    if let (Some(key), Some(value)) = (
                                                        entries.column(0).as_any().downcast_ref::<StringArray>().map(|arr| arr.value(i)),
                                                        entries.column(1).as_any().downcast_ref::<Int64Array>().map(|arr| arr.value(i))
                                                    ) {
                                                        json_map.insert(key.to_string(), Value::Number(value.into()));
                                                    }
                                                }
                                                DataType::Json(Some(process_json_value(Value::Object(json_map))))
                                            }
                                        }
                                        arrow::datatypes::DataType::RunEndEncoded(_, _) => {
                                            // Convert run-length encoded data to its base type
                                            // This is a simplified handling
                                            DataType::Text(Some("Run-length encoded type not fully supported".to_string()))
                                        }
                                    };
                                    (field.name().clone(), data_type)
                                })
                                .collect::<IndexMap<String, DataType>>()
                        })
                    })
                    .collect()
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
            tracing::error!("There was an issue while closing the snowflake client: {}", e);
        }
    }

    Ok(rows)
}
