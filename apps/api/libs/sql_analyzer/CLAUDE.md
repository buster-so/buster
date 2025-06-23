# SQL Analyzer Library

## Purpose
The SQL Analyzer library provides functionality to parse and analyze SQL queries, extracting tables, columns, joins, and CTEs with lineage tracing. It's designed for integration with a Tokio-based web server.

## Key Features
- Extracts tables with database/schema identifiers and aliases
- Links columns to their tables, deduplicating per table
- Identifies joins with lineage to base tables
- Recursively analyzes CTEs, tracking their lineage
- Flags vague references (unqualified columns or tables without schema)
- Provides non-blocking parsing for web server compatibility

## Internal Organization

### Module Structure
- **lib.rs**: Main entry point and public API
- **types.rs**: Data structures for tables, joins, CTEs, and query summaries
- **errors.rs**: Custom error types for SQL analysis
- **utils/mod.rs**: Core analysis logic using sqlparser

### Key Components
- **QuerySummary**: The main output structure containing tables, joins, and CTEs
- **TableInfo**: Information about tables including identifiers and columns
- **JoinInfo**: Describes joins between tables with conditions
- **CteSummary**: Contains a CTE's query summary and column mappings
- **SqlAnalyzerError**: Custom errors for parsing issues and vague references
- **QueryAnalyzer**: The worker class that implements the Visitor pattern

## Usage Patterns

### Basic Usage
```rust
use sql_analyzer::analyze_query;

let sql = "SELECT u.id FROM schema.users u JOIN schema.orders o ON u.id = o.user_id";
match analyze_query(sql.to_string()).await {
    Ok(summary) => {
        println!("Tables: {:?}", summary.tables);
        println!("Joins: {:?}", summary.joins);
    },
    Err(e) => eprintln!("Error: {}", e),
}
```

### Working with CTEs
```rust
let sql = "WITH users_cte AS (SELECT id FROM schema.users) 
           SELECT o.* FROM schema.orders o JOIN users_cte ON o.user_id = users_cte.id";
let summary = analyze_query(sql.to_string()).await?;

// Access the CTE information
for cte in &summary.ctes {
    println!("CTE: {}", cte.name);
    println!("CTE base tables: {:?}", cte.summary.tables);
    println!("Column mappings: {:?}", cte.column_mappings);
}
```

## Dependencies
- **sqlparser**: SQL parsing functionality
- **tokio**: Async runtime and blocking task management
- **anyhow**: Error handling
- **serde**: Serialization for query summary structures
- **thiserror**: Custom error definitions

## Testing
- Test cases should cover various SQL constructs
- Ensure tests for error cases (vague references)
- Test CTE lineage tracing and complex join scenarios

## Code Navigation Tips
- Start in lib.rs for the public API
- The core analysis logic is in utils/mod.rs
- The QueryAnalyzer struct implements the sqlparser Visitor trait
- The parsing of object names and column references is key to understanding the lineage tracking

## Common Pitfalls
- Vague references in SQL will cause errors by design
- Complex subqueries may need special handling
- Non-standard SQL dialects might not parse correctly with the generic dialect