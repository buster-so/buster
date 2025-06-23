---
title: CLI Configuration and Model Discovery
author: Gemini Assistant
date: 2024-07-26
status: Draft
parent_prd: semantic_layer_refactor_overview.md
ticket: N/A
---

# CLI Configuration and Model Discovery

## Parent Project

This is a sub-PRD of the [Semantic Layer and Deployment Refactor](semantic_layer_refactor_overview.md) project. Please refer to the parent PRD for the overall project context, goals, and implementation plan.

## Problem Statement

The current CLI (`deploy` command) has a limited way of discovering model files and managing configurations. The `buster.yml` is typically expected in the current directory or a specified path, and its structure is flat. This doesn't cater well to monorepos or projects where models might be organized into sub-directories, each potentially with slightly different default configurations (like schema or database).

Behavior of `deploy` command pathing:
- The `deploy` command, when invoked, should look for `buster.yml` only in the effective target directory (either the one provided as an argument or the current working directory if no argument is given).
- It should *not* search in parent directories for `buster.yml`.
- Once `buster.yml` is found (or defaults are used if it's not found), model file discovery (e.g., `*.yml`) will proceed based on the paths specified in `buster.yml` (new `projects` field) or the directory containing `buster.yml` itself (for backward compatibility or simple cases). Model search should be recursive *within* these specified model paths.

Current behavior:
-   `BusterConfig` in `cli/cli/src/utils/config.rs` is flat, primarily supporting global `data_source_name`, `schema`, `database`, `exclude_tags`, and `exclude_files`.
-   Model discovery is generally from the current path or a specified path, without a structured way to define multiple distinct "project" sources of models within one `buster.yml`.
-   The `deploy` command might have ambiguous behavior regarding `buster.yml` lookup upwards in the directory tree.

Expected behavior:
-   The `deploy` command will strictly look for `buster.yml` in the target directory (current or specified) and *not* traverse upwards.
-   `BusterConfig` will be extended to include an optional `projects: Vec<ProjectConfig>` field.
-   Each `ProjectConfig` will define a `path` (relative to the `buster.yml` location) where its models are located, and can optionally specify its own `data_source_name`, `schema`, and `database` that override the global settings in `buster.yml` for models within that project path.
-   The CLI's model discovery logic will iterate through these `projects` (if defined) or use the `buster.yml` directory / `model_paths` (if defined and `projects` is not) to find model files (`.yml` excluding `buster.yml`).
-   Configuration (database, schema, data_source_name) for a deployed model will be resolved with the following precedence: Model File -> ProjectConfig -> Global BusterConfig.

## Goals

1.  Modify the `deploy` command to search for `buster.yml` only in the current/specified directory and its subdirectories (when looking for models), not parent directories.
2.  Extend `BusterConfig` in `cli/cli/src/utils/config.rs` to include `projects: Option<Vec<ProjectConfig>>`.
3.  Define a `ProjectConfig` struct with `path: String` and optional `data_source_name`, `schema`, `database` fields.
4.  Update the model file discovery logic in `cli/cli/src/commands/deploy.rs` to:
    a.  Honor the `projects` structure in `buster.yml` if present.
    b.  If `projects` is not present, fall back to existing `model_paths` logic or searching the directory of `buster.yml` (or current/specified path if no `buster.yml`).
    c.  Recursively search for `.yml` model files within the determined project/model paths.
5.  Implement the configuration inheritance logic (Model File > ProjectConfig > Global BusterConfig) when preparing models for deployment.

## Non-Goals

1.  Changing the YAML parsing for individual model files (covered in `prd_semantic_model_definition.md` and `prd_cli_deployment_logic.md`).
2.  Altering the `exclude_tags` or `exclude_files` functionality at the global level (though they would apply to all discovered models).

## Implementation Plan

### Phase 1: Update BusterConfig and Discovery Logic

#### Technical Design

**1. `BusterConfig` and `ProjectConfig` structs (`cli/cli/src/utils/config.rs`):**

```rust
// In cli/cli/src/utils/config.rs (or equivalent)
use serde::Deserialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Deserialize, Clone, Default)] // Added Default
pub struct BusterConfig {
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
    pub database: Option<String>,
    pub exclude_tags: Option<Vec<String>>,
    pub exclude_files: Option<Vec<PathBuf>>, // Assuming PathBuf is more appropriate here
    pub model_paths: Option<Vec<String>>,    // Existing field for model paths
    pub projects: Option<Vec<ProjectConfig>>, // New field for projects
}

#[derive(Debug, Deserialize, Clone)]
pub struct ProjectConfig {
    pub name: String, // A name for the project (optional, for logging/identification)
    pub path: String, // Path relative to buster.yml location
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
    pub database: Option<String>,
}

impl BusterConfig {
    // Helper function to load BusterConfig from a directory.
    // This should only look for buster.yml in the specified `dir`.
    pub fn load_from_dir(dir: &Path) -> Result<Option<Self>, anyhow::Error> {
        let config_path = dir.join("buster.yml");
        if config_path.exists() {
            let content = std::fs::read_to_string(config_path)?;
            let config: BusterConfig = serde_yaml::from_str(&content)?;
            Ok(Some(config))
        } else {
            Ok(None)
        }
    }

    // Method to resolve effective model search paths
    // Returns a list of (PathBuf, Option<ProjectConfig>) where PathBuf is absolute
    pub fn resolve_effective_model_paths(&self, buster_yml_dir: &Path) -> Vec<(PathBuf, Option<&ProjectConfig>)> {
        let mut effective_paths = Vec::new();

        if let Some(projects) = &self.projects {
            for project_config in projects {
                let project_path = buster_yml_dir.join(&project_config.path);
                effective_paths.push((project_path, Some(project_config)));
            }
        } else if let Some(model_paths) = &self.model_paths {
            for model_path_str in model_paths {
                let model_path = buster_yml_dir.join(model_path_str);
                effective_paths.push((model_path, None));
            }
        } else {
            // Default to the directory containing buster.yml if no projects or model_paths specified
            effective_paths.push((buster_yml_dir.to_path_buf(), None));
        }
        effective_paths
    }
}
```

**2. Model Discovery in `deploy.rs`:**
   - The `deploy` function will first determine the `base_dir` (current or specified path).
   - It will call `BusterConfig::load_from_dir(&base_dir)` to get the config. If no `buster.yml` is found, it proceeds with default/empty config.
   - Use `config.resolve_effective_model_paths(&base_dir)` to get search paths and associated project configs.
   - For each path returned:
     - Recursively find all `*.yml` files (excluding `buster.yml`).
     - Keep track of the `Option<ProjectConfig>` associated with models found under each path for later config resolution.

```rust
// Conceptual logic in cli/cli/src/commands/deploy.rs
// ... imports ...
use crate::utils::config::{BusterConfig, ProjectConfig}; // Assuming this path

async fn deploy(path_arg: Option<&str>, /* ... other args ... */) -> Result<()> {
    let current_dir = std::env::current_dir()?;
    let base_dir = path_arg.map(PathBuf::from).unwrap_or(current_dir);

    // Load buster.yml strictly from base_dir
    let buster_config = BusterConfig::load_from_dir(&base_dir)?.unwrap_or_default();

    let mut all_model_files_with_context = Vec::new();

    let effective_search_paths = buster_config.resolve_effective_model_paths(&base_dir);

    for (search_path, project_config_opt) in effective_search_paths {
        if search_path.is_dir() {
            // WalkDir or similar to find *.yml files recursively
            // For each found yml_file_path:
            // all_model_files_with_context.push((yml_file_path, project_config_opt.cloned()));
        } else if search_path.is_file() && search_path.extension().map_or(false, |ext| ext == "yml") {
            // all_model_files_with_context.push((search_path, project_config_opt.cloned()));
        }
    }

    // ... rest of the deployment logic will use all_model_files_with_context ...
    // Each element now carries its potential ProjectConfig for resolving DB/schema

    Ok(())
}

```

#### Implementation Steps
1.  [x] Define `ProjectConfig` struct in `cli/cli/src/utils/config.rs`.
2.  [x] Add `projects: Option<Vec<ProjectConfig>>` to `BusterConfig` struct.
3.  [x] Update `BusterConfig::load_from_dir` (or ensure existing loader) to only look in the provided directory.
4.  [x] Implement `BusterConfig::resolve_effective_model_paths(&self, buster_yml_dir: &Path)` method.
5.  [x] In `cli/cli/src/commands/deploy.rs`:
    a.  Modify `deploy` to determine `base_dir` (current or specified path).
    b.  Load `BusterConfig` strictly from `base_dir`.
    c.  Use `resolve_effective_model_paths` to get search locations.
    d.  Implement recursive search for `.yml` files (excluding `buster.yml`) in these locations, associating found files with their `Option<ProjectConfig>`.
6.  [x] Ensure exclusion logic (`exclude_files`, `exclude_tags`) is still applied correctly to the discovered files.

#### Tests

-   **Unit Tests for `BusterConfig`:**
    -   Test `BusterConfig::load_from_dir` correctly loads or returns `None`.
    -   Test `resolve_effective_model_paths`:
        -   With `projects` defined.
        -   With `model_paths` defined (and `projects` undefined).
        -   With neither defined (should default to `buster_yml_dir`).
        -   Paths are correctly made absolute from `buster_yml_dir`.
-   **Integration-like Tests for `deploy` discovery (mocking file system or using temp dirs):**
    -   `buster.yml` in current dir, `projects` point to subdirs -> models found correctly.
    -   `buster.yml` in current dir, no `projects`, no `model_paths` -> models in current dir found.
    -   `deploy` called with path argument -> `buster.yml` loaded from that path.
    -   `deploy` command does NOT find `buster.yml` in parent directories.
    -   Ensure `exclude_files` patterns correctly filter results from `projects` paths.

#### Success Criteria
- [x] `BusterConfig` and `ProjectConfig` are correctly defined and can be deserialized from YAML.
- [x] `deploy` command loads `buster.yml` only from the specified/current directory.
- [x] Model discovery correctly uses `projects`, then `model_paths`, then `buster.yml` directory, and finds `.yml` files recursively within these.
- [x] Discovered model files are correctly associated with their `ProjectConfig` (if any) for later steps.
- [x] All tests pass.

## Dependencies on Other Components

-   Relies on `prd_semantic_model_definition.md` for the structure of model files being discovered, but primarily focuses on *finding* them and their *configuration context*.

## Security Considerations

-   Path resolution from `buster.yml` (for `projects.path` or `model_paths`) must be handled carefully to ensure paths are treated as relative to `buster.yml` and do not allow traversal to unintended locations (e.g., `../../../../../etc/passwd`). Standard library functions like `Path::join` are generally safe but input validation or sanitization might be considered if paths can be arbitrary strings.

## References

-   Existing `cli/cli/src/utils/config.rs`
-   Existing `cli/cli/src/commands/deploy.rs` model discovery logic. 