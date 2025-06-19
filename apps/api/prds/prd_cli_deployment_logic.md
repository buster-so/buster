---
title: CLI Deployment Logic
author: Gemini Assistant
date: 2024-07-26
status: Draft
parent_prd: semantic_layer_refactor_overview.md
ticket: N/A
---

# CLI Deployment Logic

## Parent Project

This is a sub-PRD of the [Semantic Layer and Deployment Refactor](semantic_layer_refactor_overview.md) project. Please refer to the parent PRD for the overall project context, goals, and implementation plan.

## Problem Statement

Once model files are discovered (as per `prd_cli_config_and_discovery.md`), the CLI needs to:
1.  Parse these YAML files into the new Rust structs defined in `api/libs/semantic_layer/src/models.rs`.
2.  Resolve the definitive `data_source_name`, `database`, and `schema` for each model. This involves checking the model file itself, then the `ProjectConfig` (if the model belongs to a project), and finally the global `BusterConfig`.
3.  Construct the payload for the `/deploy_datasets` API endpoint, which will now expect an array of these semantic models.
4.  Handle any pre-flight validations that make sense to perform on the CLI side before sending data to the API.

Current behavior:
-   The CLI parses YAML into its own local structs (`cli/cli/src/commands/deploy.rs`'s `Model`, `Entity`, etc.).
-   Configuration resolution is less structured, primarily relying on global `buster.yml` settings or model-level overrides without a clear project-level intermediate step.
-   The API request (`DeployDatasetsRequest`) is constructed based on these local CLI structs, not a shared semantic layer definition.

Expected behavior:
-   Each discovered `.yml` model file will be parsed using `serde_yaml::from_str` into the `semantic_layer::Model` struct (or `Vec<semantic_layer::Model>` if a single file can contain multiple model definitions under a `models:` key).
-   For each parsed `semantic_layer::Model`:
    -   The `database`, `schema`, and `data_source_name` will be determined by checking, in order:
        1.  Values present directly within the parsed `semantic_layer::Model` (i.e., defined in the YAML itself).
        2.  Values from the `ProjectConfig` associated with the model's path (if applicable).
        3.  Values from the global `BusterConfig`.
    -   If any of these (especially `data_source_name`, `schema`) are still `None` after this process, it should be an error, and the model should not be deployed.
    -   The resolved `database` and `schema` will be populated back into the `Option<String>` fields on the `semantic_layer::Model` instance before sending to the API.
-   The CLI will construct a JSON array of these fully resolved `semantic_layer::Model` objects to send to the `/deploy_datasets` API.
-   Basic validations (e.g., presence of model name, required configuration) will be performed by the CLI.

## Goals

1.  Implement YAML parsing for model files into `semantic_layer::Model` structs.
2.  Implement the configuration inheritance logic (Model File > ProjectConfig > Global BusterConfig) for `data_source_name`, `database`, and `schema` for each model.
3.  Ensure that `database` and `schema` are resolved and set on the `semantic_layer::Model` structs before they are sent to the API.
4.  Construct the API request payload as a JSON array of `semantic_layer::Model` objects.
5.  Perform essential CLI-side validations (e.g., model name presence, resolved configurations).

## Non-Goals

1.  Deep validation of SQL expressions or business logic within the model (this is primarily the API/backend's responsibility).
2.  The actual HTTP call to the API (can be mocked or assumed for this PRD, focus is on payload construction).

## Implementation Plan

### Phase 1: Parsing and Configuration Resolution

#### Technical Design

**1. Parsing Model Files:**
   - After `all_model_files_with_context: Vec<(PathBuf, Option<ProjectConfig>)>` is obtained from the discovery phase.
   - Iterate through this vector. For each `(yml_file_path, option_project_config)`:
     - Read the content of `yml_file_path`.
     - Attempt to parse it. A key decision: Does a single `.yml` file define one `Model` or a `Vec<Model>` (e.g., under a top-level `models:` key, like the current `BusterModel` wrapper in CLI)?
       - **Assumption for now:** A single `.yml` file maps to one `semantic_layer::Model`. If it can map to `Vec<Model>`, the parsing and iteration logic will adjust accordingly.
       - `let parsed_model: semantic_layer::Model = serde_yaml::from_str(&yml_content)?;`

**2. Configuration Resolution Logic:**
   - For each `parsed_model` and its `option_project_config` and the global `buster_config`:

```rust
// Conceptual logic in cli/cli/src/commands/deploy.rs
// ... assume parsed_model: semantic_layer::Model
// ... assume option_project_config: Option<ProjectConfig>
// ... assume global_buster_config: BusterConfig

fn resolve_model_configurations(
    models_with_context: Vec<(semantic_layer::Model, Option<ProjectConfig>)>,
    global_buster_config: &BusterConfig,
) -> Result<Vec<semantic_layer::Model>, anyhow::Error> {
    let mut resolved_models = Vec::new();

    for (mut model, proj_config_opt) in models_with_context {
        // Resolve data_source_name
        let resolved_ds_name = model.data_source_name.clone()
            .or_else(|| proj_config_opt.as_ref().and_then(|pc| pc.data_source_name.clone()))
            .or_else(|| global_buster_config.data_source_name.clone());

        // Resolve schema
        let resolved_schema = model.schema.clone()
            .or_else(|| proj_config_opt.as_ref().and_then(|pc| pc.schema.clone()))
            .or_else(|| global_buster_config.schema.clone());

        // Resolve database
        let resolved_database = model.database.clone()
            .or_else(|| proj_config_opt.as_ref().and_then(|pc| pc.database.clone()))
            .or_else(|| global_buster_config.database.clone());

        // Validation: schema and data_source_name are essential for API processing
        if resolved_ds_name.is_none() {
            return Err(anyhow::anyhow!(
                "Model '{}': data_source_name could not be resolved.", model.name
            ));
        }
        if resolved_schema.is_none() {
            return Err(anyhow::anyhow!(
                "Model '{}': schema could not be resolved.", model.name
            ));
        }
        // Database is also important for the API to correctly identify/qualify table names, especially for type inference.
        // If the semantic_layer::Model has database as Option<String>, it implies API can handle it being None.
        // However, for type inference, the API will likely need it. Let's assume for now it's good practice to resolve it if possible.

        model.data_source_name = resolved_ds_name;
        model.schema = resolved_schema;
        model.database = resolved_database; // This is already Option<String> on semantic_layer::Model

        // CLI Validations
        if model.name.is_empty() {
            return Err(anyhow::anyhow!("Found a model with an empty name."));
        }
        // Any other simple, fast validations...

        resolved_models.push(model);
    }
    Ok(resolved_models)
}
```
*Self-correction: The `semantic_layer::Model` from `api/libs/semantic_layer/src/models.rs` does not currently have `data_source_name`. This field is part of the `DeployDatasetsRequest` in the API and `BusterConfig` in the CLI. The API request will need a top-level `data_source_name` or each model in the array needs to carry its own. Given the project structure, it makes sense for `data_source_name` to be resolvable per model too and be part of the `semantic_layer::Model` struct sent to the API. This requires adding `data_source_name: Option<String>` to `semantic_layer::Model` (see `prd_semantic_model_definition.md`).*

**3. API Payload Construction:**
   - The `resolved_models: Vec<semantic_layer::Model>` is then serialized to JSON. This JSON array is the body of the request to `/deploy_datasets`.

```rust
// Conceptual: Sending to API
// let api_client = BusterClient::new(...);
// let response = api_client.deploy_datasets_raw(resolved_models).await?;
// The BusterClient method would take Vec<semantic_layer::Model> and serialize it.
```

#### Implementation Steps
1.  [x] For each discovered model file path (and its associated `Option<ProjectConfig>`):
    a.  Read file content.
    b.  Parse YAML content into `semantic_layer::Model` (or `Vec<semantic_layer::Model>` if files can contain multiple). Handle parsing errors.
2.  [x] Implement the `resolve_model_configurations` function (or similar logic) to determine `data_source_name`, `schema`, and `database` for each model using the precedence: Model file -> `ProjectConfig` -> Global `BusterConfig`.
    *   *(Depends on `data_source_name: Option<String>` being added to `semantic_layer::Model`)*
3.  [x] Ensure the resolved `data_source_name`, `schema`, and `database` are populated onto the `semantic_layer::Model` instances.
4.  [x] Perform CLI-side validations (e.g., model name is not empty, required configurations like `data_source_name` and `schema` are present after resolution).
5.  [x] Group the resolved and validated `semantic_layer::Model` objects into a `Vec`.
6.  [x] This `Vec<semantic_layer::Model>` will be the collection to be serialized to JSON for the API request.

#### Tests
-   **Unit Tests for Parsing:** ✅
    -   Valid YAML model file parses correctly into `semantic_layer::Model`.
    -   Invalid YAML structure results in an error.
    -   File with multiple models (if supported) parses into `Vec<semantic_layer::Model>`.
-   **Unit Tests for Configuration Resolution:** ✅
    -   Model gets config from its own file.
    -   Model gets config from `ProjectConfig` when not in file.
    -   Model gets config from Global `BusterConfig` when not in file or `ProjectConfig`.
    -   Error if required config (`data_source_name`, `schema`) is missing after all checks.
    -   Correct precedence is followed.
-   **Integration-like Tests (can use `deploy` command with mocked API client):** ✅
    -   End-to-end flow: discovery -> parsing -> config resolution -> payload for API is correctly formed.
    -   Scenario with `buster.yml` and `projects` structure.
    -   Scenario with model-level overrides.

#### Success Criteria
- [x] CLI can parse valid YAML model files into `semantic_layer::Model` structs.
- [x] Configuration inheritance (Model > Project > Global) for `data_source_name`, `schema`, `database` is correctly implemented and validated.
- [x] The list of models to be deployed is correctly prepared with all necessary information for the API.
- [x] CLI performs basic validations before attempting to send to API.
- [x] All tests pass.

## Dependencies on Other Components

-   **`prd_semantic_model_definition.md`**: Critical dependency for the `semantic_layer::Model` struct definition, including the `data_source_name`, `database`, and `schema` optional fields.
-   **`prd_cli_config_and_discovery.md`**: For obtaining the list of model files and their associated `ProjectConfig` context.
-   **`prd_api_request_handling.md`**: The API endpoint must be ready to accept `Vec<semantic_layer::Model>` as its payload.

## Security Considerations

-   Error handling during file reading and parsing should be robust to prevent crashes or information leakage from malformed files.

## References

-   `api/libs/semantic_layer/src/models.rs`
-   `cli/cli/src/commands/deploy.rs` (for existing deployment logic)
-   `serde_yaml` documentation. 