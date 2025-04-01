use arrow::array::{Array, AsArray};
use arrow::array::{
    BinaryArray, BooleanArray, Date32Array, Date64Array, Decimal128Array, Decimal256Array,
    FixedSizeBinaryArray, Float32Array, Float64Array, Int16Array, Int32Array, Int64Array,
    Int8Array, LargeBinaryArray, LargeStringArray, StringArray, TimestampNanosecondArray,
    UInt16Array, UInt32Array, UInt64Array, UInt8Array,
};
use arrow::datatypes::{DataType as ArrowDataType, Field, TimeUnit};
use arrow::record_batch::RecordBatch;
use indexmap::IndexMap;

use anyhow::{anyhow, Error};
use chrono::{DateTime, LocalResult, NaiveTime, TimeZone, Utc};
use snowflake_api::{QueryResult, SnowflakeApi};

use serde_json::{Map as JsonMap, Value};

use crate::utils::query_engine::data_types::DataType;

// -------------------------
// String & JSON Processing 
// -------------------------

fn process_string_value(value: String) -> String {
    value.to_lowercase()
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

// -------------------------
// Timestamp Handling
// -------------------------

fn parse_snowflake_timestamp(epoch_data: i64, subsec_nanos: u32) -> Result<DateTime<Utc>, Error> {
    match Utc.timestamp_opt(epoch_data, subsec_nanos) {
        LocalResult::Single(dt) => Ok(dt),
        _ => Err(anyhow!("Invalid timestamp value")),
    }
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

// -------------------------
// Decimal Handling
// -------------------------

fn format_decimal_as_string(abs_val_str: &str, scale: i8, is_negative: bool, val_str: &str) -> DataType {
    let decimal_str = if scale > 0 {
        if abs_val_str.len() <= scale as usize {
            // Need to pad with zeros
            let padding = scale as usize - abs_val_str.len();
            let mut result = String::from("0.");
            for _ in 0..padding {
                result.push('0');
            }
            result.push_str(abs_val_str);
            if is_negative { format!("-{}", result) } else { result }
        } else {
            // Insert decimal point
            let decimal_pos = abs_val_str.len() - scale as usize;
            let (int_part, frac_part) = abs_val_str.split_at(decimal_pos);
            if is_negative {
                format!("-{}.{}", int_part, frac_part)
            } else {
                format!("{}.{}", int_part, frac_part)
            }
        }
    } else if scale < 0 {
        // Add zeros to the end
        let mut result = abs_val_str.to_string();
        for _ in 0..(-scale as usize) {
            result.push('0');
        }
        if is_negative { format!("-{}", result) } else { result }
    } else {
        val_str.to_string()
    };
    
    DataType::Text(Some(decimal_str))
}

fn handle_decimal128_array(array: &Decimal128Array, row_idx: usize, scale: i8) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }

    let val = array.value(row_idx);
    
    // Convert to string first to avoid immediate precision loss
    let val_str = val.to_string();
    
    // Special case for very small numbers with high precision
    if scale > 7 && val.abs() < 1000 {
        // Use text for very small decimals with many decimal places
        let is_negative = val < 0;
        let abs_val_str = if is_negative { &val_str[1..] } else { &val_str };
        return format_decimal_as_string(abs_val_str, scale, is_negative, &val_str);
    }
    
    // Try parsing as f64 only for values within safe range
    // 2^53 is approximately the largest integer precisely representable in f64
    if val.abs() < 9_007_199_254_740_992_i128 {
        let decimal_val = val as f64;
        let scaled_val = if scale > 0 {
            decimal_val / 10_f64.powi(scale as i32)
        } else if scale < 0 {
            decimal_val * 10_f64.powi((-scale) as i32)
        } else {
            decimal_val
        };
        DataType::Float8(Some(scaled_val))
    } else {
        // For larger values, use string formatting
        let is_negative = val < 0;
        let abs_val_str = if is_negative { &val_str[1..] } else { &val_str };
        format_decimal_as_string(abs_val_str, scale, is_negative, &val_str)
    }
}

