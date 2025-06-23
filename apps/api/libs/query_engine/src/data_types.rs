use chrono::{DateTime, NaiveDate, NaiveDateTime, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tiberius::numeric::Decimal;
use uuid::Uuid;
use std::hash::{Hash, Hasher};
use std::fmt;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum DataType {
    Bool(Option<bool>),
    Bytea(Option<Vec<u8>>),
    Char(Option<String>),
    Int8(Option<i64>),
    Int4(Option<i32>),
    Int2(Option<i16>),
    Text(Option<String>),
    Oid(Option<u32>),
    Float4(Option<f32>),
    Float8(Option<f64>),
    Decimal(Option<Decimal>),
    Uuid(Option<Uuid>),
    Timestamp(Option<NaiveDateTime>),
    Timestamptz(Option<DateTime<Utc>>),
    Date(Option<NaiveDate>),
    Time(Option<NaiveTime>),
    // TODO: Need to figure out what to do with json even though I think its less of a problem bc of modeling
    Json(Option<Value>),
    Unknown(Option<String>),
    Null,
}

impl Hash for DataType {
    fn hash<H: Hasher>(&self, state: &mut H) {
        match self {
            DataType::Float4(v) => v.map(|x| x.to_bits()).hash(state),
            DataType::Float8(v) => v.map(|x| x.to_bits()).hash(state),
            // ... hash other variants normally ...
            _ => core::mem::discriminant(self).hash(state),
        }
    }
}

impl PartialEq for DataType {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (DataType::Float4(a), DataType::Float4(b)) => a.map(|x| x.to_bits()) == b.map(|x| x.to_bits()),
            (DataType::Float8(a), DataType::Float8(b)) => a.map(|x| x.to_bits()) == b.map(|x| x.to_bits()),
            _ => format!("{:?}", self) == format!("{:?}", other)
        }
    }
}

impl fmt::Display for DataType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let type_str = match self {
            DataType::Bool(_) => "bool",
            DataType::Bytea(_) => "bytea",
            DataType::Char(_) => "char",
            DataType::Int8(_) => "int8",
            DataType::Int4(_) => "int4",
            DataType::Int2(_) => "int2",
            DataType::Text(_) => "text",
            DataType::Oid(_) => "int4",
            DataType::Float4(_) => "float4",
            DataType::Float8(_) => "float8",
            DataType::Decimal(_) => "decimal",
            DataType::Uuid(_) => "uuid",
            DataType::Timestamp(_) => "timestamp",
            DataType::Timestamptz(_) => "timestamptz",
            DataType::Date(_) => "date",
            DataType::Time(_) => "time",
            DataType::Json(_) => "json",
            DataType::Unknown(_) => "unknown",
            DataType::Null => "null",
        };
        write!(f, "{}", type_str)
    }
}

impl DataType {

    pub fn simple_type(&self) -> Option<String> {
        match self {
            DataType::Bool(_) => Some("boolean".to_string()),
            DataType::Int8(_) => Some("number".to_string()),
            DataType::Int4(_) => Some("number".to_string()),
            DataType::Int2(_) => Some("number".to_string()),
            DataType::Float4(_) => Some("number".to_string()),
            DataType::Float8(_) => Some("number".to_string()),
            DataType::Decimal(_) => Some("number".to_string()),
            DataType::Uuid(_) => Some("string".to_string()),
            DataType::Timestamp(_) => Some("date".to_string()),
            DataType::Timestamptz(_) => Some("date".to_string()),
            DataType::Date(_) => Some("date".to_string()),
            DataType::Time(_) => Some("date".to_string()),
            DataType::Json(_) => Some("string".to_string()),
            DataType::Unknown(_) => Some("string".to_string()),
            DataType::Null => Some("null".to_string()),
            DataType::Bytea(_) => Some("string".to_string()),
            DataType::Char(_) => Some("string".to_string()),
            DataType::Text(_) => Some("string".to_string()),
            DataType::Oid(_) => Some("string".to_string()),
        }
    }
}
