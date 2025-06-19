---
title: API Request Handling for Model Deployment
author: Gemini Assistant
date: 2024-07-26
status: Draft
parent_prd: semantic_layer_refactor_overview.md
ticket: N/A
---

# API Request Handling for Model Deployment

## Parent Project

This is a sub-PRD of the [Semantic Layer and Deployment Refactor](semantic_layer_refactor_overview.md) project. Please refer to the parent PRD for the overall project context, goals, and implementation plan.

## Problem Statement

The current `/deploy_datasets` API endpoint in `api/server/src/routes/rest/routes/datasets/deploy_datasets.rs` expects a request body (`Vec<DeployDatasetsRequest>`) that is structured differently from the new unified `semantic_layer::Model`. To align with the new approach, this endpoint needs to be updated to accept a payload consisting of `Vec<semantic_layer::Model>`.

Current behavior:
-   The API endpoint `/deploy_datasets` takes `Json(Vec<DeployDatasetsRequest>)`.
-   `DeployDatasetsRequest` has fields like `data_source_name`, `env`, `type_`, `name`, `model` (SQL model name), `schema`, `database`, `description`, `sql_definition`, `entity_relationships`, `columns`, `yml_file`.
-   This structure requires the CLI to transform its parsed YAML (currently CLI-specific structs) into this `DeployDatasetsRequest` format.

Expected behavior:
-   The API endpoint `/deploy_datasets` will be updated to accept `Json(Vec<semantic_layer::Model>)` (or a new wrapper struct if necessary, e.g., `BatchDeploySemanticModelsRequest { models: Vec<semantic_layer::Model>, global_env: Option<String> }`, but directly using `Vec<semantic_layer::Model>` is preferred if `env` can be handled or is implicit).
-   The `semantic_layer::Model` (defined in `api/libs/semantic_layer/src/models.rs`) will be the primary data structure received.
-   The existing logic within `handle_deploy_datasets` and `deploy_datasets_handler` will need to be refactored to work with these new input structs instead of the old `DeployDatasetsRequest`.
-   Information like `data_source_name`, `schema`, and `database` will now primarily come from the fields within each `semantic_layer::Model` instance (which were resolved by the CLI).
-   The `env` field, previously on `DeployDatasetsRequest`, needs consideration. If it's a global setting for the batch, it might need to be passed differently or inferred. For now, assume `env` might be associated with the `DataSource` in the database and resolved there, or becomes part of the `semantic_layer::Model` if it can vary per model in a batch.
    - *Decision: The `env` is typically tied to a `DataSource` entry in the DB. The API should look up the `DataSource` using `name` (from `model.data_source_name`) and an `env` (e.g., hardcoded to "dev" or configurable). For simplicity, we can assume a default `env` like "dev" when looking up the data source if not provided explicitly with the model.* The `data_source_name` on the `semantic_layer::Model` will be the key.

## Goals

1.  Update the signature of the `deploy_datasets` Axum handler function to accept `Json(Vec<semantic_layer::Model>)` or an equivalent new request struct.
2.  Refactor the internal logic of `handle_deploy_datasets` and `deploy_datasets_handler` to process `semantic_layer::Model` objects.
3.  Map fields from `semantic_layer::Model` (and its nested structs like `Dimension`, `Measure`, `Relationship`) to the corresponding database entities (`Dataset`, `DatasetColumn`).
4.  Ensure existing functionalities like data source lookup, organization ID handling, and user permissions checks are maintained.
5.  Decide on and implement handling for the `env` parameter.

## Non-Goals

1.  Implementing the type inference logic (covered in `prd_api_type_inference.md`).
2.  Implementing the detailed persistence logic for all new semantic model parts like metrics and filters (covered in `prd_api_model_persistence.md`). This PRD focuses on adapting to the new request shape for existing core entities (datasets, columns).
3.  Changing the response structure (`DeployDatasetsResponse`) significantly, though the source of its data will change.

## Implementation Plan

