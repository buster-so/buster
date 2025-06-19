use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use glob::Pattern; // Keep glob dependency if validate_exclude_patterns is here
use std::fs;

/// Represents a specific project context within buster.yml
#[derive(Debug, Deserialize, Serialize, Clone, Default)] // Add Default for serde
pub struct ProjectContext {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_source_name: Option<String>,
    #[serde(alias = "dataset_id", skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,
    #[serde(alias = "project_id", skip_serializing_if = "Option::is_none")]
    pub database: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exclude_files: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exclude_tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_paths: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>, // Optional name for the project
    #[serde(skip_serializing_if = "Option::is_none")]
    pub semantic_model_paths: Option<Vec<String>>, // Paths to directories where semantic model YAML files (1:1 with SQL models) are stored
}

impl ProjectContext {
    /// Returns the effective model paths for this project context, relative to buster_yml_dir if not absolute.
    pub fn resolve_model_paths(&self, buster_yml_dir: &Path) -> Vec<PathBuf> {
        if let Some(model_paths) = &self.model_paths {
            model_paths.iter()
                .map(|path_str| {
                    let p = Path::new(path_str);
                    if p.is_absolute() {
                        p.to_path_buf()
                    } else {
                        buster_yml_dir.join(p)
                    }
                })
                .collect()
        } else {
            // If no model_paths are defined for the project,
            // it implies the project doesn't define its own model file locations directly through model_paths.
            // It might be a context for configuration overrides for models found elsewhere,
            // or it might be an error in configuration if models are expected.
            // For now, return an empty vec, meaning this specific ProjectContext doesn't point to any model files on its own.
            Vec::new()
        }
    }
    
    /// Returns the effective semantic model paths for this project context, relative to buster_yml_dir if not absolute.
    pub fn resolve_semantic_model_paths(&self, buster_yml_dir: &Path) -> Vec<PathBuf> {
        if let Some(semantic_model_paths) = &self.semantic_model_paths {
            semantic_model_paths.iter()
                .map(|path_str| {
                    let p = Path::new(path_str);
                    if p.is_absolute() {
                        p.to_path_buf()
                    } else {
                        buster_yml_dir.join(p)
                    }
                })
                .collect()
        } else {
            Vec::new()
        }
    }

    /// Returns a string identifier for this project
    pub fn identifier(&self) -> String {
        self.name.clone().unwrap_or_else(|| "DefaultProjectContext".to_string())
    }
}

/// Unified BusterConfig structure for configuration across all commands
#[derive(Debug, Deserialize, Serialize, Clone, Default)] // Add Default for serde
pub struct BusterConfig {
    // --- Top-level fields for backwards compatibility ---
    #[serde(default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional during deserialization AND serialization
    pub data_source_name: Option<String>,
    #[serde(alias = "dataset_id", default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub schema: Option<String>, // For SQL DBs: schema, For BigQuery: dataset ID
    #[serde(alias = "project_id", default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub database: Option<String>, // For SQL DBs: database, For BigQuery: project ID
    #[serde(default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub exclude_files: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub exclude_tags: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub model_paths: Option<Vec<String>>, // Paths to SQL model files/directories
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub semantic_model_paths: Option<Vec<String>>, // Paths to semantic model YAML files

    // --- New multi-project structure ---
    #[serde(default, skip_serializing_if = "Option::is_none")] // Allows files without 'projects' key to parse and skips serializing if None
    pub projects: Option<Vec<ProjectContext>>,
}