fn handle_decimal256_array(array: &Decimal256Array, row_idx: usize, scale: i8) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }

    let val = array.value(row_idx);
    let val_str = val.to_string();
    
    // Special case for very large values with negative scale - always use text
    if scale < -5 {
        let is_negative = val_str.starts_with('-');
        let abs_val_str = if is_negative { &val_str[1..] } else { &val_str };
        return format_decimal_as_string(abs_val_str, scale, is_negative, &val_str);
    }
    
    // Try to determine if value is within safe f64 range (< 2^53)
    if val_str.len() < 16 {  // Conservatively less than 16 digits
        if let Ok(unscaled_val) = val_str.parse::<f64>() {
            // Only use f64 if it's within the safe integer range
            if unscaled_val.abs() < 9_007_199_254_740_992_f64 {
                let scaled_val = if scale > 0 {
                    unscaled_val / 10_f64.powi(scale as i32)
                } else if scale < 0 {
                    unscaled_val * 10_f64.powi((-scale) as i32)
                } else {
                    unscaled_val
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // For all other cases, use string formatting for precision
    let is_negative = val_str.starts_with('-');
    let abs_val_str = if is_negative { &val_str[1..] } else { &val_str };
    format_decimal_as_string(abs_val_str, scale, is_negative, &val_str)
}

// -------------------------
// Basic Type Handlers
// -------------------------

fn handle_boolean_array(array: &BooleanArray, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        DataType::Bool(Some(array.value(row_idx)))
    }
}

fn handle_int8_array(array: &Int8Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // This is a decimal value
                let decimal_val = val as f64;
                let scaled_val = if scale > 0 {
                    decimal_val / 10_f64.powi(scale)
                } else {
                    decimal_val * 10_f64.powi(-scale)
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // Default case for regular integer
    DataType::Int2(Some(val as i16))
}

fn handle_int16_array(array: &Int16Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // This is a decimal value
                let decimal_val = val as f64;
                let scaled_val = if scale > 0 {
                    decimal_val / 10_f64.powi(scale)
                } else {
                    decimal_val * 10_f64.powi(-scale)
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // Default case for regular integer
    DataType::Int2(Some(val))
}

fn handle_int32_array(array: &Int32Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // This is a decimal value
                let decimal_val = val as f64;
                let scaled_val = if scale > 0 {
                    decimal_val / 10_f64.powi(scale)
                } else {
                    decimal_val * 10_f64.powi(-scale)
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // Default case for regular integer
    DataType::Int4(Some(val))
}

fn handle_int64_array(array: &Int64Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // This is a decimal value
                let decimal_val = val as f64;
                let scaled_val = if scale > 0 {
                    decimal_val / 10_f64.powi(scale)
                } else {
                    decimal_val * 10_f64.powi(-scale)
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // Default case for regular integer
    DataType::Int8(Some(val))
}

fn handle_uint8_array(array: &UInt8Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // This is a decimal value
                let decimal_val = val as f64;
                let scaled_val = if scale > 0 {
                    decimal_val / 10_f64.powi(scale)
                } else {
                    decimal_val * 10_f64.powi(-scale)
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // Default case for regular integer
    DataType::Int2(Some(val as i16))
}

fn handle_uint16_array(array: &UInt16Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // This is a decimal value
                let decimal_val = val as f64;
                let scaled_val = if scale > 0 {
                    decimal_val / 10_f64.powi(scale)
                } else {
                    decimal_val * 10_f64.powi(-scale)
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // Default case for regular integer
    DataType::Int4(Some(val as i32))
}

fn handle_uint32_array(array: &UInt32Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // This is a decimal value
                let decimal_val = val as f64;
                let scaled_val = if scale > 0 {
                    decimal_val / 10_f64.powi(scale)
                } else {
                    decimal_val * 10_f64.powi(-scale)
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // Default case for regular integer
    DataType::Int8(Some(val as i64))
}

fn handle_uint64_array(array: &UInt64Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // This is a decimal value
                let decimal_val = val as f64;
                let scaled_val = if scale > 0 {
                    decimal_val / 10_f64.powi(scale)
                } else {
                    decimal_val * 10_f64.powi(-scale)
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // Default case for regular integer
    DataType::Int8(Some(val as i64))
}

fn handle_float32_array(array: &Float32Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // Apply scale if specified in metadata
                let scaled_val = if scale > 0 {
                    val / 10_f32.powi(scale)
                } else {
                    val * 10_f32.powi(-scale)
                };
                return DataType::Float4(Some(scaled_val));
            }
        }
    }
    
    // Default case
    DataType::Float4(Some(val))
}

fn handle_float64_array(array: &Float64Array, row_idx: usize, scale_str: Option<&str>) -> DataType {
    if array.is_null(row_idx) {
        return DataType::Null;
    }
    
    let val = array.value(row_idx);
    
    // Check if this is actually a decimal with scale
    if let Some(scale_str) = scale_str {
        if let Ok(scale) = scale_str.parse::<i32>() {
            if scale != 0 {
                // Apply scale if specified in metadata
                let scaled_val = if scale > 0 {
                    val / 10_f64.powi(scale)
                } else {
                    val * 10_f64.powi(-scale)
                };
                return DataType::Float8(Some(scaled_val));
            }
        }
    }
    
    // Default case
    DataType::Float8(Some(val))
}

fn handle_string_array(array: &StringArray, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        DataType::Text(Some(process_string_value(array.value(row_idx).to_string())))
    }
}

fn handle_large_string_array(array: &LargeStringArray, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        DataType::Text(Some(process_string_value(array.value(row_idx).to_string())))
    }
}

fn handle_binary_array(array: &BinaryArray, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        DataType::Bytea(Some(array.value(row_idx).to_vec()))
    }
}

fn handle_large_binary_array(array: &LargeBinaryArray, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        DataType::Bytea(Some(array.value(row_idx).to_vec()))
    }
}

fn handle_fixed_size_binary_array(array: &FixedSizeBinaryArray, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        DataType::Bytea(Some(array.value(row_idx).to_vec()))
    }
}

// -------------------------
// Date/Time Handlers
// -------------------------

fn handle_date32_array(array: &Date32Array, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        let days = array.value(row_idx);
        let timestamp = days as i64 * 24 * 60 * 60;
        match Utc.timestamp_opt(timestamp, 0) {
            LocalResult::Single(dt) => DataType::Date(Some(dt.date_naive())),
            _ => DataType::Null,
        }
    }
}

fn handle_date64_array(array: &Date64Array, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        let millis = array.value(row_idx);
        let secs = millis / 1000;
        let nanos = ((millis % 1000) * 1_000_000) as u32;
        match Utc.timestamp_opt(secs, nanos) {
            LocalResult::Single(dt) => DataType::Date(Some(dt.date_naive())),
            _ => DataType::Null,
        }
    }
}

