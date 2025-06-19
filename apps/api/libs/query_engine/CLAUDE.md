# Query Engine Library - Agent Guidance

## Purpose & Role

The Query Engine library provides connectivity and query execution functionality for various data sources in Buster. It abstracts away the details of connecting to different database systems, allows secure credential management, and provides a unified interface for executing queries across multiple database technologies.

## Result Limitations

All database queries are capped at a maximum of 5000 rows by default to ensure performance and prevent excessive resource usage. This limit can be overridden by passing a specific limit parameter when calling the query functions.

## Key Functionality

- Data source connection management for multiple database types
- Secure credential handling and storage
- Query execution across various database systems
- Data type conversions and mapping
- Connection testing and validation
- SSH tunneling for secure remote connections

## Internal Organization

### Directory Structure

```
src/
  ├── credentials.rs - Credential management
  ├── data_source_connections/ - Database connectors
  │   ├── get_bigquery_client.rs - BigQuery connection
  │   ├── get_databricks_client.rs - Databricks connection
  │   ├── get_mysql_connection.rs - MySQL connection
  │   ├── get_postgres_connection.rs - PostgreSQL connection
  │   ├── get_redshift_connection.rs - Redshift connection
  │   ├── get_snowflake_client.rs - Snowflake connection
  │   ├── get_sql_server_connection.rs - SQL Server connection
  │   ├── ssh_tunneling.rs - SSH tunnel functionality
  │   ├── test_data_source_connections.rs - Connection testing
  │   └── mod.rs
  ├── data_source_helpers.rs - Helper functions
  ├── data_source_query_routes/ - Query executors
  │   ├── bigquery_query.rs - BigQuery execution
  │   ├── databricks_query.rs - Databricks execution
  │   ├── mysql_query.rs - MySQL execution
  │   ├── postgres_query.rs - PostgreSQL execution
  │   ├── query_engine.rs - Core query engine
  │   ├── redshift_query.rs - Redshift execution
  │   ├── security_utils.rs - Security utilities
  │   ├── snowflake_query.rs - Snowflake execution
  │   ├── sql_server_query.rs - SQL Server execution
  │   └── mod.rs
  ├── data_types.rs - Common data types
  └── lib.rs - Public exports
```

### Key Modules

- `data_source_connections`: Database connection handlers for different database systems
- `data_source_query_routes`: Query execution implementations for each database system
- `credentials`: Secure credential management for database connections
- `data_types`: Common data type definitions and conversions
- `data_source_helpers`: Utility functions for data sources

## Usage Patterns

```rust
use query_engine::data_source_query_routes::query_engine::query_engine;
use query_engine::data_types::DataType;
use uuid::Uuid;
use indexmap::IndexMap;

async fn example_query(data_source_id: &Uuid, sql: &str) -> Result<Vec<IndexMap<String, DataType>>, anyhow::Error> {
    // Execute a query against a data source using the default 5000-row limit
    let result = query_engine(data_source_id, sql, None).await?;
    
    // Or specify a custom limit
    let custom_limit = Some(1000);
    let limited_result = query_engine(data_source_id, sql, custom_limit).await?;
    
    Ok(result)
}
```

### Common Implementation Patterns

- Use the appropriate connection function for each database type
- Handle connection pooling and reuse when possible
- Secure credentials through the credentials module
- Use SSH tunneling for remote databases that require it
- Handle database-specific query syntax differences
- Convert results to a common format for the API
- Implement proper error handling for connection and query failures

## Dependencies

- **Internal Dependencies**:
  - `database`: For storing and retrieving data source configurations

- **External Dependencies**:
  - Database-specific clients: `sqlx`, `gcp-bigquery-client`, `snowflake-api`, `tiberius`
  - `tokio`: For async runtime
  - `anyhow`: For error handling
  - `serde` and `serde_json`: For serialization
  - `uuid`: For unique identifiers
  - `arrow`: For columnar data processing

## Code Navigation Tips

- Start with `lib.rs` to see what's exported
- The central component is the `execute_query` function in `data_source_query_routes/query_engine.rs`
- Connection functions in `data_source_connections/` follow a naming pattern of `get_<database>_connection`
- Query execution in `data_source_query_routes/` follows a similar pattern
- Database-specific code is isolated in dedicated modules
- Common data types are defined in `data_types.rs`

## Testing Guidelines

- Use mock connections for unit testing
- Test each database connector separately
- Verify proper error handling for connection failures
- Test query execution with various input types
- Test data type conversions for each database system
- Run tests with: `cargo test -p query_engine`
- Use test fixtures for database configurations