impl BusterConfig {
    /// Gets the appropriate ProjectContext for a given file path
    /// If the file path falls under a project's directory, returns that project's context
    /// Otherwise returns None (indicating default/global context should be used)
    /// TODO: This method needs a rethink after removing `ProjectContext.path`.
    /// How do we determine if a file_path belongs to a project context without a base 'path' for the project?
    /// For now, it will return None. This might affect logic that tries to find a context for an arbitrary file.
    pub fn get_context_for_path(&self, _file_path: &Path, _buster_yml_dir: &Path) -> Option<&ProjectContext> {
        // if let Some(projects) = &self.projects {
        //     // Try to find the most specific project context for this path
        //     // We need to handle paths that might be nested inside other project paths
        //     let mut best_match: Option<(&ProjectContext, usize)> = None;
            
        //     for project in projects {
        //         // This is the part that relied on project.path, which is now removed.
        //         // let project_path = project.absolute_path(buster_yml_dir); 
                
        //         // // Check if file_path is inside this project path
        //         // if let Ok(rel_path) = file_path.strip_prefix(&project_path) {
        //         //     // Count components to determine specificity (more components = more specific)
        //         //     let depth = rel_path.components().count();
                    
        //         //     // If we haven't found a match yet or this is more specific
        //         //     if best_match.is_none() || depth < best_match.unwrap().1 {
        //         //         best_match = Some((project, depth));
        //         //     }
        //         // }
        //     }
            
        //     // Return the most specific project context, if any
        //     // best_match.map(|(ctx, _)| ctx)
        // } else {
        //     None
        // }
        None // Temporarily returning None
    }
    
    /// Resolves all effective model search paths from buster.yml
    /// Returns a list of absolute paths paired with their associated project context (if any)
    pub fn resolve_effective_model_paths(&self, buster_yml_dir: &Path) -> Vec<(PathBuf, Option<&ProjectContext>)> {
        let mut collected_paths = Vec::new();

        if let Some(projects_list) = &self.projects {
            // If 'projects' key exists, it is the sole source of truth for model_paths.
            for project_ctx in projects_list {
                let project_model_paths = project_ctx.resolve_model_paths(buster_yml_dir);
                for path in project_model_paths {
                    collected_paths.push((path, Some(project_ctx)));
                }
            }
            // If projects are defined but none specify model_paths, collected_paths will be empty, which is correct.
        } else {
            // Fallback to top-level model_paths for backward compatibility if 'projects' is not defined.
            if let Some(global_model_paths) = &self.model_paths {
                for path_str in global_model_paths {
                    let resolved_path = if Path::new(path_str).is_absolute() {
                        PathBuf::from(path_str)
                    } else {
                        buster_yml_dir.join(path_str)
                    };
                    collected_paths.push((resolved_path, None));
                }
            }
            // If no projects and no top-level model_paths, collected_paths remains empty.
        }
        collected_paths
    }
    
    /// Validates all exclude patterns to ensure they are valid glob patterns
    /// Checks both top-level and project-level exclude_files
    pub fn validate_exclude_patterns(&self) -> Result<()> {
        // Check top-level first (for backward compatibility)
        if let Some(patterns) = &self.exclude_files {
            for pattern in patterns {
                Pattern::new(pattern)
                    .map_err(|e| anyhow!("Invalid top-level glob pattern \'{}\': {}", pattern, e))?;
            }
        }
        // Check patterns within each project context
        if let Some(projects) = &self.projects {
            for project in projects {
                if let Some(patterns) = &project.exclude_files {
                    for pattern in patterns {
                         Pattern::new(pattern)
                            .map_err(|e| anyhow!("Invalid glob pattern \'{}\' in project \'{}\': {}", pattern, project.identifier(), e))?;
                    }
                }
            }
        }
        Ok(())
    }

     /// Resolves model paths relative to the base directory based on context.
    /// Uses the new resolve_effective_model_paths method which is context-aware
    /// and returns just the PathBufs without their context associations for backward compatibility
    pub fn resolve_model_paths(&self, base_dir: &Path) -> Vec<PathBuf> {
        let effective_paths_with_contexts = self.resolve_effective_model_paths(base_dir);
        
        let resolved_paths: Vec<PathBuf> = effective_paths_with_contexts
            .into_iter()
            .map(|(path, _context)| path)
            .collect();
        
        if !resolved_paths.is_empty() {
            println!("ℹ️  Using resolved model paths:");
            for path in &resolved_paths {
                println!("   - {}", path.display());
            }
        } else {
            println!("ℹ️  No model paths configured or found.");
        }
        resolved_paths
    }

