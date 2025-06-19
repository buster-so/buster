---
title: API Column Type Inference
author: Gemini Assistant
date: 2024-07-26
status: Draft
parent_prd: semantic_layer_refactor_overview.md
ticket: N/A
---

# API Column Type Inference

## Parent Project

This is a sub-PRD of the [Semantic Layer and Deployment Refactor](semantic_layer_refactor_overview.md) project. Please refer to the parent PRD for the overall project context, goals, and implementation plan.

## Problem Statement

When semantic models are deployed, the `type_` for dimensions and measures might not always be explicitly specified in the YAML definition. In such cases, the API needs a robust mechanism to infer these types by querying the actual data source. This ensures that the `DatasetColumn` entries in the database have accurate type information, which is crucial for query generation, UI display, and other downstream processes.

Current behavior:
-   The `DatasetColumn.type_` field is populated from `DeployDatasetsColumnsRequest.type_`.
-   If this is `None` or missing, the column type in the database might be inaccurate or default to a generic type like "text", as seen in `deploy_datasets.rs`: `type_: col_req.type_.clone().unwrap_or_else(|| "text".to_string())`.
-   There isn't a standardized, dynamic type inference process by querying the data source schema information.

Expected behavior:
-   Within the `deploy_datasets_handler` (after a `SemanticModel` is mapped to `Dataset` and its `DatasetColumn` shells), if a `DatasetColumn.type_` is missing, unknown, or explicitly marked for inference (e.g., `"UNKNOWN"` or `None`):
    -   The API will use the model's `data_source_name`, `database` (identifier), and `schema`, along with the model's `name` (as table/view name) and the dimension/measure's `name` (as column name) or `expr` to query the data source's information schema (or equivalent metadata endpoint).
    -   The actual data type (e.g., `VARCHAR`, `INTEGER`, `TIMESTAMP`, `BOOLEAN`) will be retrieved from the data source.
    -   This retrieved data source specific type will be mapped to a standardized Buster type (if such a mapping exists/is needed) or stored directly.
    -   The `DatasetColumn.type_` field will be populated with this inferred type before being persisted.
-   If type inference fails (e.g., column not found in the source, data source connection error), the deployment of that specific column/model should fail with a clear error message, or a warning should be logged and a default type used, depending on desired strictness.

## Goals

1.  Implement a type inference service/module that can connect to a data source (given its ID or connection details) and query its information schema.
2.  Integrate this service into `deploy_datasets_handler` to infer types for `DatasetColumn` entries where the type is not provided or is marked as unknown.
3.  Successfully query common data sources (e.g., PostgreSQL, Snowflake, BigQuery - to the extent connection logic exists) for column type information.
4.  Map data source-specific types to a set of standardized types used within Buster (if applicable) or store the native type.
5.  Handle errors gracefully during the type inference process (e.g., connection issues, column not found, unsupported data source for inference).

## Non-Goals

1.  Implementing new data source connectors if they don't already exist. The inference will rely on existing connectivity.
2.  Inferring complex semantic types (e.g., "latitude", "currency_code") – this PRD focuses on fundamental data types (string, number, date, boolean, etc.).
3.  Type inference for deeply nested or highly complex `expr` fields if they don't directly map to a source column. Initial focus on direct column lookups or simple expressions that can be introspected.

## Implementation Plan

### Phase 1: Design and Implement Type Inference Service

#### Technical Design

**1. `TypeInferenceService` (Conceptual):**
   - This could be a new module/struct, e.g., `crate::services::type_inference`.
   - It will need access to database connection capabilities, potentially reusing parts of the existing `DataSource` handling or `query_runner` logic if suitable.