### Phase 1: Adapt API Endpoint and Core Logic

#### Technical Design

**1. Update Request Struct and Handler Signature:**
   - The main entry point `deploy_datasets` in `deploy_datasets.rs` will change its `Json` extractor.

```rust
// In api/server/src/routes/rest/routes/datasets/deploy_datasets.rs

// ... other imports ...
use semantic_layer::models::Model as SemanticModel; // Alias for clarity

// Current request structs (DeployDatasetsRequest, DeployDatasetsColumnsRequest, etc.) will be REMOVED or deprecated.

// Updated Axum handler function signature
pub async fn deploy_datasets(
    Extension(user): Extension<AuthenticatedUser>,
    Json(requests): Json<Vec<SemanticModel>>, // <<<<< CHANGED HERE
) -> Result<ApiResponse<DeployDatasetsResponse>, (StatusCode, String)> {
    // ... organization_id and permission checks remain similar ...

    // Call handler function, passing Vec<SemanticModel>
    match handle_deploy_datasets(&user.id, requests).await { // <<<<< CHANGED HERE
        Ok(result) => Ok(ApiResponse::JsonData(result)),
        Err(e) => {
            tracing::error!("Error in deploy_datasets: {:?}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

async fn handle_deploy_datasets(
    user_id: &Uuid,
    models: Vec<SemanticModel>, // <<<<< CHANGED HERE
) -> Result<DeployDatasetsResponse> {
    // The logic to produce DeployDatasetsResponse might need adjustment
    // based on how ValidationResult is now generated.
    let results = deploy_datasets_handler(user_id, models, false).await?;
    // ... existing summary logic ...
    // Ok(DeployDatasetsResponse { results, summary })
}

// This is the core function to refactor
async fn deploy_datasets_handler(
    user_id: &Uuid,
    models: Vec<SemanticModel>, // <<<<< CHANGED HERE
    _is_simple: bool, // This parameter might be obsolete
) -> Result<Vec<ValidationResult>> { // ValidationResult might need to refer to SemanticModel fields
    let organization_id = get_user_organization_id(user_id).await?;
    let mut conn = get_pg_pool().get().await?;
    let mut results: Vec<ValidationResult> = Vec::new();

    // Grouping by (data_source_name, env, database) might change slightly.
    // data_source_name and database now come from SemanticModel.
    // `env` needs to be resolved (e.g., assume "dev" for data source lookup).
    let default_env = "dev".to_string();

    // Temporary map for models by their original data_source_name, as SemanticModel has it as Option<String>
    // but CLI should have resolved it.
    let mut models_by_resolved_ds: HashMap<String, Vec<SemanticModel>> = HashMap::new();
    for model in models {
        if let Some(ds_name) = &model.data_source_name {
             models_by_resolved_ds.entry(ds_name.clone()).or_default().push(model);
        } else {
            // This should ideally be caught by CLI validation
            let mut val_res = ValidationResult::new(model.name.clone(), "UNKNOWN_DS".to_string(), model.schema.clone().unwrap_or_default());
            val_res.add_error(ValidationError::internal_error("DataSourceName missing on model".to_string()));
            results.push(val_res);
            continue;
        }
    }

    for (data_source_name, model_group) in models_by_resolved_ds {
        // Fetch DataSource using data_source_name and default_env
        let data_source = match data_sources::table
            .filter(data_sources::name.eq(&data_source_name))
            .filter(data_sources::env.eq(&default_env))
            .filter(data_sources::organization_id.eq(&organization_id))
            // ... other filters ...
            .first::<DataSource>(&mut conn).await {
                Ok(ds) => ds,
                Err(_) => { /* ... handle error, push to results ... */ continue; }
            };

        for semantic_model in model_group { // Now iterating over SemanticModel
            // Create a ValidationResult instance
            let mut validation_result = ValidationResult::new(
                semantic_model.name.clone(),
                data_source_name.clone(), // Use the resolved one
                semantic_model.schema.as_ref().cloned().unwrap_or_default(),
            );

            // --- Map SemanticModel to Dataset --- 
            let dataset_id = Uuid::new_v4(); // Or fetch existing by semantic_model.name and data_source.id
            let now = Utc::now();
            let db_dataset = crate::database::models::Dataset {
                id: dataset_id, 
                name: semantic_model.name.clone(),
                data_source_id: data_source.id,
                database_name: semantic_model.name.clone(), // Assuming model name is table/view name
                when_to_use: semantic_model.description.clone(),
                type_: DatasetType::View, // Default, or determine from SemanticModel if it has such a field
                // definition: semantic_model.sql_definition.clone(), // semantic_model doesn't have sql_definition directly. Where does this come from?
                                                              // Perhaps from model.model field if that's a convention for SQL block?
                                                              // For now, leave it empty or decide source.
                definition: String::new(), // Placeholder
                schema: semantic_model.schema.as_ref().cloned().unwrap_or_else(|| {
                    validation_result.add_error(ValidationError::internal_error("Schema missing".to_string()));
                    String::new() // Default, though error is added
                }),
                database_identifier: semantic_model.database.clone(), // This is Option<String>
                yml_file: None, // CLI used to send this, API doesn't strictly need it if model def is complete
                // ... other fields like created_at, updated_at, user_id, organization_id ...
            };
            // Add db_dataset to a list for bulk upsert

            // --- Map SemanticModel.dimensions and SemanticModel.measures to DatasetColumn --- 
            let mut dataset_columns_to_upsert = Vec::new();
            for dim in &semantic_model.dimensions {
                dataset_columns_to_upsert.push(crate::database::models::DatasetColumn {
                    id: Uuid::new_v4(),
                    dataset_id: dataset_id, // Link to above dataset
                    name: dim.name.clone(),
                    type_: dim.type_.clone().unwrap_or_else(|| "UNKNOWN".to_string()), // Type inference later if UNKNOWN
                    description: dim.description.clone(),
                    semantic_type: Some("dimension".to_string()),
                    dim_type: dim.type_.clone(), // Or specific mapping
                    // expr: dim.expr.clone(), // If Dimension has expr and DatasetColumn supports it
                    // ... other fields ...
                });
            }
            for measure in &semantic_model.measures {
                 dataset_columns_to_upsert.push(crate::database::models::DatasetColumn {
                    id: Uuid::new_v4(),
                    dataset_id: dataset_id,
                    name: measure.name.clone(),
                    type_: measure.type_.clone().unwrap_or_else(|| "UNKNOWN".to_string()),
                    description: measure.description.clone(),
                    semantic_type: Some("measure".to_string()),
                    // agg: measure.agg.clone(), // If Measure has agg and DatasetColumn supports it
                    // expr: measure.expr.clone(), // If Measure has expr and DatasetColumn supports it
                    // ... other fields ...
                });
            }
            // Add dataset_columns_to_upsert to a list for bulk upsert, associated with dataset_id

            // --- Placeholder for Relationships, Metrics, Filters --- 
            // semantic_model.relationships, semantic_model.metrics, semantic_model.filters
            // will be handled in prd_api_model_persistence.md

            // After DB operations (mocked for now or simplified upsert):
            // validation_result.success = true; (if all good)
            results.push(validation_result);
        }
        // Perform bulk upserts for datasets and columns for this data_source group here
    }

    Ok(results)
}
```
*Self-correction: The `sql_definition` was part of the old `DeployDatasetsRequest`. The `semantic_layer::Model` doesn't have a direct `sql_definition` field. If the underlying SQL for a model/view is still needed at this stage, we need to clarify where it comes from. If the `semantic_layer::Model` is purely semantic, the API might not need the full SQL, or it might be embedded in a specific field within `semantic_layer::Model` (e.g., a `model_source: Option<String>` field or similar). For now, `Dataset.definition` is set to empty.* The `Model.model` field in the old CLI structure was sometimes used for this. We should clarify if a field like `semantic_layer::Model.source_query: Option<String>` is needed.