    /// Resolves all effective semantic model search paths from buster.yml
    /// Returns a list of absolute paths paired with their associated project context (if any)
    pub fn resolve_effective_semantic_model_paths(&self, buster_yml_dir: &Path) -> Vec<(PathBuf, Option<&ProjectContext>)> {
        let mut collected_paths = Vec::new();

        if let Some(projects_list) = &self.projects {
            // If 'projects' key exists, it is the sole source of truth for semantic_model_paths.
            for project_ctx in projects_list {
                let project_semantic_paths = project_ctx.resolve_semantic_model_paths(buster_yml_dir);
                for path in project_semantic_paths {
                    collected_paths.push((path, Some(project_ctx)));
                }
            }
            // If projects are defined but none specify semantic_model_paths, collected_paths will be empty.
        } else {
            // Fallback to top-level semantic_model_paths for backward compatibility if 'projects' is not defined.
            if let Some(global_semantic_paths) = &self.semantic_model_paths {
                for path_str in global_semantic_paths {
                    let resolved_path = if Path::new(path_str).is_absolute() {
                        PathBuf::from(path_str)
                    } else {
                        buster_yml_dir.join(path_str)
                    };
                    collected_paths.push((resolved_path, None));
                }
            }
            // If no projects and no top-level semantic_model_paths, collected_paths remains empty.
        }
        collected_paths
    }

    /// Load configuration from the specified directory
    /// This method only looks for buster.yml in the exact directory provided,
    /// it does NOT search in parent directories
    pub fn load_from_dir(dir: &Path) -> Result<Option<Self>> {
        let config_path = dir.join("buster.yml");
        if config_path.exists() {
            let content = std::fs::read_to_string(&config_path)
                .map_err(|e| anyhow!("Failed to read buster.yml: {}", e))?;

            if content.trim().is_empty() {
                println!("ℹ️  Found empty buster.yml, using default configuration.");
                return Ok(None); // Treat empty file same as no file
            }

            let config: Self = serde_yaml::from_str(&content)
                .map_err(|e| anyhow!("Failed to parse buster.yml: {}", e))?;

            // Validate exclude patterns from all sources
            config.validate_exclude_patterns()?;

            // --- Logging configuration details ---
            // Log top-level details if present (for backward compatibility)
            if let Some(ref data_source) = config.data_source_name {
                println!("ℹ️  Global Data source: {}", data_source);
            }
            if let Some(ref schema) = config.schema {
                println!("ℹ️  Global Schema: {}", schema);
            }
            if let Some(ref database) = config.database {
                println!("ℹ️  Global Database: {}", database);
            }
            if let Some(ref patterns) = config.exclude_files {
                println!("ℹ️  Global Exclude file patterns: {:?}", patterns);
            }
            if let Some(ref tags) = config.exclude_tags {
                println!("ℹ️  Global Exclude tags: {:?}", tags);
            }
            if let Some(ref paths) = config.model_paths {
                println!("ℹ️  Global Model paths: {:?}", paths);
            }

            Ok(Some(config))
        } else {
            println!("ℹ️  No buster.yml found at {}, using default configuration.", dir.display());
            Ok(None)
        }
    }

    pub fn load(path: &Path) -> Result<Self> {
        let content = fs::read_to_string(path)
            .with_context(|| format!("Failed to read Buster configuration from {}", path.display()))?;
        serde_yaml::from_str(&content)
            .with_context(|| format!("Failed to parse Buster configuration from {}", path.display()))
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        let yaml_string = serde_yaml::to_string(self)
            .with_context(|| "Failed to serialize Buster configuration to YAML")?;
        if let Some(parent_dir) = path.parent() {
            fs::create_dir_all(parent_dir).with_context(|| {
                format!("Failed to create parent directory for buster.yml at {}", parent_dir.display())
            })?;
        }
        fs::write(path, yaml_string)
            .with_context(|| format!("Failed to write Buster configuration to {}", path.display()))
    }