fn handle_timestamp_array(
    array: &TimestampNanosecondArray,
    row_idx: usize,
    unit: &TimeUnit,
    tz: Option<&String>,
) -> DataType {
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

fn handle_time32_array(array: &Int32Array, row_idx: usize, time_unit: &TimeUnit) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
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

fn handle_time64_array(array: &Int64Array, row_idx: usize, time_unit: &TimeUnit) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
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

// -------------------------
// Complex Type Handlers
// -------------------------

fn handle_list_array(array: &arrow::array::ListArray, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        let values = array.value(row_idx);
        let mut result = Vec::new();
        
        for i in 0..values.len() {
            if values.is_null(i) {
                continue;
            }
            
            let value = if let Some(num) = values.as_any().downcast_ref::<Int32Array>() {
                Some(Value::Number(num.value(i).into()))
            } else if let Some(num) = values.as_any().downcast_ref::<Int64Array>() {
                Some(Value::Number(num.value(i).into()))
            } else if let Some(str) = values.as_any().downcast_ref::<StringArray>() {
                Some(Value::String(process_string_value(str.value(i).to_string())))
            } else {
                None
            };
            
            if let Some(v) = value {
                result.push(v);
            }
        }
        
        DataType::Json(Some(process_json_value(Value::Array(result))))
    }
}

