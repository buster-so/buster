# SQL Analyzer Library (`sql_analyzer`)

## Purpose

The SQL Analyzer library provides functionality to parse, analyze, and manipulate SQL queries within a Rust/Tokio environment. It is designed to:

1.  **Extract Structural Information**: Identify tables, columns, joins, and Common Table Expressions (CTEs) used within a SQL query.
2.  **Trace Lineage**: Understand the relationships between tables, especially how joins connect them, including lineage through CTEs.
3.  **Semantic Layer Integration**: Validate queries against a defined semantic layer (metrics, filters, relationships) and substitute semantic elements with their underlying SQL expressions.
4.  **Row-Level Security**: Rewrite queries to enforce row-level filtering by injecting CTEs based on provided filter conditions.

## Key Features

-   **Comprehensive Parsing**: Leverages the `sqlparser` crate to handle a wide range of SQL dialects and constructs.
-   **Lineage Tracking**:
    -   Extracts base tables, including schema/database qualifiers and aliases.
    -   Identifies joins and their conditions, linking them back to the original tables involved.
    -   Recursively analyzes CTEs, mapping CTE columns back to their source tables and columns.
-   **Vague Reference Detection**: Flags potentially ambiguous references like unqualified column names or tables without schema identifiers (configurable behavior).
-   **Semantic Layer**:
    -   **Validation**: Checks if a query adheres to predefined metrics, filters, and allowed join paths (`validate_semantic_query`).
    -   **Substitution**: Replaces metric and filter placeholders in the SQL with their actual SQL expressions (`substitute_semantic_query`).
    -   **Combined**: Performs validation and substitution in one step (`validate_and_substitute_semantic_query`).
-   **Row-Level Filtering**: Automatically rewrites SQL queries to include row-level filters by wrapping table references in CTEs (`apply_row_level_filters`).
-   **Async API**: Provides non-blocking functions suitable for integration into asynchronous applications (like web servers using Tokio).

## Basic Usage

### Analyzing a Query for Structure and Lineage

```rust
use sql_analyzer::{analyze_query, QuerySummary, SqlAnalyzerError};

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let sql = """
        WITH regional_sales AS (
            SELECT region, SUM(amount) as total_sales
            FROM sales s JOIN regions r ON s.region_id = r.id
            GROUP BY region
        )
        SELECT u.name, rs.total_sales
        FROM users u
        JOIN regional_sales rs ON u.region = rs.region
        WHERE u.status = 'active';
    """.to_string();

    match analyze_query(sql).await {
        Ok(summary: QuerySummary) => {
            println!("--- Query Analysis Summary ---");
            println!("Tables: {:?}", summary.tables);
            println!("Joins: {:?}", summary.joins);
            println!("CTEs: {:?}", summary.ctes);
            // Explore summary.ctes[...].summary for CTE lineage
        },
        Err(e: SqlAnalyzerError) => {
            eprintln!("SQL Analysis Error: {}", e);
        }
    }
    Ok(())
}

```

*(See `src/lib.rs` for examples of semantic layer and row-level filtering usage)*

## Testing

The library includes a comprehensive test suite to ensure correctness and robustness:

-   **Unit Tests (`src/lib.rs`, `src/utils/semantic.rs`)**: Focus on testing specific functions and logic units, particularly around semantic layer validation and substitution rules.
-   **Integration Tests (`tests/integration_tests.rs`)**: Cover end-to-end scenarios, including:
    -   Parsing various SQL constructs (joins, CTEs, subqueries, unions).
    -   Verifying lineage tracking accuracy.
    -   Testing semantic layer features (validation, substitution, parameters).
    -   Testing row-level filter rewriting logic under different conditions (existing CTEs, subqueries, schema qualification).
    -   Handling edge cases and potential errors (invalid SQL, vague references, complex queries).
-   **Doc Tests**: Examples embedded in the documentation are tested to ensure they remain valid.

The tests cover a wide range of SQL scenarios, including complex joins, nested CTEs, various semantic layer configurations, and different row-level filtering requirements. You can run the tests using:

```bash
cargo test -p sql_analyzer -- --test-threads=1 --nocapture
``` 