```rust
// Conceptual structure for the service
// In, e.g., api/server/src/services/type_inference.rs

pub mod type_inference_service {
    use crate::database::models::DataSource;
    use anyhow::Result;
    use sqlx::any::AnyPool; // Or specific pool types
    // May need access to a shared connection pool manager or a way to create connections.

    // Simplified function signature for illustration
    pub async fn infer_column_type(
        data_source: &DataSource, // Contains connection details or type
        database_name: &str, // The actual database/catalog name
        schema_name: &str,
        table_name: &str,  // This would be semantic_model.name
        column_name: &str, // This would be dimension.name or measure.name (if simple)
                           // OR column_expr: &str, // If type is inferred from an expression
    ) -> Result<Option<String>> { // Returns inferred type string or None if not found/error
        
        // 1. Get a database connection based on data_source.type (Postgres, Snowflake, etc.)
        //    This is a major dependency: how to get a live connection to the source DB.
        //    If we already have a query execution engine for data sources, leverage that.
        //    For example, using the query_runner logic:
        //    let mut runner = crate::query_runner::get_runner(&data_source).await?;

        // 2. Construct the appropriate information schema query based on data_source.type
        let info_schema_query: String;
        match data_source.type_.as_str() { // Assuming DataSource struct has a type_ field like "POSTGRES", "SNOWFLAKE"
            "POSTGRES" => {
                info_schema_query = format!(
                    "SELECT data_type FROM information_schema.columns \
                     WHERE table_catalog = $1 AND table_schema = $2 AND table_name = $3 AND column_name = $4",
                );
                // Execute query with runner.run_query_with_params(info_schema_query, vec![database_name, schema_name, table_name, column_name])
                // Parse result (e.g., using sqlx)
                // let row: Option<(String,)> = sqlx::query_as(&info_schema_query)
                //     .bind(database_name)
                //     .bind(schema_name)
                //     .bind(table_name)
                //     .bind(column_name)
                //     .fetch_optional(get_source_db_pool_for_ds(data_source)?).await?;
                // return Ok(row.map(|r| r.0));
            }
            "SNOWFLAKE" => {
                // Similar query for Snowflake information_schema
                // May need to handle case sensitivity for Snowflake identifiers
                info_schema_query = format!(
                    "SELECT DATA_TYPE FROM \"{}.INFORMATION_SCHEMA\".COLUMNS \
                     WHERE TABLE_SCHEMA = '{}' AND TABLE_NAME = '{}' AND COLUMN_NAME = '{}'",
                    database_name.to_uppercase(), // Snowflake often uses uppercase
                    schema_name.to_uppercase(),
                    table_name.to_uppercase(),
                    column_name.to_uppercase()
                );
                // Execute query...
            }
            // Add cases for other supported database types (BigQuery, etc.)
            _ => return Err(anyhow::anyhow!("Type inference not supported for data source type: {}", data_source.type_)),
        }

        // Placeholder for actual query execution and result parsing
        // This part needs robust implementation based on how queries are run against customer data sources.
        // For now, simulate a successful lookup for "text" type
        // if column_name == "some_known_column_with_type" {
        //     return Ok(Some("VARCHAR".to_string())); 
        // }
        
        // Simulate not found
        // Ok(None)
        Err(anyhow::anyhow!("Actual type inference query execution not yet implemented."))
    }
}
```
*Self-correction: The `DataSource` model in `api/database/models.rs` might not directly store full connection strings for security. It might store a reference or type, and the actual connection mechanism might be more complex, possibly involving a secrets manager or specific connection pool logic. The `infer_column_type` function needs to be designed to work with whatever mechanism is in place for running queries against the user's data source.* The `database_identifier` from the `SemanticModel` is the `database_name` to use here.

**2. Integration into `deploy_datasets_handler`:**

