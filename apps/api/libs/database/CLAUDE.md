# Database Library - Agent Guidance

## Purpose & Role

The Database library serves as the core data layer for the Buster API, providing models, connection pooling, schema definitions, and database utilities. It acts as the foundation for data persistence and retrieval throughout the application.

## Key Functionality

- Database connection pooling and management
- Data models and schema definitions
- Enum definitions for database-backed types
- Helper functions for common database operations
- Secure credential storage via the vault module
- Structured types for complex data representations

## Internal Organization

### Directory Structure

```
src/
  ├── enums.rs - Database-backed enum definitions
  ├── helpers/
  │   ├── collections.rs - Collection-related helpers
  │   ├── dashboard_files.rs - Dashboard file operations
  │   ├── metric_files.rs - Metric file operations
  │   └── mod.rs
  ├── lib.rs - Public exports
  ├── models.rs - Database models and table definitions
  ├── pool.rs - Database connection pooling
  ├── schema.rs - Database schema definitions
  ├── types/
  │   ├── dashboard_yml.rs - Dashboard YAML structure
  │   ├── metric_yml.rs - Metric YAML structure
  │   ├── mod.rs
  │   └── version_history.rs - Version tracking types
  └── vault.rs - Secure credential storage
```

### Key Modules

- `models`: Contains the database model definitions that map to tables
- `pool`: Manages database connections and connection pooling
- `schema`: Defines the database schema structure
- `enums`: Defines enum types used across the database
- `vault`: Provides secure storage and retrieval of sensitive credentials
- `helpers`: Contains utility functions for common database operations
- `types`: Defines structured types for complex data

## Usage Patterns

```rust
use database::{pool::DbPool, models::User};
use diesel::prelude::*;

async fn example_query(pool: &DbPool) -> Result<Vec<User>, anyhow::Error> {
    use database::schema::users::dsl::*;
    
    // Get a connection from the pool
    let mut conn = pool.get().await?;
    
    // Execute a query
    let results = users
        .filter(active.eq(true))
        .limit(10)
        .load::<User>(&mut conn)
        .await?;
        
    Ok(results)
}
```

### Common Implementation Patterns

- Always use the connection pool for database operations
- Leverage Diesel's query builder for type-safe queries
- Use the defined models and schema for table operations
- Keep database operations isolated in repository-pattern functions
- Use transactions for operations that modify multiple tables
- Properly handle database errors and connection issues

## Dependencies

- **Internal Dependencies**:
  - None - this is a foundational library that other libraries depend on

- **External Dependencies**:
  - `diesel`: ORM for database operations
  - `diesel-async`: Async support for Diesel
  - `tokio-postgres`: PostgreSQL driver
  - `bb8-redis`: Redis connection pooling
  - `serde`: Serialization and deserialization
  - `chrono`: Date and time handling
  - `uuid`: UUID generation and handling

## Code Navigation Tips

- Start with `models.rs` to understand the database tables and their relationships
- `schema.rs` defines the database schema and is generated from migrations
- `pool.rs` contains the connection pool setup and management
- Helper functions in the `helpers/` directory provide common database operations
- When working with sensitive data, check the `vault.rs` module
- Type definitions in the `types/` directory provide structure for complex data

## Testing Guidelines

- Use an in-memory or test database for unit tests
- Create test fixtures for common database objects
- Test database operations in isolation
- Mock the database for non-database focused tests
- Ensure proper cleanup of test data
- Run tests with: `cargo test -p database`
- Use transactions to roll back changes in tests