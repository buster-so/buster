---
title: Semantic Model Definition
author: Gemini Assistant
date: 2024-07-26
status: Draft
parent_prd: semantic_layer_refactor_overview.md
ticket: N/A
---

# Semantic Model Definition

## Parent Project

This is a sub-PRD of the [Semantic Layer and Deployment Refactor](semantic_layer_refactor_overview.md) project. Please refer to the parent PRD for the overall project context, goals, and implementation plan.

## Problem Statement

The current Rust structs in `api/libs/semantic_layer/src/models.rs` need to be the definitive representation of a data model as defined in user-created YAML files. These structs will be used by the CLI for parsing and by the API for request handling and persistence.

Current behavior:
-   The `Model` struct in `api/libs/semantic_layer/src/models.rs` is a good starting point but lacks fields for `database` and `schema` which are crucial for deployment and configuration inheritance.
-   The existing fields need to be reviewed to ensure they align with all attributes we want to support in the YAML model definitions (e.g., for entities/relationships, dimensions, measures, metrics, filters).

Expected behavior:
-   The structs in `api/libs/semantic_layer/src/models.rs` (primarily `Model`, `Dimension`, `Measure`, `Relationship`, `Metric`, `Filter`) will comprehensively define the structure of a semantic model.
-   The `Model` struct will include optional `database: Option<String>` and `schema: Option<String>` fields, with `#[serde(skip_serializing_if = "Option::is_none")]` to ensure they are not serialized if absent (useful for overrides).
-   All fields will correctly use `Option<T>` where attributes are optional in the YAML.
-   `serde` attributes (`rename`, `default`) will be used appropriately to match YAML conventions and handle missing fields gracefully.

## Goals

1.  Define a comprehensive set of Rust structs in `api/libs/semantic_layer/src/models.rs` that accurately represent the YAML structure for semantic models.
2.  Ensure the `Model` struct includes optional `database` and `schema` fields.
3.  Verify that all optional fields in the YAML correspond to `Option<T>` in Rust and use `#[serde(default)]` or other appropriate `serde` attributes where necessary.
4.  Ensure field names in Rust map correctly to YAML field names using `#[serde(rename = "...")]` if they differ (e.g., `type` vs `type_`).

## Non-Goals

1.  Implementing the parsing logic itself (this PRD focuses on struct definition).
2.  Defining how these models are stored in the database (covered in `prd_api_model_persistence.md`).

## Implementation Plan

### Phase 1: Define Core Model Structures

#### Technical Design
Review and update the following structs in `api/libs/semantic_layer/src/models.rs`:

```rust
// Path: api/libs/semantic_layer/src/models.rs

use serde::Deserialize;

// #[derive(Debug, Deserialize, PartialEq)] // Removed PartialEq for brevity in PRD, keep in real code
// pub struct SemanticLayerSpec { // Assuming top-level might be a Vec<Model> directly from file
//     pub models: Vec<Model>,
// }

#[derive(Debug, Deserialize)] // PartialEq can be added back later if needed for tests here
pub struct Model {
    pub name: String,
    pub description: Option<String>,
    
    // Added for deployment context, resolved by CLI
    #[serde(skip_serializing_if = "Option::is_none")]
    pub database: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,

    #[serde(default)]
    pub dimensions: Vec<Dimension>,
    #[serde(default)]
    pub measures: Vec<Measure>,
    #[serde(default)]
    pub metrics: Vec<Metric>,
    #[serde(default)]
    pub filters: Vec<Filter>,
    #[serde(rename = "entities", default)] // Renamed from 'relationships' to match user YAML, default if empty
    pub relationships: Vec<Relationship>,
}

#[derive(Debug, Deserialize)]
pub struct Dimension {
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    #[serde(default)]
    pub searchable: bool,
    pub options: Option<Vec<String>>,
    // Consider adding expr for derived dimensions if supported by backend processing
    // pub expr: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Measure {
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    // Aggregation might be relevant, or handled by `expr`
    // pub agg: Option<String>,
    // pub expr: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Metric {
    pub name: String,
    pub expr: String, // Expression is core to a metric
    pub description: Option<String>,
    #[serde(default)]
    pub args: Vec<Argument>, // Changed to default empty vec
}

#[derive(Debug, Deserialize)]
pub struct Filter {
    pub name: String,
    pub expr: String, // Expression is core to a filter
    pub description: Option<String>,
    #[serde(default)]
    pub args: Vec<Argument>, // Changed to default empty vec
}

#[derive(Debug, Deserialize)]
pub struct Argument {
    pub name: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Relationship { // This was 'Entity' in CLI, 'Relationship' in semantic_layer, aligns with user's yml 'entities'
    pub name: String, // Name of the related entity/model
    
    // Fields from existing semantic_layer::Relationship
    pub primary_key: String, // Field in the current model
    pub foreign_key: String, // Field in the related model ('name')
    
    #[serde(rename = "type")]
    pub type_: Option<String>, // e.g., LEFT, INNER, etc. (join type)
    pub cardinality: Option<String>, // e.g., one-to-one, one-to-many
    pub description: Option<String>,

    // Fields from CLI Entity struct to consider merging/mapping
    // pub ref_: Option<String>, // If 'name' refers to an alias and 'ref_' is actual model
    // pub expr: String, // The join condition or foreign key expression if not simple keys
    // pub entity_type: String, // 'foreign', 'derived' etc. Could map to relationship characteristics
    // pub project_path: Option<String>, // For cross-project relationships, handled by CLI config resolution
}

```