```rust
// In api/server/src/routes/rest/routes/datasets/deploy_datasets.rs
// ... inside deploy_datasets_handler, when processing columns ...

// For a dimension:
let mut final_dim_type = dim.type_.clone();
if final_dim_type.is_none() || final_dim_type.as_deref() == Some("UNKNOWN") {
    match type_inference_service::infer_column_type(
        &data_source, // The fetched DataSource object for the current model group
        semantic_model.database.as_deref().unwrap_or_default(), // From SemanticModel
        semantic_model.schema.as_deref().unwrap_or_default(),   // From SemanticModel
        &semantic_model.name, // Table/view name
        &dim.name           // Column name
    ).await {
        Ok(Some(inferred_type)) => {
            final_dim_type = Some(inferred_type);
            // Log success
        }
        Ok(None) => {
            // Column not found or type not determinable, add error to validation_result
            // validation_result.add_error(... "Type for column '{}' could not be inferred.", dim.name ...);
            final_dim_type = Some("ERROR_INFERRING_TYPE".to_string()); // Or handle as critical error
        }
        Err(e) => {
            // Error during inference process, add error to validation_result
            // validation_result.add_error(... "Error inferring type for column '{}': {}", dim.name, e ...);
            final_dim_type = Some("ERROR_INFERRING_TYPE".to_string()); // Or handle as critical error
        }
    }
}
// Use final_dim_type.unwrap_or_else(|| "default_type".to_string()) for DatasetColumn.type_

// Similar logic for measures if their type_ also needs inference.
```

#### Implementation Steps
1.  [ ] Design the detailed interface for `type_inference_service::infer_column_type`, including how it gets database connections or uses existing query execution capabilities.
    -   Clarify how `DataSource` information (type, connection details/secrets) is accessed and used securely to establish a connection to the user's data source.
2.  [ ] Implement the information schema query logic for primary supported data source types (e.g., PostgreSQL, Snowflake).
3.  [ ] Integrate the call to `infer_column_type` within `deploy_datasets_handler` for dimensions and measures where `type_` is `None` or indicates a need for inference.
4.  [ ] Implement error handling: if inference fails, decide whether to halt deployment for that model/column or log a warning and use a default type. Update `ValidationResult` accordingly.
5.  [ ] (Optional) Implement a simple mapping from source-specific types to a standardized set of Buster internal types if required (e.g., "character varying" -> "string"). For now, storing the native type might be sufficient.

#### Tests
-   **Unit Tests for `type_inference_service` (will require mocking DB interactions or a test DB):**
    -   Test for PostgreSQL: given schema/table/column, returns correct type.
    -   Test for Snowflake: given schema/table/column, returns correct type.
    -   Test for column not found (should return `Ok(None)`).
    -   Test for DB connection error (should return `Err(...)`).
-   **Integration Tests for `deploy_datasets_handler`:**
    -   Deploy a model with a dimension missing `type_`.
    -   Verify that the API attempts to connect to the source, infers the type, and stores it in `DatasetColumn`.
    -   Test with a data source where inference is not supported (should fail gracefully or use default).
    -   Test with a column that doesn't exist in the source table (should result in a validation error for that model).

#### Success Criteria
- [ ] Type inference service can successfully query information schemas of supported data sources.
- [ ] `deploy_datasets_handler` correctly calls the inference service for columns with missing types.
- [ ] Inferred types are correctly populated into `DatasetColumn` records before saving.
- [ ] Errors during inference are handled appropriately, and `ValidationResult` reflects the outcome.
- [ ] All tests pass.

## Dependencies on Other Components

-   **`prd_api_request_handling.md`**: Assumes the API is already processing `SemanticModel` objects.
-   **Core Database Connectivity**: Relies heavily on the application's existing ability to securely connect to and query various user data sources. The specifics of this interaction need to be clearly defined based on existing infrastructure (`query_runner`, connection pooling, secret management).

## Security Considerations

-   **Secure Connection to Data Sources**: This is paramount. The mechanism for obtaining credentials and connecting to external data sources must be secure, using appropriate secret management and connection pooling practices.
-   **Query Injection in Information Schema Queries**: While information schema queries are typically against metadata, the table, schema, and column names used in these queries (derived from user input/model definition) should be handled carefully. Parameterized queries are essential. Using an ORM or query builder that handles escaping is preferred.
-   **Resource Consumption**: Queries to external data sources, even metadata queries, consume resources. Ensure these are efficient and don't cause undue load. Timeouts might be necessary.

## References

-   Information schema documentation for target databases (PostgreSQL, Snowflake, etc.).
-   Existing data source connection and query execution logic within the Buster codebase.

</rewritten_file> 