use anyhow::Result;
use std::fs;
use std::path::{Path, PathBuf};
use tempfile::TempDir;

// Import the crates from the buster CLI library
// The crate is actually called "buster-cli", but in tests we need to use the package name
use buster_cli::utils::config::{BusterConfig, ProjectContext};

/// Helper functions to create test directories and files
fn create_test_dir() -> Result<TempDir> {
    Ok(TempDir::new()?)
}

fn create_test_file(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
    let path = dir.join(name);
    fs::write(&path, content)?;
    Ok(path)
}

fn create_test_dir_with_files(dir: &Path, name: &str) -> Result<PathBuf> {
    let path = dir.join(name);
    fs::create_dir_all(&path)?;
    Ok(path)
}

#[tokio::test]
async fn test_project_based_model_discovery() -> Result<()> {
    // Create a temporary test directory structure
    let temp_dir = create_test_dir()?;
    let root_dir = temp_dir.path();
    
    // Create project directories
    let project1_dir = create_test_dir_with_files(root_dir, "project1")?;
    let project2_dir = create_test_dir_with_files(root_dir, "project2")?;
    let project1_models_dir = create_test_dir_with_files(&project1_dir, "models")?;
    
    // Create model files
    let model1 = r#"
    models:
      - name: project1_model
        description: "Project 1 Model"
        dimensions:
          - name: dimension1
            description: "Dimension 1"
            type: string
    "#;
    
    let model2 = r#"
    models:
      - name: project2_model
        description: "Project 2 Model"
        dimensions:
          - name: dimension2
            description: "Dimension 2"
            type: string
    "#;
    
    create_test_file(&project1_models_dir, "model1.yml", model1)?;
    create_test_file(&project2_dir, "model2.yml", model2)?;
    
    // Create buster.yml with projects configuration
    let buster_yml = r#"
    data_source_name: global_source
    schema: global_schema
    database: global_database
    
    projects:
      - name: Project 1
        path: project1
        model_paths:
          - models
        data_source_name: project1_source
        
      - name: Project 2
        path: project2
        schema: project2_schema
    "#;
    
    create_test_file(root_dir, "buster.yml", buster_yml)?;
    
    // Load the configuration
    let config = BusterConfig::load_from_dir(root_dir)?.expect("Failed to load buster.yml");
    
    // Test effective model paths resolution
    let effective_paths = config.resolve_effective_model_paths(root_dir);
    
    // Should have two paths: project1/models and project2
    assert_eq!(effective_paths.len(), 2);
    
    // First path should be project1/models with Project 1 context
    assert_eq!(effective_paths[0].0, project1_models_dir);
    assert!(effective_paths[0].1.is_some());
    let project1_context = effective_paths[0].1.unwrap();
    assert_eq!(project1_context.name, Some("Project 1".to_string()));
    assert_eq!(project1_context.data_source_name, Some("project1_source".to_string()));
    
    // Second path should be project2 with Project 2 context
    assert_eq!(effective_paths[1].0, project2_dir);
    assert!(effective_paths[1].1.is_some());
    let project2_context = effective_paths[1].1.unwrap();
    assert_eq!(project2_context.name, Some("Project 2".to_string()));
    assert_eq!(project2_context.schema, Some("project2_schema".to_string()));
    
    // Test configuration resolution for a model in project1
    let model1_path = project1_models_dir.join("model1.yml");
    let model1_context = config.get_context_for_path(&model1_path, root_dir);
    assert!(model1_context.is_some());
    let model1_context = model1_context.unwrap();
    
    // Model1 should inherit data_source_name from Project 1 context
    assert_eq!(model1_context.data_source_name, Some("project1_source".to_string()));
    
    // Model1 should inherit schema from global context
    assert_eq!(model1_context.schema, None); // Project1 doesn't override schema
    
    // Test configuration resolution for a model in project2
    let model2_path = project2_dir.join("model2.yml");
    let model2_context = config.get_context_for_path(&model2_path, root_dir);
    assert!(model2_context.is_some());
    let model2_context = model2_context.unwrap();
    
    // Model2 should inherit data_source_name from global context
    assert_eq!(model2_context.data_source_name, None); // Project2 doesn't override data_source_name
    
    // Model2 should inherit schema from Project 2 context
    assert_eq!(model2_context.schema, Some("project2_schema".to_string()));
    
    Ok(())
}