**Key decisions for `Relationship` struct:**
-   The `Relationship` struct aims to consolidate what was previously `Entity` in the CLI's model parsing and the existing `Relationship` in the semantic layer.
-   `name`: Will refer to the target model name of the relationship.
-   `primary_key`: Column in the *current* model used for the join.
-   `foreign_key`: Column in the *target* model (specified by `name`) used for the join.
-   `type_`: Join type (e.g., `LEFT`, `INNER`).
-   `cardinality`: e.g., `one_to_one`, `one_to_many`.
-   The `expr` field from the CLI's `Entity` (which represented the join condition, like `self.id = other.self_id`) is important. We need to decide if `primary_key` and `foreign_key` are sufficient, or if a more general `expr` is needed for complex joins. For now, sticking to `primary_key` and `foreign_key` for simplicity, assuming simple key-based joins. If complex joins are needed, `expr` can be added back, potentially replacing `primary_key`/`foreign_key` or coexisting.
-   `project_path` from CLI's `Entity`: If a relationship `name` can be an alias, and `ref` points to the actual model, this is a pattern to consider. For now, `name` is assumed to be the actual target model name.
-   `ref_` from CLI's `Entity`: If a relationship `name` can be an alias, and `ref` points to the actual model, this is a pattern to consider. For now, `name` is assumed to be the actual target model name.

#### Implementation Steps
1.  [x] Add `database: Option<String>` and `schema: Option<String>` to the `Model` struct with `#[serde(skip_serializing_if = "Option::is_none")]`.
2.  [x] Review and update `Dimension`, `Measure`, `Metric`, `Filter`, and `Argument` structs to ensure all necessary fields are present, optionality is correct (`Option<T>`), and `serde` attributes (`default`, `rename`) are used appropriately.
3.  [x] Rename `Model.relationships` to `Model.entities` via `#[serde(rename = "entities")]` to match common YAML usage, while keeping the struct name `Relationship` internally if preferred, or renaming the struct to `Entity` as well for consistency.
4.  [x] Define the `Relationship` (or `Entity`) struct to include `name`, `primary_key`, `foreign_key`, `type_` (join type), `cardinality`, and `description`. Clarify the meaning of `primary_key` and `foreign_key` in this context (current model vs. related model).
5.  [ ] Ensure all structs derive `Debug` and `Deserialize`. `PartialEq` can be added for testing.

#### Tests

Unit tests in `api/libs/semantic_layer/src/models.rs` should verify deserialization of example YAML snippets into these structs, covering:
-   All fields present.
-   Optional fields missing (should default or be `None`).
-   Renamed fields (e.g., `type` in YAML to `type_` in Rust).
-   Defaulted collections (e.g., empty `dimensions` list if not in YAML).

```rust
// Example Test Snippet (conceptual)
#[cfg(test)]
mod tests {
    use super::*;
    use serde_yaml;

    #[test]
    fn test_deserialize_model_with_optional_db_schema() {
        let yaml_content = r#"
models:
  - name: my_model
    database: prod_db
    schema: prod_schema
    dimensions: []
    measures: []
    entities: []
"#;
        // Assuming we deserialize Vec<Model> if the top level is `models:`
        // Or adjust if a single file represents a single Model or a SemanticLayerSpec struct.
        // For now, let's assume a direct Model deserialization for simplicity of the test snippet's focus.
        let model_yaml = r#"
name: my_model
database: prod_db
schema: prod_schema
description: A test model
dimensions:
  - name: id
    type: integer
  - name: status
    type: string
    searchable: true
    options: ["active", "inactive"]
entities:
  - name: related_model
    primary_key: id
    foreign_key: my_model_id
    type: LEFT
    cardinality: one-to-many
metrics:
  - name: total_revenue
    expr: SUM(amount)
"#;
        let parsed_model: Result<Model, _> = serde_yaml::from_str(model_yaml);
        assert!(parsed_model.is_ok());
        let model = parsed_model.unwrap();
        assert_eq!(model.name, "my_model");
        assert_eq!(model.database, Some("prod_db".to_string()));
        assert_eq!(model.schema, Some("prod_schema".to_string()));
        assert_eq!(model.dimensions.len(), 2);
        assert_eq!(model.relationships.len(), 1);
        assert_eq!(model.metrics.len(), 1);
    }

    // Add more tests for other structs and variations
}
```

#### Success Criteria
- [ ] All structs in `api/libs/semantic_layer/src/models.rs` are defined as per the technical design.
- [ ] Unit tests for deserialization pass, covering various YAML structures.
- [ ] Code is reviewed and approved.

## Dependencies on Other Components
- None for this specific PRD, as it's foundational.

## Security Considerations
- Not directly applicable at the struct definition level, but `serde` itself is a well-vetted library.

## References
- Existing `api/libs/semantic_layer/src/models.rs`
- Existing CLI model parsing in `cli/cli/src/commands/deploy.rs` (for field reference) 