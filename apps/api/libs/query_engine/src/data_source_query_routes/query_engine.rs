use indexmap::IndexMap;
use std::collections::HashSet;

use anyhow::{anyhow, Result};
use uuid::Uuid;

use crate::{
    credentials::Credential,
    data_source_connections::{
        get_bigquery_client::get_bigquery_client, get_databricks_client::get_databricks_client,
        get_mysql_connection::get_mysql_connection,
        get_postgres_connection::get_postgres_connection,
        get_redshift_connection::get_redshift_connection,
        get_snowflake_client::get_snowflake_client,
        get_sql_server_connection::get_sql_server_connection, ssh_tunneling::kill_ssh_tunnel,
    },
    data_types::DataType,
};

use database::types::data_metadata::{ColumnMetaData, ColumnType, DataMetadata, SimpleType};
use database::vault::read_secret;

use super::{
    bigquery_query::bigquery_query, databricks_query::databricks_query, mysql_query::mysql_query,
    postgres_query::postgres_query, redshift_query::redshift_query,
    security_utils::query_safety_filter, snowflake_query::{snowflake_query, ProcessingResult},
    sql_server_query::sql_server_query,
};

// Define a QueryResult structure to hold both results and metadata
#[derive(Debug, Clone)]
pub struct QueryResult {
    pub data: Vec<IndexMap<String, DataType>>,
    pub metadata: DataMetadata,
}

pub async fn query_engine(
    data_source_id: &Uuid,
    sql: &str,
    limit: Option<i64>,
) -> Result<QueryResult> {
    let corrected_sql = sql.to_owned();

    let secure_sql = corrected_sql.clone();

    if let Some(warning) = query_safety_filter(secure_sql.clone()).await { return Err(anyhow!(warning)) };

    let results = match route_to_query(data_source_id, &secure_sql, limit).await {
        Ok(results) => results,
        Err(e) => {
            tracing::error!(
                "There was an issue while querying the parent data source: {}",
                e
            );
            return Err(anyhow!(e));
        }
    };

    // Compute metadata from results
    let metadata = compute_data_metadata(&results);
    
    // Return both results and metadata in the QueryResult structure
    Ok(QueryResult {
        data: results,
        metadata,
    })
}

// Consolidated metadata calculation function
fn compute_data_metadata(data: &[IndexMap<String, DataType>]) -> DataMetadata {
    if data.is_empty() {
        return DataMetadata {
            column_count: 0,
            row_count: 0,
            column_metadata: vec![],
        };
    }

    let first_row = &data[0];
    let column_count = first_row.len() as i64;
    let row_count = data.len() as i64;
    let column_metadata = compute_column_metadata(data);

    DataMetadata {
        column_count,
        row_count,
        column_metadata,
    }
}

