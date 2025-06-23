use std::ops::ControlFlow;

use chrono::Utc;
use futures::TryStreamExt;
use indexmap::IndexMap;

use anyhow::{Error, Result};
use sqlx::{Column, Pool, Postgres, Row};

use crate::data_types::DataType;
use sqlparser::ast::{Expr, Ident, ObjectName, VisitMut, VisitorMut};
use sqlparser::dialect::PostgreSqlDialect;
use sqlparser::parser::Parser;

struct QuotedIdentifierColumnVisitor;

impl VisitorMut for QuotedIdentifierColumnVisitor {
    type Break = ();

    fn post_visit_expr(&mut self, expr: &mut Expr) -> ControlFlow<Self::Break> {
        match expr {
            Expr::Identifier(ident) => {
                *ident = Ident::with_quote('"', ident.value.clone());
            }
            Expr::CompoundIdentifier(compound_ident) => {
                *expr = Expr::CompoundIdentifier(
                    compound_ident
                        .iter()
                        .map(|ident| Ident::with_quote('"', ident.value.clone()))
                        .collect(),
                );
            }
            _ => {}
        }

        ControlFlow::Continue(())
    }
}

struct QuotedIdentifierTableVisitor;

impl VisitorMut for QuotedIdentifierTableVisitor {
    type Break = ();

    fn post_visit_relation(&mut self, rel: &mut ObjectName) -> ControlFlow<Self::Break> {
        rel.0 = rel
            .0
            .iter()
            .map(|ident| Ident::with_quote('"', ident.value.clone()))
            .collect();

        ControlFlow::Continue(())
    }
}

pub async fn postgres_query(
    pg_pool: Pool<Postgres>,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<std::string::String, DataType>>, Error> {
    // Parse the query and quote identifiers
    let dialect = PostgreSqlDialect {};
    let mut ast = Parser::parse_sql(&dialect, &query)?;

    let mut column_visitor = QuotedIdentifierColumnVisitor;
    ast.visit(&mut column_visitor);
    let mut table_visitor = QuotedIdentifierTableVisitor;
    ast.visit(&mut table_visitor);

    let formatted_sql = ast[0].to_string();

    // Get the limit value, defaulting to 5000 if not specified
    let default_limit = 5000;
    let limit_value = limit.unwrap_or(default_limit) as usize;
    
    // Create query stream without appending LIMIT
    let mut stream = sqlx::raw_sql(&formatted_sql).fetch(&pg_pool);

    // Pre-allocate result vector with estimated capacity to reduce allocations
    let mut result: Vec<IndexMap<String, DataType>> = Vec::with_capacity(limit_value);

    // Process all rows without spawning tasks per row
    while let Some(row) = stream.try_next().await? {
        let mut row_map: IndexMap<String, DataType> = IndexMap::with_capacity(row.len());

        for (i, column) in row.columns().iter().enumerate() {
            let column_name = column.name();
            let type_info = column.type_info().clone().to_string();
            let column_value = match type_info.as_str() {
                "BOOL" => DataType::Bool(row.try_get::<bool, _>(i).ok()),
                "BYTEA" => DataType::Bytea(row.try_get::<Vec<u8>, _>(i).ok()),
                "CHAR" => DataType::Char(row.try_get::<String, _>(i).ok()),
                "INT8" => DataType::Int8(row.try_get::<i64, _>(i).ok()),
                "INT4" => DataType::Int4(row.try_get::<i32, _>(i).ok()),
                "INT2" => DataType::Int2(row.try_get::<i16, _>(i).ok()),
                "TEXT" | "VARCHAR" | "USER-DEFINED" => DataType::Text(row.try_get::<String, _>(i).ok()),
                "FLOAT4" => DataType::Float4(row.try_get::<f32, _>(i).ok()),
                "FLOAT8" => DataType::Float8(row.try_get::<f64, _>(i).ok()),
                "NUMERIC" => {
                    DataType::Float8(row.try_get(i).ok().and_then(
                        |v: sqlx::types::BigDecimal| v.to_string().parse::<f64>().ok(),
                    ))
                }
                "UUID" => DataType::Uuid(row.try_get::<uuid::Uuid, _>(i).ok()),
                "TIMESTAMP" => {
                    DataType::Timestamp(row.try_get::<chrono::NaiveDateTime, _>(i).ok())
                }
                "DATE" => DataType::Date(row.try_get::<chrono::NaiveDate, _>(i).ok()),
                "TIME" => DataType::Time(row.try_get::<chrono::NaiveTime, _>(i).ok()),
                "TIMESTAMPTZ" => {
                    DataType::Timestamptz(row.try_get::<chrono::DateTime<Utc>, _>(i).ok())
                }
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
