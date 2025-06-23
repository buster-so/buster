---
title: API Semantic Model Persistence
author: Gemini Assistant
date: 2024-07-26
status: Draft
parent_prd: semantic_layer_refactor_overview.md
ticket: N/A
---

# API Semantic Model Persistence

## Parent Project

This is a sub-PRD of the [Semantic Layer and Deployment Refactor](semantic_layer_refactor_overview.md) project. Please refer to the parent PRD for the overall project context, goals, and implementation plan.

## Problem Statement

While `prd_api_request_handling.md` covers adapting the API to accept `semantic_layer::Model` and persisting basic `Dataset` and `DatasetColumn` information, the full semantic model includes richer components: `Relationships` (Entities), `Metrics`, and `Filters` (with `Arguments`). The current database schema and persistence logic in `deploy_datasets_handler` primarily cater to datasets and columns. We need to define how these additional semantic components are stored in the database so they can be used by other services (e.g., query generation, UI display).

Current behavior:
-   The `datasets` table stores model/table-level information.
-   The `dataset_columns` table stores dimension and measure information.
-   There isn't a clear, structured way to store relationships (beyond simple foreign keys which might be implicitly part of `DatasetColumn.expr`), metrics, or filters with their arguments as defined in `semantic_layer::Model`.
-   The old `DeployDatasetsEntityRelationshipsRequest` was a flat list and its storage was not explicitly detailed for complex relationship types or attributes.

Expected behavior:
-   The API will persist all relevant information from each `semantic_layer::Model` including its `relationships`, `metrics`, and `filters`.
-   This may require new database tables (e.g., `dataset_relationships`, `dataset_metrics`, `metric_arguments`, `dataset_filters`, `filter_arguments`) or extending existing tables with JSON/JSONB columns if appropriate for less structured or variable data (though relational tables are generally preferred for queryability).
-   The persistence logic in `deploy_datasets_handler` will be extended to save these components, linking them to their parent `Dataset` (which represents the `semantic_layer::Model`).
-   Consideration for soft deletion and updates: when a model is redeployed, existing relationships, metrics, and filters associated with it should be updated or soft-deleted if they are no longer present in the new definition.

## Goals

1.  Design database schema (new tables or extensions) to store `Relationships`, `Metrics` (with `Arguments`), and `Filters` (with `Arguments`) from `semantic_layer::Model`.
2.  Implement the logic in `deploy_datasets_handler` to persist these semantic components into the designed database schema, linked to the parent `Dataset`.
3.  Implement update/soft-delete logic for these components when a model is redeployed.
4.  Ensure that this persisted information can be easily queried and reconstructed (e.g., to rebuild a `semantic_layer::Model` or for use by other services).

## Non-Goals

1.  Designing services that consume this persisted semantic information (e.g., query generation engine). This PRD focuses solely on storage and retrieval for persistence.
2.  Complex UI for managing these persisted components.
3.  Large-scale migration of any existing, differently structured relationship/metric data (if any exists). Focus is on new deployments.

## Implementation Plan

### Phase 1: Database Schema Design and Persistence Logic

#### Technical Design

**1. Database Schema Proposals:**
   - All new tables will have foreign keys to `datasets.id` to link them to a specific deployed model.
   - Timestamps (`created_at`, `updated_at`, `deleted_at` for soft deletes) and `created_by`/`updated_by` should be standard.

   **a. `dataset_relationships` table:**
      - `id: uuid (primary key)`
      - `dataset_id: uuid (fk to datasets.id)`
      - `name: String` (Name of the related model/entity, from `Relationship.name`)
      - `description: Option<String>` (from `Relationship.description`)
      - `relationship_type: Option<String>` (e.g., "LEFT", "INNER", from `Relationship.type_`)
      - `cardinality: Option<String>` (e.g., "one-to-one", "one-to-many", from `Relationship.cardinality`)
      - `current_model_key: String` (from `Relationship.primary_key` - the column in the *current* dataset)
      - `related_model_key: String` (from `Relationship.foreign_key` - the column in the *related* dataset named by `name`)
      - `related_model_name_override: Option<String>` (Was `ref_` in CLI, if `name` is an alias, this points to actual target model name. For now, assume `name` is the actual target and this can be `None` or omitted initially.)
      - `join_expression: Option<String>` (If `primary_key`/`foreign_key` are not enough, this could store a complex join condition. This was `expr` in CLI Entity. For now, assume simple key joins and this can be `None`.)
      - `_created_at, _updated_at, _deleted_at, _created_by, _updated_by`

   **b. `dataset_metrics` table:**
      - `id: uuid (primary key)`
      - `dataset_id: uuid (fk to datasets.id)`
      - `name: String` (from `Metric.name`)
      - `expr: String` (from `Metric.expr`)
      - `description: Option<String>` (from `Metric.description`)
      - `_created_at, _updated_at, _deleted_at, _created_by, _updated_by`

   **c. `metric_arguments` table (if metrics can have arguments):**
      - `id: uuid (primary key)`
      - `metric_id: uuid (fk to dataset_metrics.id)`
      - `name: String` (from `Argument.name`)
      - `arg_type: String` (from `Argument.type_`)
      - `description: Option<String>` (from `Argument.description`)
      - `_created_at, _updated_at, _deleted_at` (user stamps might be excessive here, could inherit from parent metric)

   **d. `dataset_filters` table:**
      - `id: uuid (primary key)`
      - `dataset_id: uuid (fk to datasets.id)`
      - `name: String` (from `Filter.name`)
      - `expr: String` (from `Filter.expr`)
      - `description: Option<String>` (from `Filter.description`)
      - `_created_at, _updated_at, _deleted_at, _created_by, _updated_by`

   **e. `filter_arguments` table (if filters can have arguments):**
      - `id: uuid (primary key)`
      - `filter_id: uuid (fk to dataset_filters.id)`
      - `name: String` (from `Argument.name`)
      - `arg_type: String` (from `Argument.type_`)
      - `description: Option<String>` (from `Argument.description`)
      - `_created_at, _updated_at, _deleted_at`