#[tokio::test]
async fn test_fallback_to_global_config() -> Result<()> {
    // Create a temporary test directory structure
    let temp_dir = create_test_dir()?;
    let root_dir = temp_dir.path();
    
    // Create model files in root
    let model = r#"
    models:
      - name: global_model
        description: "Global Model"
        dimensions:
          - name: dimension
            description: "Dimension"
            type: string
    "#;
    
    create_test_file(root_dir, "model.yml", model)?;
    
    // Create buster.yml with only global configuration (no projects)
    let buster_yml = r#"
    data_source_name: global_source
    schema: global_schema
    database: global_database
    model_paths:
      - .
    "#;
    
    create_test_file(root_dir, "buster.yml", buster_yml)?;
    
    // Load the configuration
    let config = BusterConfig::load_from_dir(root_dir)?.expect("Failed to load buster.yml");
    
    // Test effective model paths resolution
    let effective_paths = config.resolve_effective_model_paths(root_dir);
    
    // Should have one path: the root directory
    assert_eq!(effective_paths.len(), 1);
    assert_eq!(effective_paths[0].0, root_dir);
    assert!(effective_paths[0].1.is_none());
    
    // Test configuration resolution for the model
    let model_path = root_dir.join("model.yml");
    let model_context = config.get_context_for_path(&model_path, root_dir);
    assert!(model_context.is_none()); // No project context applies
    
    // But the global config is still available
    assert_eq!(config.data_source_name, Some("global_source".to_string()));
    assert_eq!(config.schema, Some("global_schema".to_string()));
    assert_eq!(config.database, Some("global_database".to_string()));
    
    Ok(())
}

#[tokio::test]
async fn test_nested_project_discovery() -> Result<()> {
    // Create a temporary test directory structure with nested projects
    let temp_dir = create_test_dir()?;
    let root_dir = temp_dir.path();
    
    // Create nested directories
    let outer_project_dir = create_test_dir_with_files(root_dir, "outer_project")?;
    let inner_project_dir = create_test_dir_with_files(&outer_project_dir, "inner_project")?;
    
    // Create model files
    let outer_model = r#"
    models:
      - name: outer_model
        description: "Outer Model"
        dimensions:
          - name: dimension
            description: "Dimension"
            type: string
    "#;
    
    let inner_model = r#"
    models:
      - name: inner_model
        description: "Inner Model"
        dimensions:
          - name: dimension
            description: "Dimension"
            type: string
    "#;
    
    create_test_file(&outer_project_dir, "outer_model.yml", outer_model)?;
    create_test_file(&inner_project_dir, "inner_model.yml", inner_model)?;
    
    // Create root buster.yml with nested projects
    let root_buster_yml = r#"
    data_source_name: root_source
    schema: root_schema
    
    projects:
      - name: Outer Project
        path: outer_project
        data_source_name: outer_source
    "#;
    
    // Create a nested buster.yml in the outer project
    let outer_buster_yml = r#"
    data_source_name: outer_source_override
    schema: outer_schema
    
    projects:
      - name: Inner Project
        path: inner_project
        schema: inner_schema
    "#;
    
    create_test_file(root_dir, "buster.yml", root_buster_yml)?;
    create_test_file(&outer_project_dir, "buster.yml", outer_buster_yml)?;
    
    // Test root config
    let root_config = BusterConfig::load_from_dir(root_dir)?.expect("Failed to load root buster.yml");
    let outer_config = BusterConfig::load_from_dir(&outer_project_dir)?.expect("Failed to load outer buster.yml");
    
    // Root config should have one project
    assert!(root_config.projects.is_some());
    assert_eq!(root_config.projects.as_ref().unwrap().len(), 1);
    assert_eq!(root_config.projects.as_ref().unwrap()[0].name, Some("Outer Project".to_string()));
    
    // Outer config should have one project
    assert!(outer_config.projects.is_some());
    assert_eq!(outer_config.projects.as_ref().unwrap().len(), 1);
    assert_eq!(outer_config.projects.as_ref().unwrap()[0].name, Some("Inner Project".to_string()));
    
    // Test root config effective paths
    let root_effective_paths = root_config.resolve_effective_model_paths(root_dir);
    assert_eq!(root_effective_paths.len(), 1);
    assert_eq!(root_effective_paths[0].0, outer_project_dir);
    
    // Test outer config effective paths
    let outer_effective_paths = outer_config.resolve_effective_model_paths(&outer_project_dir);
    assert_eq!(outer_effective_paths.len(), 1);
    assert_eq!(outer_effective_paths[0].0, inner_project_dir);
    
    Ok(())
}