fn handle_struct_array(array: &arrow::array::StructArray, row_idx: usize, field: &Field) -> DataType {
    // Check if this is a Snowflake timestamp struct
    let fields = match field.data_type() {
        ArrowDataType::Struct(fields) => fields,
        _ => return DataType::Null,
    };
    
    if fields.len() == 2 
        && fields.iter().any(|f| f.name() == "epoch")
        && fields.iter().any(|f| f.name() == "fraction")
        && field.metadata().get("logicalType").map_or(false, |v| v.contains("TIMESTAMP")) 
    {
        if let Some(dt) = handle_snowflake_timestamp_struct(array, row_idx) {
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
        if array.is_null(row_idx) {
            DataType::Null
        } else {
            let mut map = JsonMap::new();
            for (field, col) in fields.iter().zip(array.columns().iter()) {
                let field_name = field.name();
                let value = if col.is_null(row_idx) {
                    Value::Null
                } else if let Some(array) = col.as_any().downcast_ref::<Int32Array>() {
                    Value::Number(array.value(row_idx).into())
                } else if let Some(array) = col.as_any().downcast_ref::<Int64Array>() {
                    Value::Number(array.value(row_idx).into())
                } else if let Some(array) = col.as_any().downcast_ref::<Float64Array>() {
                    serde_json::Number::from_f64(array.value(row_idx))
                        .map(Value::Number)
                        .unwrap_or(Value::Null)
                } else if let Some(array) = col.as_any().downcast_ref::<StringArray>() {
                    Value::String(array.value(row_idx).to_string())
                } else {
                    Value::Null
                };
                map.insert(field_name.to_string(), value);
            }
            DataType::Json(Some(process_json_value(Value::Object(map))))
        }
    }
}

fn handle_dictionary_array(array: &arrow::array::DictionaryArray<arrow::datatypes::Int32Type>, row_idx: usize) -> DataType {
    if array.is_null(row_idx) {
        DataType::Null
    } else {
        let values = array.values();
        if let Some(string_values) = values.as_any().downcast_ref::<StringArray>() {
            let key = array.keys().value(row_idx);
            DataType::Text(Some(string_values.value(key as usize).to_string()))
        } else {
            DataType::Text(Some("Unsupported dictionary type".to_string()))
        }
    }
}

fn handle_map_array(array: &dyn Array, row_idx: usize) -> DataType {
    let map_array = array.as_map();
    if map_array.is_null(row_idx) {
        DataType::Null
    } else {
        let entries = map_array.value(row_idx);
        let mut json_map = JsonMap::new();
        
        // Process map entries
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
                json_map.insert(key.to_string(), Value::Number(value.into()));
            }
        }
        
        DataType::Json(Some(process_json_value(Value::Object(json_map))))
    }
}

// -------------------------
// Main Converter
// -------------------------