// Helper function for computing column metadata
fn compute_column_metadata(data: &[IndexMap<String, DataType>]) -> Vec<ColumnMetaData> {
    if data.is_empty() {
        return vec![];
    }

    let first_row = &data[0];
    let columns: Vec<_> = first_row.keys().cloned().collect();

    columns.iter().map(|column_name| {
        let mut value_map = HashSet::new();
        let mut min_value_numeric: Option<f64> = None; // Use specific name
        let mut max_value_numeric: Option<f64> = None; // Use specific name
        let mut min_value_str: Option<String> = None;
        let mut max_value_str: Option<String> = None;
        let mut determined_type: Option<(SimpleType, ColumnType)> = None;

        for row in data {
            if let Some(value) = row.get(column_name) {
                // Track unique values (up to a reasonable limit)
                if value_map.len() < 100 {
                    value_map.insert(format!("{:?}", value)); // format! handles nulls acceptably
                }

                 // Determine type from first non-null value encountered
                 if determined_type.is_none() {
                     match value {
                         // Check for non-null variants using matches! for conciseness
                         DataType::Int2(Some(_)) | DataType::Int4(Some(_)) | DataType::Int8(Some(_)) |
                         DataType::Float4(Some(_)) | DataType::Float8(Some(_)) | DataType::Text(Some(_)) |
                         DataType::Bool(Some(_)) | DataType::Date(Some(_)) | DataType::Timestamp(Some(_)) |
                         DataType::Timestamptz(Some(_)) | DataType::Json(Some(_)) | DataType::Uuid(Some(_)) |
                          DataType::Decimal(Some(_)) | DataType::Time(Some(_)) => {
                             determined_type = Some(determine_types(value));
                         }
                         // If it's a Null variant or Unknown, keep looking
                         _ => {}
                     }
                 }

                // Calculate min/max based on value's actual type in this row
                match value {
                    DataType::Int2(Some(v)) => {
                        let n = *v as f64;
                        min_value_numeric = Some(min_value_numeric.map_or(n, |min| min.min(n)));
                        max_value_numeric = Some(max_value_numeric.map_or(n, |max| max.max(n)));
                    }
                    DataType::Int4(Some(v)) => {
                        let n = *v as f64;
                        min_value_numeric = Some(min_value_numeric.map_or(n, |min| min.min(n)));
                        max_value_numeric = Some(max_value_numeric.map_or(n, |max| max.max(n)));
                    }
                    DataType::Int8(Some(v)) => {
                        let n = *v as f64;
                        min_value_numeric = Some(min_value_numeric.map_or(n, |min| min.min(n)));
                        max_value_numeric = Some(max_value_numeric.map_or(n, |max| max.max(n)));
                    }
                    DataType::Float4(Some(v)) => {
                        let n = *v as f64;
                        min_value_numeric = Some(min_value_numeric.map_or(n, |min| min.min(n)));
                        max_value_numeric = Some(max_value_numeric.map_or(n, |max| max.max(n)));
                    }
                    DataType::Float8(Some(v)) => {
                        let n = *v as f64;
                        min_value_numeric = Some(min_value_numeric.map_or(n, |min| min.min(n)));
                        max_value_numeric = Some(max_value_numeric.map_or(n, |max| max.max(n)));
                    }
                    DataType::Date(Some(date)) => {
                        update_date_min_max(&date.to_string(), &mut min_value_str, &mut max_value_str);
                    }
                    DataType::Timestamp(Some(ts)) => {
                        update_date_min_max(&ts.to_string(), &mut min_value_str, &mut max_value_str);
                    }
                    DataType::Timestamptz(Some(ts)) => {
                        update_date_min_max(&ts.to_string(), &mut min_value_str, &mut max_value_str);
                    }
                    // Ignore nulls and non-comparable types for min/max calculation
                    _ => {}
                }
            }
        }

        // Finalize types - default if no non-null value was found
        let (simple_type, column_type) = determined_type.unwrap_or((SimpleType::Other, ColumnType::Other));

        // Format min/max values appropriately based on determined simple_type
        let (min_value_json, max_value_json) = match simple_type {
            SimpleType::Number => (
                min_value_numeric.and_then(|v| serde_json::Number::from_f64(v).map(serde_json::Value::Number))
                                .unwrap_or(serde_json::Value::Null),
                max_value_numeric.and_then(|v| serde_json::Number::from_f64(v).map(serde_json::Value::Number))
                                .unwrap_or(serde_json::Value::Null),
            ),
            SimpleType::Date => (
                min_value_str.map_or(serde_json::Value::Null, serde_json::Value::String),
                max_value_str.map_or(serde_json::Value::Null, serde_json::Value::String),
            ),
            // Don't provide min/max for other types
            _ => (serde_json::Value::Null, serde_json::Value::Null),
        };

        ColumnMetaData {
            name: column_name.to_lowercase(),
            min_value: min_value_json,
            max_value: max_value_json,
            unique_values: value_map.len() as i32, // Count includes distinct null representations
            simple_type,
            column_type,
        }
    }).collect()
}