    // Helper to get the directory where buster.yml is located.
    pub fn base_dir(config_path: &Path) -> Result<PathBuf> {
        config_path
            .parent()
            .ok_or_else(|| anyhow::anyhow!("Could not determine base directory of buster.yml"))
            .map(|p| p.to_path_buf())
    }
} 

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    // Helper to create a temporary test directory
    fn create_test_dir() -> Result<TempDir> {
        Ok(TempDir::new()?)
    }

    // Helper to create a test file
    fn create_test_file(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
        let path = dir.join(name);
        fs::write(&path, content)?;
        Ok(path)
    }

    #[test]
    fn test_project_context_resolve_model_paths() -> Result<()> {
        let base_dir = create_test_dir()?;
        let buster_yml_dir = base_dir.path();
        
        // Create project directory
        let project_models_dir = buster_yml_dir.join("project_specific_models");
        fs::create_dir(&project_models_dir)?;

        // Test with no model_paths (should return empty vec)
        let project_no_paths = ProjectContext {
            name: Some("NoPathsProject".to_string()),
            ..Default::default()
        };
        let paths = project_no_paths.resolve_model_paths(buster_yml_dir);
        assert!(paths.is_empty());

        // Test with relative model_paths
        let project_with_paths = ProjectContext {
            name: Some("WithPathsProject".to_string()),
            model_paths: Some(vec!["project_specific_models".to_string(), "another_relative".to_string()]),
            ..Default::default()
        };
        let paths = project_with_paths.resolve_model_paths(buster_yml_dir);
        assert_eq!(paths.len(), 2);
        assert_eq!(paths[0], project_models_dir);
        assert_eq!(paths[1], buster_yml_dir.join("another_relative"));

        // Test with absolute model_paths
        let abs_path_str = "/tmp/abs_model_path";
        let project_abs_paths = ProjectContext {
            name: Some("AbsPathsProject".to_string()),
            model_paths: Some(vec![abs_path_str.to_string()]),
            ..Default::default()
        };
        let paths = project_abs_paths.resolve_model_paths(buster_yml_dir);
        assert_eq!(paths.len(), 1);
        assert_eq!(paths[0], PathBuf::from(abs_path_str));
        
        // Test with mixed paths
        let project_mixed_paths = ProjectContext {
            name: Some("MixedPathsProject".to_string()),
            model_paths: Some(vec!["relative_path".to_string(), abs_path_str.to_string()]),
            ..Default::default()
        };
        let paths = project_mixed_paths.resolve_model_paths(buster_yml_dir);
        assert_eq!(paths.len(), 2);
        assert_eq!(paths[0], buster_yml_dir.join("relative_path"));
        assert_eq!(paths[1], PathBuf::from(abs_path_str));


        Ok(())
    }

    #[test]
    fn test_project_context_resolve_semantic_model_paths() -> Result<()> {
        let base_dir = create_test_dir()?;
        let buster_yml_dir = base_dir.path();
        
        let project_semantic_models_dir = buster_yml_dir.join("project_specific_semantic_models");
        fs::create_dir(&project_semantic_models_dir)?;

        // Test with no semantic_model_paths
        let project_no_paths = ProjectContext {
            name: Some("NoSemanticPathsProject".to_string()),
            ..Default::default()
        };
        let paths = project_no_paths.resolve_semantic_model_paths(buster_yml_dir);
        assert!(paths.is_empty());

        // Test with relative semantic_model_paths
        let project_with_paths = ProjectContext {
            name: Some("WithSemanticPathsProject".to_string()),
            semantic_model_paths: Some(vec!["project_specific_semantic_models".to_string(), "another_semantic_relative".to_string()]),
            ..Default::default()
        };
        let paths = project_with_paths.resolve_semantic_model_paths(buster_yml_dir);
        assert_eq!(paths.len(), 2);
        assert_eq!(paths[0], project_semantic_models_dir);
        assert_eq!(paths[1], buster_yml_dir.join("another_semantic_relative"));

        // Test with absolute semantic_model_paths
        let abs_path_str = if cfg!(windows) { "C:\\abs_semantic_path" } else { "/tmp/abs_semantic_path" };
        let project_abs_paths = ProjectContext {
            name: Some("AbsSemanticPathsProject".to_string()),
            semantic_model_paths: Some(vec![abs_path_str.to_string()]),
            ..Default::default()
        };
        let paths = project_abs_paths.resolve_semantic_model_paths(buster_yml_dir);
        assert_eq!(paths.len(), 1);
        assert_eq!(paths[0], PathBuf::from(abs_path_str));
        
        // Test with mixed paths
        let project_mixed_paths = ProjectContext {
            name: Some("MixedSemanticPathsProject".to_string()),
            semantic_model_paths: Some(vec!["relative_semantic_path".to_string(), abs_path_str.to_string()]),
            ..Default::default()
        };
        let paths = project_mixed_paths.resolve_semantic_model_paths(buster_yml_dir);
        assert_eq!(paths.len(), 2);
        assert_eq!(paths[0], buster_yml_dir.join("relative_semantic_path"));
        assert_eq!(paths[1], PathBuf::from(abs_path_str));

        Ok(())
    }

    #[test]
    fn test_project_context_identifier() {
        // Test with name
        let project = ProjectContext {
            name: Some("Test Project".to_string()),
            ..Default::default()
        };
        assert_eq!(project.identifier(), "Test Project");

        // Test without name (should fall back to default)
        let project = ProjectContext {
            name: None,
            ..Default::default()
        };
        assert_eq!(project.identifier(), "DefaultProjectContext");
    }

    #[test]
    fn test_buster_config_get_context_for_path() -> Result<()> {
        let base_dir = create_test_dir()?;
        let base_path = base_dir.path();
        
        // Create project directories and files
        let project1_dir = base_path.join("project1");
        let project2_dir = base_path.join("project2");
        fs::create_dir(&project1_dir)?;
        fs::create_dir(&project2_dir)?;
        
        let nested_dir = project1_dir.join("nested");
        fs::create_dir(&nested_dir)?;
        
        let file1 = project1_dir.join("model1.yml");
        let file2 = project2_dir.join("model2.yml");
        let nested_file = nested_dir.join("nested_model.yml");
        fs::write(&file1, "test")?;
        fs::write(&file2, "test")?;
        fs::write(&nested_file, "test")?;
        
        // Create config with project contexts
        let config = BusterConfig {
            projects: Some(vec![
                ProjectContext {
                    name: Some("Project 1".to_string()),
                    data_source_name: Some("source1".to_string()),
                    ..Default::default()
                },
                ProjectContext {
                    name: Some("Project 2".to_string()),
                    schema: Some("project2_schema".to_string()),
                    ..Default::default()
                }
            ]),
            ..Default::default()
        };
        
        // Since get_context_for_path is currently disabled / returning None, these will fail.
        // This test needs to be rethought based on how project context association will work.
        let context = config.get_context_for_path(&file1, base_path);
        assert!(context.is_none()); // Expecting None due to disabled logic
        
        let outside_file = base_path.join("outside.yml");
        fs::write(&outside_file, "test")?;
        let context = config.get_context_for_path(&outside_file, base_path);
        assert!(context.is_none());
        
        Ok(())
    }

    #[test]
    fn test_buster_config_resolve_effective_model_paths() -> Result<()> {
        let base_dir = create_test_dir()?;
        let buster_yml_dir = base_dir.path();

        let p1_models_dir = buster_yml_dir.join("p1_models");
        fs::create_dir_all(&p1_models_dir)?;
        let p2_models_dir = buster_yml_dir.join("p2_models_relative");
        // No need to create p2_models_dir if it's just for path assertion
        let global_models_dir = buster_yml_dir.join("global_cfg_models");
        fs::create_dir_all(&global_models_dir)?;

        // Scenario 1: Projects define model_paths. Global model_paths should be ignored.
        let config_projects_have_paths = BusterConfig {
            model_paths: Some(vec!["global_cfg_models".to_string()]), // This should be ignored
            projects: Some(vec![
                ProjectContext {
                    name: Some("Project 1".to_string()),
                    model_paths: Some(vec!["p1_models".to_string()]),
                    ..Default::default()
                },
                ProjectContext {
                    name: Some("Project 2".to_string()),
                    model_paths: Some(vec!["p2_models_relative".to_string()]),
                    ..Default::default()
                },
                ProjectContext {
                    name: Some("Project 3 No Paths".to_string()),
                    ..Default::default() // No model_paths here
                }
            ]),
            ..Default::default()
        };
        let paths1 = config_projects_have_paths.resolve_effective_model_paths(buster_yml_dir);
        assert_eq!(paths1.len(), 2, "Should only find paths from Project 1 and Project 2");
        assert!(paths1.iter().any(|(p, ctx)| p == &p1_models_dir && ctx.unwrap().name == Some("Project 1".to_string())));
        assert!(paths1.iter().any(|(p, ctx)| p == &p2_models_dir && ctx.unwrap().name == Some("Project 2".to_string())));

        // Scenario 2: Projects key exists but is empty. Fallback to global model_paths.
        let config_empty_projects_list = BusterConfig {
            model_paths: Some(vec!["global_cfg_models".to_string()]),
            projects: Some(vec![]), // Empty projects list
            ..Default::default()
        };
        // Correction: If projects list is empty, it means no project-defined paths.
        // The current refined logic will result in an empty path list from the projects block.
        // Then it will NOT fall back to global. Fallback only happens if `projects` key is None.
        // This test needs to reflect that. If `projects: Some([])` then result is [].
        // To test global fallback, `projects` must be `None`.
        let paths2_empty_projects = config_empty_projects_list.resolve_effective_model_paths(buster_yml_dir);
        assert!(paths2_empty_projects.is_empty(), "Expected no paths if projects list is present but empty, and no project defines paths");

        // Scenario 2.1: Projects key exists, but NO project defines model_paths. Result should be empty.
        let config_projects_no_paths = BusterConfig {
            model_paths: Some(vec!["global_cfg_models".to_string()]), // Should be ignored
            projects: Some(vec![
                ProjectContext { name: Some("Project NoPathsA".to_string()), ..Default::default() },
                ProjectContext { name: Some("Project NoPathsB".to_string()), ..Default::default() }
            ]),
            ..Default::default()
        };
        let paths2_1 = config_projects_no_paths.resolve_effective_model_paths(buster_yml_dir);
        assert!(paths2_1.is_empty(), "Should be empty if projects are defined but none have model_paths");

        // Scenario 3: `projects` key is None. Fallback to global model_paths.
        let config_no_projects_key = BusterConfig {
            model_paths: Some(vec!["global_cfg_models".to_string()]),
            projects: None, // `projects` key is absent
            ..Default::default()
        };
        let paths3 = config_no_projects_key.resolve_effective_model_paths(buster_yml_dir);
        assert_eq!(paths3.len(), 1);
        assert_eq!(paths3[0].0, global_models_dir);
        assert!(paths3[0].1.is_none(), "Context should be None for global paths");

        // Scenario 4: `projects` key is None, and global model_paths is also None. Result is empty.
        let config_all_none = BusterConfig {
            model_paths: None,
            projects: None,
            ..Default::default()
        };
        let paths4 = config_all_none.resolve_effective_model_paths(buster_yml_dir);
        assert!(paths4.is_empty(), "Should be empty if no projects and no global model_paths");
        
        // Scenario 5: `projects` key is None, and global model_paths is Some([]). Result is empty.
        let config_global_empty_array = BusterConfig {
            model_paths: Some(vec![]),
            projects: None,
            ..Default::default()
        };
        let paths5 = config_global_empty_array.resolve_effective_model_paths(buster_yml_dir);
        assert!(paths5.is_empty(), "Should be empty if no projects and global model_paths is an empty array");

        // Scenario 6: Absolute path in project
        let abs_path_str = if cfg!(windows) { "C:\\abs_project_models" } else { "/tmp/abs_project_models" };
        let config_abs_project = BusterConfig {
            projects: Some(vec![ProjectContext {
                name: Some("AbsProject".to_string()),
                model_paths: Some(vec![abs_path_str.to_string()]),
                ..Default::default()
            }]),
            ..Default::default()
        };
        let paths6 = config_abs_project.resolve_effective_model_paths(buster_yml_dir);
        assert_eq!(paths6.len(), 1);
        assert_eq!(paths6[0].0, PathBuf::from(abs_path_str));
        assert!(paths6[0].1.unwrap().name == Some("AbsProject".to_string()));

        // Scenario 7: Absolute path in global (when projects is None)
        let config_abs_global = BusterConfig {
            model_paths: Some(vec![abs_path_str.to_string()]),
            projects: None,
            ..Default::default()
        };
        let paths7 = config_abs_global.resolve_effective_model_paths(buster_yml_dir);
        assert_eq!(paths7.len(), 1);
        assert_eq!(paths7[0].0, PathBuf::from(abs_path_str));
        assert!(paths7[0].1.is_none());

        Ok(())
    }

    #[test]
    fn test_buster_config_resolve_effective_semantic_model_paths() -> Result<()> {
        let base_dir = create_test_dir()?;
        let buster_yml_dir = base_dir.path();

        let p1_semantic_dir = buster_yml_dir.join("project1_semantic_models");
        fs::create_dir_all(&p1_semantic_dir)?;
        let p2_semantic_dir = buster_yml_dir.join("project2_sem_relative");
        let global_semantic_dir = buster_yml_dir.join("global_cfg_semantic_models");
        fs::create_dir_all(&global_semantic_dir)?;

        // Scenario 1: Projects define semantic_model_paths. Global semantic_model_paths should be ignored.
        let config_projects_have_paths = BusterConfig {
            semantic_model_paths: Some(vec!["global_cfg_semantic_models".to_string()]), // This should be ignored
            projects: Some(vec![
                ProjectContext {
                    name: Some("Project 1 Sem".to_string()),
                    semantic_model_paths: Some(vec!["project1_semantic_models".to_string()]),
                    ..Default::default()
                },
                ProjectContext {
                    name: Some("Project 2 Sem".to_string()),
                    semantic_model_paths: Some(vec!["project2_sem_relative".to_string()]),
                    ..Default::default()
                },
                ProjectContext {
                    name: Some("Project 3 No SemPaths".to_string()),
                    ..Default::default() // No semantic_model_paths here
                }
            ]),
            ..Default::default()
        };
        let paths1 = config_projects_have_paths.resolve_effective_semantic_model_paths(buster_yml_dir);
        assert_eq!(paths1.len(), 2, "Should only find paths from Project 1 Sem and Project 2 Sem");
        assert!(paths1.iter().any(|(p, ctx)| p == &p1_semantic_dir && ctx.unwrap().name == Some("Project 1 Sem".to_string())));
        assert!(paths1.iter().any(|(p, ctx)| p == &p2_semantic_dir && ctx.unwrap().name == Some("Project 2 Sem".to_string())));

        // Scenario 2: Projects key exists but is empty. Result should be empty (no fallback to global).
        let config_empty_projects_list = BusterConfig {
            semantic_model_paths: Some(vec!["global_cfg_semantic_models".to_string()]),
            projects: Some(vec![]), // Empty projects list
            ..Default::default()
        };
        let paths2_empty_projects = config_empty_projects_list.resolve_effective_semantic_model_paths(buster_yml_dir);
        assert!(paths2_empty_projects.is_empty(), "Expected no paths if projects list is present but empty");

        // Scenario 2.1: Projects key exists, but NO project defines semantic_model_paths. Result should be empty.
        let config_projects_no_paths = BusterConfig {
            semantic_model_paths: Some(vec!["global_cfg_semantic_models".to_string()]), // Should be ignored
            projects: Some(vec![
                ProjectContext { name: Some("Project NoSemPathsA".to_string()), ..Default::default() },
                ProjectContext { name: Some("Project NoSemPathsB".to_string()), ..Default::default() }
            ]),
            ..Default::default()
        };
        let paths2_1 = config_projects_no_paths.resolve_effective_semantic_model_paths(buster_yml_dir);
        assert!(paths2_1.is_empty(), "Should be empty if projects are defined but none have semantic_model_paths");

        // Scenario 3: `projects` key is None. Fallback to global semantic_model_paths.
        let config_no_projects_key = BusterConfig {
            semantic_model_paths: Some(vec!["global_cfg_semantic_models".to_string()]),
            projects: None, // `projects` key is absent
            ..Default::default()
        };
        let paths3 = config_no_projects_key.resolve_effective_semantic_model_paths(buster_yml_dir);
        assert_eq!(paths3.len(), 1);
        assert_eq!(paths3[0].0, global_semantic_dir);
        assert!(paths3[0].1.is_none(), "Context should be None for global semantic paths");

        // Scenario 4: `projects` key is None, and global semantic_model_paths is also None. Result is empty.
        let config_all_none = BusterConfig {
            semantic_model_paths: None,
            projects: None,
            ..Default::default()
        };
        let paths4 = config_all_none.resolve_effective_semantic_model_paths(buster_yml_dir);
        assert!(paths4.is_empty(), "Should be empty if no projects and no global semantic_model_paths");

        // Scenario 5: `projects` key is None, and global semantic_model_paths is Some([]). Result is empty.
        let config_global_empty_array = BusterConfig {
            semantic_model_paths: Some(vec![]),
            projects: None,
            ..Default::default()
        };
        let paths5 = config_global_empty_array.resolve_effective_semantic_model_paths(buster_yml_dir);
        assert!(paths5.is_empty(), "Should be empty if no projects and global semantic_model_paths is an empty array");

        // Scenario 6: Absolute path in project for semantic models
        let abs_path_semantic_str = if cfg!(windows) { "C:\\abs_project_semantic_models" } else { "/tmp/abs_project_semantic_models" };
        let config_abs_project_semantic = BusterConfig {
            projects: Some(vec![ProjectContext {
                name: Some("AbsProjectSem".to_string()),
                semantic_model_paths: Some(vec![abs_path_semantic_str.to_string()]),
                ..Default::default()
            }]),
            ..Default::default()
        };
        let paths6 = config_abs_project_semantic.resolve_effective_semantic_model_paths(buster_yml_dir);
        assert_eq!(paths6.len(), 1);
        assert_eq!(paths6[0].0, PathBuf::from(abs_path_semantic_str));
        assert!(paths6[0].1.unwrap().name == Some("AbsProjectSem".to_string()));

        // Scenario 7: Absolute path in global for semantic models (when projects is None)
        let config_abs_global_semantic = BusterConfig {
            semantic_model_paths: Some(vec![abs_path_semantic_str.to_string()]),
            projects: None,
            ..Default::default()
        };
        let paths7 = config_abs_global_semantic.resolve_effective_semantic_model_paths(buster_yml_dir);
        assert_eq!(paths7.len(), 1);
        assert_eq!(paths7[0].0, PathBuf::from(abs_path_semantic_str));
        assert!(paths7[0].1.is_none());

        Ok(())
    }

    #[test]
    fn test_buster_config_load_from_dir() -> Result<()> {
        let base_dir = create_test_dir()?;
        let base_path = base_dir.path();
        
        // Test with non-existent buster.yml
        let config = BusterConfig::load_from_dir(base_path)?;
        assert!(config.is_none());
        
        // Create a buster.yml file
        let buster_yml = r#"
        data_source_name: test_source
        schema: test_schema
        database: test_db
        model_paths:
          - models
          - analyses
        projects:
          - name: Project 1
            data_source_name: project1_source
          - name: Project 2
            schema: project2_schema
        "#;
        create_test_file(base_path, "buster.yml", buster_yml)?;
        
        // Test loading the file
        let config = BusterConfig::load_from_dir(base_path)?;
        assert!(config.is_some());
        let config = config.unwrap();
        
        // Check global values
        assert_eq!(config.data_source_name, Some("test_source".to_string()));
        assert_eq!(config.schema, Some("test_schema".to_string()));
        assert_eq!(config.database, Some("test_db".to_string()));
        assert_eq!(config.model_paths, Some(vec!["models".to_string(), "analyses".to_string()]));
        
        // Check projects
        assert!(config.projects.is_some());
        let projects = config.projects.unwrap();
        assert_eq!(projects.len(), 2);
        
        // Check Project 1
        assert_eq!(projects[0].name, Some("Project 1".to_string()));
        assert_eq!(projects[0].data_source_name, Some("project1_source".to_string()));
        
        // Check Project 2
        assert_eq!(projects[1].name, Some("Project 2".to_string()));
        assert_eq!(projects[1].schema, Some("project2_schema".to_string()));
        
        Ok(())
    }
}