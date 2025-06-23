use crate::data_types::DataType;
use anyhow::{anyhow, Error, Result};
use chrono::NaiveDateTime;
use indexmap::IndexMap;
use tiberius::{numeric::Decimal, Client, ColumnType};
use tokio::net::TcpStream;
use tokio_util::compat::Compat;

pub async fn sql_server_query(
    mut client: Client<Compat<TcpStream>>,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<std::string::String, DataType>>, Error> {
    // Apply the limit directly at the database level
    let default_limit = 5000;
    let limit_value = limit.unwrap_or(default_limit);
    
    // Check if query already has TOP/OFFSET syntax
    let sql_with_limit = if !query.to_lowercase().contains("top") && !query.to_lowercase().contains("offset") {
        // Add TOP clause for SQL Server
        let trimmed_query = query.trim_start();
        
        // Find position of SELECT to insert TOP after it
        if let Some(select_pos) = trimmed_query.to_lowercase().find("select") {
            let (before_select, after_select) = trimmed_query.split_at(select_pos + 6);
            format!("{} TOP({}) {}", before_select, limit_value, after_select)
        } else {
            // If no SELECT found, return original query
            query
        }
    } else {
        query
    };
    
    // Execute the query with limit
    let rows = match client.query(&sql_with_limit, &[]).await {
        Ok(rows) => rows,
        Err(e) => {
            tracing::error!("Unable to execute query: {:?}", e);
            return Err(anyhow!("Unable to execute query: {}", e));
        }
    };

    // Pre-allocate result vector with estimated capacity
    let mut result: Vec<IndexMap<String, DataType>> = Vec::with_capacity(limit_value as usize);
    
    let query_result = match rows.into_first_result().await {
        Ok(query_result) => query_result,
        Err(e) => {
            tracing::error!("Unable to fetch query result: {:?}", e);
            return Err(anyhow!("Unable to fetch query result: {}", e));
        }
    };

    // Process rows sequentially without spawning tasks
    for row in query_result {
        let mut row_map = IndexMap::with_capacity(row.columns().len());
        
        for (i, column) in row.columns().iter().enumerate() {
            let column_name = column.name();
            let type_info = column.column_type();
            let column_value = match type_info {
                ColumnType::Text
                | ColumnType::NVarchar
                | ColumnType::NChar
                | ColumnType::BigChar
                | ColumnType::NText
                | ColumnType::BigVarChar => {
                    DataType::Text(row.get::<&str, _>(i).map(|v| v.to_string()))
                }
                ColumnType::Int8 => DataType::Bool(row.get::<bool, _>(i)),
                ColumnType::Int4 => DataType::Int4(row.get::<i32, _>(i)),
                ColumnType::Int2 | ColumnType::Int1 => DataType::Int2(row.get::<i16, _>(i)),
                ColumnType::Float4 => DataType::Float4(row.get::<f32, _>(i)),
                ColumnType::Float8 => DataType::Float8(row.get::<f64, _>(i)),
                ColumnType::Bit => DataType::Bool(row.get::<bool, _>(i)),
                ColumnType::Null => DataType::Null,
                ColumnType::Datetime4 => {
                    DataType::Timestamp(row.get::<NaiveDateTime, _>(i))
                }
                ColumnType::Money => DataType::Int8(row.get::<i64, _>(i)),
                ColumnType::Datetime => DataType::Timestamp(row.get::<NaiveDateTime, _>(i)),
                ColumnType::Money4 => DataType::Int8(row.get::<i64, _>(i)),
                ColumnType::Guid => DataType::Uuid(row.get::<uuid::Uuid, _>(i)),
                ColumnType::Intn => DataType::Int4(row.get::<i32, _>(i)),
                ColumnType::Decimaln => DataType::Decimal(row.get::<Decimal, _>(i)),
                ColumnType::Numericn => DataType::Decimal(row.get::<Decimal, _>(i)),
                ColumnType::Floatn => DataType::Float8(row.get::<f64, _>(i)),
                ColumnType::Datetimen => {
                    DataType::Timestamp(row.get::<NaiveDateTime, _>(i))
                }
                ColumnType::Daten => DataType::Date(row.get::<NaiveDateTime, _>(i).map(|v| v.date())),
                ColumnType::Timen => DataType::Time(row.get::<NaiveDateTime, _>(i).map(|v| v.time())),
                ColumnType::Datetime2 => DataType::Timestamp(row.get::<NaiveDateTime, _>(i)),
                ColumnType::DatetimeOffsetn => DataType::Timestamp(row.get::<NaiveDateTime, _>(i)),
                _ => {
                    tracing::debug!("No match found for type: {:?}", type_info);
                    DataType::Null
                }
            };
            
            row_map.insert(column_name.to_string(), column_value);
        }
        
        result.push(row_map);
    }
    
    Ok(result)
}