fn convert_array_to_datatype(column: &arrow::array::ArrayRef, field: &Field, row_idx: usize) -> DataType {
    let scale_str = field.metadata().get("scale");
    
    match column.data_type() {
        ArrowDataType::Boolean => {
            let array = column.as_any().downcast_ref::<BooleanArray>().unwrap();
            handle_boolean_array(array, row_idx)
        },
        ArrowDataType::Int8 => {
            let array = column.as_any().downcast_ref::<Int8Array>().unwrap();
            handle_int8_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::Int16 => {
            let array = column.as_any().downcast_ref::<Int16Array>().unwrap();
            handle_int16_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::Int32 => {
            let array = column.as_any().downcast_ref::<Int32Array>().unwrap();
            handle_int32_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::Int64 => {
            let array = column.as_any().downcast_ref::<Int64Array>().unwrap();
            handle_int64_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::UInt8 => {
            let array = column.as_any().downcast_ref::<UInt8Array>().unwrap();
            handle_uint8_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::UInt16 => {
            let array = column.as_any().downcast_ref::<UInt16Array>().unwrap();
            handle_uint16_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::UInt32 => {
            let array = column.as_any().downcast_ref::<UInt32Array>().unwrap();
            handle_uint32_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::UInt64 => {
            let array = column.as_any().downcast_ref::<UInt64Array>().unwrap();
            handle_uint64_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::Float32 => {
            let array = column.as_any().downcast_ref::<Float32Array>().unwrap();
            handle_float32_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::Float64 => {
            let array = column.as_any().downcast_ref::<Float64Array>().unwrap();
            handle_float64_array(array, row_idx, scale_str.map(|s| s.as_str()))
        },
        ArrowDataType::Utf8 => {
            let array = column.as_any().downcast_ref::<StringArray>().unwrap();
            handle_string_array(array, row_idx)
        },
        ArrowDataType::LargeUtf8 => {
            let array = column.as_any().downcast_ref::<LargeStringArray>().unwrap();
            handle_large_string_array(array, row_idx)
        },
        ArrowDataType::Binary => {
            let array = column.as_any().downcast_ref::<BinaryArray>().unwrap();
            handle_binary_array(array, row_idx)
        },
        ArrowDataType::LargeBinary => {
            let array = column.as_any().downcast_ref::<LargeBinaryArray>().unwrap();
            handle_large_binary_array(array, row_idx)
        },
        ArrowDataType::Date32 => {
            let array = column.as_any().downcast_ref::<Date32Array>().unwrap();
            handle_date32_array(array, row_idx)
        },
        ArrowDataType::Date64 => {
            let array = column.as_any().downcast_ref::<Date64Array>().unwrap();
            handle_date64_array(array, row_idx)
        },
        ArrowDataType::Timestamp(unit, tz) => {
            let array = column.as_any().downcast_ref::<TimestampNanosecondArray>().unwrap();
            let tz_string = tz.as_ref().map(|tz_str| tz_str.to_string());
            handle_timestamp_array(array, row_idx, unit, tz_string.as_ref())
        },
        ArrowDataType::Decimal128(_, scale) => {
            let array = column.as_any().downcast_ref::<Decimal128Array>().unwrap();
            handle_decimal128_array(array, row_idx, *scale)
        },
        ArrowDataType::Decimal256(_, scale) => {
            let array = column.as_any().downcast_ref::<Decimal256Array>().unwrap();
            handle_decimal256_array(array, row_idx, *scale)
        },
        ArrowDataType::Time32(time_unit) => {
            let array = column.as_any().downcast_ref::<Int32Array>().unwrap();
            handle_time32_array(array, row_idx, time_unit)
        },
        ArrowDataType::Time64(time_unit) => {
            let array = column.as_any().downcast_ref::<Int64Array>().unwrap();
            handle_time64_array(array, row_idx, time_unit)
        },
        ArrowDataType::FixedSizeBinary(_) => {
            let array = column.as_any().downcast_ref::<FixedSizeBinaryArray>().unwrap();
            handle_fixed_size_binary_array(array, row_idx)
        },
        ArrowDataType::Duration(_) => {
            // Convert duration to milliseconds as float for consistency
            let array = column.as_any().downcast_ref::<Int64Array>().unwrap();
            if array.is_null(row_idx) {
                DataType::Null
            } else {
                DataType::Float8(Some(array.value(row_idx) as f64))
            }
        },
        ArrowDataType::Interval(_) => {
            // Convert interval to a string representation
            let array = column.as_any().downcast_ref::<Int64Array>().unwrap();
            if array.is_null(row_idx) {
                DataType::Null
            } else {
                DataType::Text(Some(array.value(row_idx).to_string()))
            }
        },
        ArrowDataType::BinaryView => {
            // BinaryView is similar to Binary
            let array = column.as_any().downcast_ref::<BinaryArray>().unwrap();
            handle_binary_array(array, row_idx)
        },
        ArrowDataType::Utf8View => {
            // Utf8View is similar to Utf8
            let array = column.as_any().downcast_ref::<StringArray>().unwrap();
            handle_string_array(array, row_idx)
        },
        ArrowDataType::List(_) | ArrowDataType::ListView(_) | ArrowDataType::FixedSizeList(_, _) 
        | ArrowDataType::LargeList(_) | ArrowDataType::LargeListView(_) => {
            let array = column.as_any().downcast_ref::<arrow::array::ListArray>().unwrap();
            handle_list_array(array, row_idx)
        },
        ArrowDataType::Struct(_) => {
            let array = column.as_any().downcast_ref::<arrow::array::StructArray>().unwrap();
            handle_struct_array(array, row_idx, field)
        },
        ArrowDataType::Union(_, _) => {
            // Unions are complex - convert to string representation
            DataType::Text(Some("Union type not fully supported".to_string()))
        },
        ArrowDataType::Dictionary(_, _) => {
            let array = column.as_any().downcast_ref::<arrow::array::DictionaryArray<arrow::datatypes::Int32Type>>().unwrap();
            handle_dictionary_array(array, row_idx)
        },
        ArrowDataType::Map(_, _) => {
            handle_map_array(column.as_ref(), row_idx)
        },
        ArrowDataType::RunEndEncoded(_, _) => {
            // Convert run-length encoded data to its base type
            // This is a simplified handling
            DataType::Text(Some("Run-length encoded type not fully supported".to_string()))
        },
        ArrowDataType::Float16 => {
            let array = column.as_any().downcast_ref::<Float32Array>().unwrap(); // Float16 gets converted to Float32 in Arrow
            if array.is_null(row_idx) {
                DataType::Null
            } else {
                DataType::Float4(Some(array.value(row_idx)))
            }
        },
        ArrowDataType::Null => DataType::Null,
    }
}

// -------------------------
// Query Execution & Processing
// -------------------------

fn prepare_query(query: &str) -> String {
    const MAX_ROWS: usize = 1_000;

    let query_no_semicolon = query.trim_end_matches(';');
    if !query_no_semicolon.to_lowercase().contains("limit") {
        format!("{} FETCH FIRST {} ROWS ONLY", query_no_semicolon, MAX_ROWS)
    } else {
        query_no_semicolon.to_string()
    }
}

fn process_record_batch(batch: &RecordBatch) -> Vec<IndexMap<String, DataType>> {
    let mut rows = Vec::with_capacity(batch.num_rows());
    let schema = batch.schema();
    
    for row_idx in 0..batch.num_rows() {
        let row = schema
            .fields()
            .iter()
            .enumerate()
            .map(|(col_idx, field)| {
                let column = batch.column(col_idx);
                let data_type = convert_array_to_datatype(column, field, row_idx);
                (field.name().clone(), data_type)
            })
            .collect::<IndexMap<String, DataType>>();
        
        rows.push(row);
    }
    
    rows
}

pub async fn snowflake_query(
    mut snowflake_client: SnowflakeApi,
    query: String,
) -> Result<Vec<IndexMap<String, DataType>>, Error> {
    let limited_query = prepare_query(&query);

    let rows = match snowflake_client.exec(&limited_query).await {
        Ok(result) => match result {
            QueryResult::Arrow(result) => {
                let mut all_rows = Vec::new();
                
                // Process each batch in order
                for batch in result.iter() {
                    let batch_rows = process_record_batch(batch);
                    all_rows.extend(batch_rows);
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
            tracing::error!("There was an issue while closing the snowflake client: {}", e);
        }
    }

    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::*;
    use arrow::array::{Decimal128Array, Decimal256Array};
    use arrow::datatypes::DataType as ArrowDataType;
    use std::str::FromStr;
    use std::sync::Arc;
    use arrow::datatypes::i256;

    #[test]
    fn test_decimal128_conversion() {
        // Test cases: (value, precision, scale, expected_result)
        let test_cases = vec![
            // Small value, positive scale
            (123_i128, 5, 2, DataType::Float8(Some(1.23))),
            
            // Small value, negative scale
            (123_i128, 3, -2, DataType::Float8(Some(12300.0))),
            
            // Zero scale
            (123_i128, 3, 0, DataType::Float8(Some(123.0))),
            
            // Value at limit of f64 precision
            (9_007_199_254_740_991_i128, 16, 0, DataType::Float8(Some(9_007_199_254_740_991.0))),
            
            // Value beyond f64 precision limit - should be text
            (9_007_199_254_740_992_i128, 16, 0, DataType::Text(Some("9007199254740992".to_string()))),
            
            // Large value with positive scale - should be text
            (9_007_199_254_740_992_i128, 20, 4, DataType::Text(Some("900719925474099.2".to_string()))),
            
            // Negative value
            (-123456_i128, 8, 2, DataType::Float8(Some(-1234.56))),
            
            // Small decimal requiring padding
            (123_i128, 10, 5, DataType::Float8(Some(0.00123))),
            
            // Very small decimal requiring much padding
            (1_i128, 10, 9, DataType::Text(Some("0.000000001".to_string()))),
        ];

        for (i, (value, precision, scale, expected)) in test_cases.iter().enumerate() {
            // Create a Decimal128Array with a single value
            let array = Decimal128Array::from(vec![Some(*value)])
                .with_precision_and_scale(*precision, *scale)
                .unwrap();
            
            // Test our handler function
            let result = handle_decimal128_array(&array, 0, *scale);
            
            // Check if the result matches the expected output
            assert_eq!(result, *expected, "Test case {} failed", i);
        }
    }

    #[test]
    fn test_decimal256_conversion() {
        use arrow::array::Decimal256Builder;
        use arrow::datatypes::DataType as ArrowDataType;
        
        // Test cases: (value_str, precision, scale, expected_result)
        let test_cases = vec![
            // Small value, positive scale
            ("123", 5, 2, DataType::Float8(Some(1.23))),
            
            // Small value, negative scale
            ("123", 3, -2, DataType::Float8(Some(12300.0))),
            
            // Zero scale
            ("123", 3, 0, DataType::Float8(Some(123.0))),
            
            // Medium value with positive scale
            ("123456789", 12, 3, DataType::Float8(Some(123456.789))),
            
            // Large value - should be text
            ("90071992547409920000000000000000000", 38, 0, 
             DataType::Text(Some("90071992547409920000000000000000000".to_string()))),
            
            // Large value with positive scale - should be text
            ("90071992547409920000000000000000000", 38, 5, 
             DataType::Text(Some("900719925474099200000000000000.00000".to_string()))),
            
            // Negative value
            ("-123456", 8, 2, DataType::Float8(Some(-1234.56))),
            
            // Small decimal requiring padding
            ("123", 10, 5, DataType::Float8(Some(0.00123))),
            
            // Very large value with negative scale - should be text
            ("123456789", 10, -10, 
             DataType::Text(Some("1234567890000000000".to_string()))),
        ];

        for (i, (value_str, precision, scale, expected)) in test_cases.iter().enumerate() {
            // Parse decimal value from string
            let value = i256::from_str(value_str).unwrap();
            
            // Build Decimal256Array 
            let mut builder = Decimal256Builder::new(1, *precision, *scale);
            builder.append_value(value);
            let array = builder.finish();
            
            // Test our handler function
            let result = handle_decimal256_array(&array, 0, *scale);
            
            // Check if the result matches the expected output
            assert_eq!(result, *expected, "Test case {} failed", i);
        }
    }

    #[test]
    fn test_null_decimal_values() {
        // Test Decimal128 null
        let array = Decimal128Array::from(vec![None::<i128>])
            .with_precision_and_scale(10, 2)
            .unwrap();
        
        let result = handle_decimal128_array(&array, 0, 2);
        assert_eq!(result, DataType::Null);
        
        // Test Decimal256 null
        let mut builder = Decimal256Builder::new(1, 10, 2);
        builder.append_null();
        let array = builder.finish();
        
        let result = handle_decimal256_array(&array, 0, 2);
        assert_eq!(result, DataType::Null);
    }
}