**2. `ValidationResult` and `ValidationError`:**
   - These structs in `deploy_datasets.rs` will likely remain but will be populated based on validating `SemanticModel` objects.
   - `ValidationResult` references `model_name`, `data_source_name`, `schema`. These are available from `SemanticModel`.

#### Implementation Steps
1.  [ ] Modify the `deploy_datasets` Axum handler to accept `Json(Vec<semantic_layer::Model>)`.
2.  Update `handle_deploy_datasets` and `deploy_datasets_handler` to take `Vec<semantic_layer::Model>` as input.
3.  Refactor the grouping logic in `deploy_datasets_handler`:
    a.  Models should be grouped by their `data_source_name` (present on `semantic_layer::Model`).
    b.  Determine how `env` is handled for `DataSource` lookup (e.g., use a default like "dev").
4.  Inside the loop for each `SemanticModel`:
    a.  Adapt the creation of `ValidationResult` using fields from `SemanticModel`.
    b.  Map `SemanticModel` fields (name, description, schema, database) to `crate::database::models::Dataset`.
        - Clarify the source for `Dataset.definition` (SQL query).
    c.  Map `SemanticModel.dimensions` to `crate::database::models::DatasetColumn` (setting `semantic_type` to "dimension").
    d.  Map `SemanticModel.measures` to `crate::database::models::DatasetColumn` (setting `semantic_type` to "measure").
    e.  Ensure `dataset_id` linkage is correct.