**2. Diesel Models and Schema Migrations:**
   - Define corresponding Diesel structs for these new tables in `api/src/database/models.rs`.
   - Create Diesel schema migration files (`up.sql`, `down.sql`) for these new tables.

**3. Persistence Logic in `deploy_datasets_handler`:**
   - After a `Dataset` (representing the `SemanticModel`) is successfully upserted and its ID is known:
     - **Relationships:** Iterate `semantic_model.relationships`. For each, create a `DatasetRelationship` DB model and add to a list. Perform a bulk upsert. Implement soft-delete for relationships associated with this `dataset_id` but not in the current request.
     - **Metrics:** Iterate `semantic_model.metrics`. For each, create a `DatasetMetric` DB model. If it has `args`, create `MetricArgument` DB models. Upsert metrics, then arguments. Implement soft-delete.
     - **Filters:** Iterate `semantic_model.filters`. For each, create a `DatasetFilter` DB model. If it has `args`, create `FilterArgument` DB models. Upsert filters, then arguments. Implement soft-delete.

```rust
// Conceptual logic within deploy_datasets_handler for one SemanticModel
// After dataset (semantic_model) is upserted and its `db_dataset_id` is known:

// --- Persist Relationships ---
let current_relationships_from_model: Vec<NewDatasetRelationship> = semantic_model.relationships.iter().map(|rel| {
    NewDatasetRelationship {
        dataset_id: db_dataset_id,
        name: rel.name.clone(),
        description: rel.description.clone(),
        relationship_type: rel.type_.clone(),
        cardinality: rel.cardinality.clone(),
        current_model_key: rel.primary_key.clone(),
        related_model_key: rel.foreign_key.clone(),
        // ... other fields, created_by, updated_by ...
    }
}).collect();
// 1. Soft delete existing relationships for db_dataset_id not in current_relationships_from_model (based on a unique key like name+dataset_id)
// diesel::update(dataset_relationships::table.filter(...)).set(deleted_at.eq(now)).execute(&mut conn).await?;
// 2. Bulk upsert current_relationships_from_model
// diesel::insert_into(dataset_relationships::table).values(&current_relationships_from_model).on_conflict(...).do_update(...).execute(&mut conn).await?;

// --- Persist Metrics ---
// Similar logic: map semantic_model.metrics to NewDatasetMetric, handle args with NewMetricArgument
// Soft delete old metrics, then bulk upsert new ones and their arguments.

// --- Persist Filters ---
// Similar logic: map semantic_model.filters to NewDatasetFilter, handle args with NewFilterArgument
// Soft delete old filters, then bulk upsert new ones and their arguments.
```

#### Implementation Steps
1.  [ ] Finalize the schema for `dataset_relationships`, `dataset_metrics`, `metric_arguments`, `dataset_filters`, `filter_arguments` tables.
2.  [ ] Create Diesel migration files (`up.sql` and `down.sql`) for these new tables.
3.  [ ] Define the corresponding Rust structs for these tables in `api/src/database/models.rs` and `api/src/database/schema.rs` (after running migrations).
4.  [ ] In `deploy_datasets_handler`, after a `Dataset` is upserted:
    a.  Implement logic to map `semantic_model.relationships` to `DatasetRelationship` DB models.
    b.  Implement soft-delete for existing relationships of that `dataset_id` that are not in the current deployment.
    c.  Implement bulk upsert for the new/updated relationships.
5.  [ ] Repeat step 4 for `Metrics` (and their `Arguments`) and `Filters` (and their `Arguments`).

#### Tests
-   **Database Migration Tests:** Ensure migrations run up and down correctly.
-   **Unit Tests for Persistence Logic (mocking DB connection or using test transaction):**
    -   Deploy a new model with relationships, metrics, filters -> verify correct DB records are created.
    -   Redeploy the same model with changes (e.g., one relationship removed, one metric updated, one filter added) -> verify soft-deletes, updates, and inserts.
    -   Redeploy a model with all relationships/metrics/filters removed -> verify they are soft-deleted.
-   **Integration Tests:** Full CLI deploy of a complex model, then inspect the database to ensure all semantic components are stored accurately.

#### Success Criteria
- [ ] Database schema for storing relationships, metrics, and filters is implemented via migrations.
- [ ] `deploy_datasets_handler` correctly persists all components of `semantic_layer::Model` to the new tables.
- [ ] Soft-delete and update logic for these components works as expected on redeployment.
- [ ] Data can be queried from these new tables and correctly reconstructs the semantic information for a given dataset.
- [ ] All tests pass.

## Dependencies on Other Components

-   **`prd_api_request_handling.md`**: Assumes the API is receiving `semantic_layer::Model` objects and has processed them into core `Dataset` and `DatasetColumn` entries.
-   **`prd_semantic_model_definition.md`**: Depends on the final structure of `Relationship`, `Metric`, `Filter`, and `Argument` in `semantic_layer::models.rs`.

## Security Considerations

-   Standard ORM practices (like Diesel) should prevent SQL injection when inserting/updating these records.
-   Ensure that foreign key constraints are in place to maintain data integrity between `datasets` and these new tables.

## References

-   `api/libs/semantic_layer/src/models.rs` (for the source struct definitions)
-   Diesel ORM documentation (for migrations, schema, CRUD operations).
-   Existing `deploy_datasets_handler` logic for `Dataset` and `DatasetColumn` persistence.

``` 