// Helper function to update min/max date values
fn update_date_min_max(
    date_str: &str,
    min_value_str: &mut Option<String>,
    max_value_str: &mut Option<String>,
) {
    if let Some(ref min) = *min_value_str {
        if date_str < min.as_str() {
            *min_value_str = Some(date_str.to_string());
        }
    } else {
        *min_value_str = Some(date_str.to_string());
    }

    if let Some(ref max) = *max_value_str {
        if date_str > max.as_str() {
            *max_value_str = Some(date_str.to_string());
        }
    } else {
        *max_value_str = Some(date_str.to_string());
    }
}

// Helper function to determine column types
fn determine_types(data_type: &DataType) -> (SimpleType, ColumnType) {
    match data_type {
        DataType::Int2(_) => (SimpleType::Number, ColumnType::Int2),
        DataType::Int4(_) => (SimpleType::Number, ColumnType::Int4),
        DataType::Int8(_) => (SimpleType::Number, ColumnType::Int8),
        DataType::Float4(_) => (SimpleType::Number, ColumnType::Float4),
        DataType::Float8(_) => (SimpleType::Number, ColumnType::Float8),
        DataType::Text(_) => (SimpleType::String, ColumnType::Text),
        DataType::Bool(_) => (SimpleType::Boolean, ColumnType::Bool),
        DataType::Date(_) => (SimpleType::Date, ColumnType::Date),
        DataType::Timestamp(_) => (SimpleType::Date, ColumnType::Timestamp),
        DataType::Timestamptz(_) => (SimpleType::Date, ColumnType::Timestamptz),
        _ => (SimpleType::Other, ColumnType::Other),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::postgres::PgPoolOptions;
    use std::env;

    // Test that postgres_query properly applies the limit at the database level
    #[tokio::test]
    async fn test_postgres_query_with_limit() {
        use crate::data_source_query_routes::postgres_query::postgres_query;
        
        // Skip test if no test database is available
        let database_url = match env::var("TEST_DATABASE_URL") {
            Ok(url) => url,
            Err(_) => return, // Skip test if env var not available
        };
        
        // Create a pool with the test database
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .expect("Failed to connect to Postgres");
            
        // Test with explicit limit
        let results = postgres_query(
            pool.clone(),
            "SELECT generate_series(1, 100) AS num".to_string(),
            Some(10),
        )
        .await
        .expect("Query should succeed");
        
        assert_eq!(results.len(), 10, "Should return exactly 10 rows with limit 10");
        
        // Test with default limit (5000)
        let results = postgres_query(
            pool.clone(),
            "SELECT generate_series(1, 6000) AS num".to_string(),
            None,
        )
        .await
        .expect("Query should succeed");
        
        assert_eq!(results.len(), 5000, "Should return exactly 5000 rows with default limit");
        
        // Test with limit greater than default
        let results = postgres_query(
            pool,
            "SELECT generate_series(1, 6000) AS num".to_string(),
            Some(6000),
        )
        .await
        .expect("Query should succeed");
        
        assert_eq!(results.len(), 6000, "Should return exactly 6000 rows with limit 6000");
    }
    
    // Test that mysql_query properly applies the limit at the database level
    #[tokio::test]
    async fn test_mysql_query_with_limit() {
        use crate::data_source_query_routes::mysql_query::mysql_query;
        use sqlx::mysql::MySqlPoolOptions;
        
        // Skip test if no test database is available
        let database_url = match env::var("TEST_MYSQL_URL") {
            Ok(url) => url,
            Err(_) => return, // Skip test if env var not available
        };
        
        // Create a pool with the test database
        let pool = MySqlPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .expect("Failed to connect to MySQL");
            
        // Test with explicit limit
        let results = mysql_query(
            pool.clone(),
            "SELECT * FROM (SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) AS t".to_string(),
            Some(5),
        )
        .await
        .expect("Query should succeed");
        
        assert_eq!(results.len(), 5, "Should return exactly 5 rows with limit 5");
    }
    
    // Test parsing functions in the bigquery connector
    #[test]
    fn test_bigquery_string_parsing() {
        use crate::data_source_query_routes::bigquery_query;
        
        // Test integer parsing
        match bigquery_query::parse_string_to_datatype("123") {
            DataType::Int4(Some(123)) => {}, // Success
            other => panic!("Expected Int4(123), got {:?}", other),
        }
        
        // Test boolean parsing
        match bigquery_query::parse_string_to_datatype("true") {
            DataType::Bool(Some(true)) => {}, // Success
            other => panic!("Expected Bool(true), got {:?}", other),
        }
        
        // Test date parsing
        match bigquery_query::parse_string_to_datatype("2023-01-01") {
            DataType::Date(Some(_)) => {}, // Success
            other => panic!("Expected Date, got {:?}", other),
        }
        
        // Test text fallback
        match bigquery_query::parse_string_to_datatype("hello world") {
            DataType::Text(Some(text)) if text == "hello world" => {}, // Success
            other => panic!("Expected Text(hello world), got {:?}", other),
        }
    }
}

async fn route_to_query(
    data_source_id: &Uuid,
    sql: &str,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<String, DataType>>> {
    let credentials_string = match read_secret(data_source_id).await {
        Ok(credentials) => credentials,
        Err(e) => return Err(anyhow!(e)),
    };

    let credentials: Credential = match serde_json::from_str(&credentials_string) {
        Ok(credentials) => credentials,
        Err(e) => return Err(anyhow!(e)),
    };

    let results = match credentials {
        Credential::Postgres(credentials) => {
            let (pg_pool, ssh_tunnel, temp_files) = match get_postgres_connection(&credentials)
                .await
            {
                Ok(pg_pool) => pg_pool,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match postgres_query(pg_pool, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    return Err(anyhow!(e));
                }
            };

            if let (Some(mut ssh_tunnel), Some(temp_files)) = (ssh_tunnel, temp_files) {
                let _ = kill_ssh_tunnel(&mut ssh_tunnel, temp_files).await;
            };

            results
        }
        Credential::Redshift(credentials) => {
            let redshift_client = get_redshift_connection(&credentials).await?;

            

            match redshift_query(redshift_client, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            }
        }
        Credential::MySql(credentials) => {
            let (mysql_pool, ssh_tunnel, temp_files) = match get_mysql_connection(&credentials)
                .await
            {
                Ok(mysql_pool) => mysql_pool,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match mysql_query(mysql_pool, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            if let (Some(mut ssh_tunnel), Some(temp_files)) = (ssh_tunnel, temp_files) {
                let _ = kill_ssh_tunnel(&mut ssh_tunnel, temp_files).await;
            };

            results
        }
        Credential::Bigquery(credentials) => {
            let (bq_client, project_id) = match get_bigquery_client(&credentials).await {
                Ok((bq_client, project_id)) => (bq_client, project_id),
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            

            match bigquery_query(bq_client, project_id, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            }
        }
        Credential::SqlServer(credentials) => {
            let (sql_server_pool, ssh_tunnel, temp_files) = match get_sql_server_connection(
                &credentials,
            )
            .await
            {
                Ok(sql_server_pool) => sql_server_pool,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match sql_server_query(sql_server_pool, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            if let (Some(mut ssh_tunnel), Some(temp_files)) = (ssh_tunnel, temp_files) {
                let _ = kill_ssh_tunnel(&mut ssh_tunnel, temp_files).await;
            };

            results
        }
        Credential::Databricks(credentials) => {
            let databricks_client = match get_databricks_client(&credentials).await {
                Ok(databricks_client) => databricks_client,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            

            match databricks_query(databricks_client, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            }
        }
        Credential::Snowflake(credentials) => {
            let snowflake_client = match get_snowflake_client(&credentials).await {
                Ok(snowflake_client) => snowflake_client,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            

            match snowflake_query(snowflake_client, sql.to_owned()).await {
                Ok(processing_result) => {
                    match processing_result {
                        ProcessingResult::Processed(results) => results,
                        ProcessingResult::RawJson(json_string) => {
                            tracing::warn!("Snowflake query returned raw JSON due to processing error: {}", json_string);
                            // Return empty results for now - could be enhanced to parse JSON into DataType::Json
                            Vec::new()
                        }
                    }
                },
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            }
        }
    };

    Ok(results)
}