5.  Adapt the existing bulk upsert logic for `Dataset` and `DatasetColumn` to use the newly mapped objects.
6.  Ensure soft-delete logic for columns not present in the new request still functions correctly based on the incoming columns for a dataset.
7.  Temporarily bypass or add placeholders for processing `relationships`, `metrics`, and `filters` from `SemanticModel` (to be fully addressed in `prd_api_model_persistence.md`).

#### Tests
-   **Unit Tests for `deploy_datasets_handler`:**
    -   Mock database interactions.
    -   Test with a valid `Vec<SemanticModel>`: ensure `Dataset` and `DatasetColumn` objects are correctly formed.
    -   Test with models having missing `data_source_name` or `schema` (should result in validation errors if CLI didn't catch it, or be handled gracefully if API expects them to be resolved).
    -   Test data source lookup failure.
-   **Integration Tests (CLI calling the actual, modified API endpoint):**
    -   Full flow: CLI sends `Vec<SemanticModel>`, API receives and processes it, basic data (datasets, columns) is stored.
    -   Test with multiple models targeting the same and different data sources.

#### Success Criteria
- [ ] API endpoint `/deploy_datasets` successfully accepts `Json(Vec<semantic_layer::Model>)`.
- [ ] Core logic in `deploy_datasets_handler` correctly processes `semantic_layer::Model` objects and maps them to `Dataset` and `DatasetColumn` database models.
- [ ] Existing data source lookup, permission checks, and basic upsert operations for datasets/columns function with the new input structure.
- [ ] The `env` for data source lookup is handled correctly.
- [ ] Unit and integration tests pass.

## Dependencies on Other Components

-   **`prd_semantic_model_definition.md`**: The API must use the exact `semantic_layer::Model` struct defined there.
-   **`prd_cli_deployment_logic.md`**: The CLI must send data in the format this API endpoint now expects.

## Security Considerations

-   All incoming fields from `semantic_layer::Model` must be treated as untrusted input and validated/sanitized before database interaction, especially string fields used in queries or stored directly.
-   Permissions (`is_user_workspace_admin_or_data_admin`) must continue to be robustly checked.

## References

-   `api/server/src/routes/rest/routes/datasets/deploy_datasets.rs` (current implementation)
-   `api/libs/semantic_layer/src/models.rs` (new request DTO)
-   Axum documentation for JSON extraction.

</rewritten_file> 