use diesel::{
    deserialize::{FromSql, FromSqlRow},
    expression::AsExpression,
    pg::Pg,
    serialize::{IsNull, Output, ToSql},
    sql_types::Jsonb,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::Write;

#[derive(Debug, Serialize, Deserialize, Clone, FromSqlRow, AsExpression)]
#[diesel(sql_type = Jsonb)]
pub struct DataMetadata {
    pub column_count: i64,
    pub row_count: i64,
    pub column_metadata: Vec<ColumnMetaData>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ColumnMetaData {
    pub name: String,
    pub min_value: Value,
    pub max_value: Value,
    pub unique_values: i32,
    pub simple_type: SimpleType,
    #[serde(rename = "type")]
    pub column_type: ColumnType,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum SimpleType {
    #[serde(rename = "number")]
    Number,
    #[serde(rename = "string")]
    String,
    #[serde(rename = "date")]
    Date,
    #[serde(rename = "boolean")]
    Boolean,
    #[serde(rename = "other")]
    Other,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum ColumnType {
    #[serde(rename = "int2")]
    Int2,
    #[serde(rename = "int4")]
    Int4,
    #[serde(rename = "int8")]
    Int8,
    #[serde(rename = "float4")]
    Float4,
    #[serde(rename = "float8")]
    Float8,
    #[serde(rename = "varchar")]
    Varchar,
    #[serde(rename = "text")]
    Text,
    #[serde(rename = "bool")]
    Bool,
    #[serde(rename = "date")]
    Date,
    #[serde(rename = "timestamp")]
    Timestamp,
    #[serde(rename = "timestamptz")]
    Timestamptz,
    #[serde(rename = "other")]
    Other,
}

// Implement FromSql for database serialization
impl FromSql<Jsonb, Pg> for DataMetadata {
    fn from_sql(bytes: diesel::pg::PgValue) -> diesel::deserialize::Result<Self> {
        let value = <Value as FromSql<Jsonb, Pg>>::from_sql(bytes)?;
        Ok(serde_json::from_value(value)?)
    }
}

// Implement ToSql for database serialization
impl ToSql<Jsonb, Pg> for DataMetadata {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> diesel::serialize::Result {
        out.write_all(&[1])?; // JSONB version 1 header
        out.write_all(&serde_json::to_vec(self)?)?;
        Ok(IsNull::No)
    }
} 