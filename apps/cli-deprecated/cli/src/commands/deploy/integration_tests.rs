use anyhow::Result;
use super::*;
use std::{fs, path::{Path, PathBuf}};
use tempfile::TempDir;
use tokio::runtime::Runtime;

// Helper function to create a temporary directory with test files
fn setup_test_dir() -> Result<TempDir> {
    let temp_dir = TempDir::new()?;
    Ok(temp_dir)
}

// Helper to create a test YAML file
fn create_test_yaml(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
    let path = dir.join(name);
    fs::write(&path, content)?;
    Ok(path)
}

// Helper to create a test SQL file
fn create_test_sql(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
    let path = dir.join(name);
    fs::write(&path, content)?;
    Ok(path)
}

#[test]
fn test_deploy_with_valid_project() -> Result<()> {
    let rt = Runtime::new()?;
    let temp_dir = setup_test_dir()?;
    
    // Create buster.yml
    let buster_yml = r#"
data_source_name: "test_source"
schema: "test_schema"
database: "test_db"
    "#;
    create_test_yaml(temp_dir.path(), "buster.yml", buster_yml)?;
    
    // Create a valid model file
    let model_yml = r#"
name: test_model
description: "Test model"
dimensions:
  - name: dim1
    description: "First dimension"
    type: "string"
measures:
  - name: measure1
    description: "First measure"
    type: "number"
    "#;
    create_test_yaml(temp_dir.path(), "test_model.yml", model_yml)?;
    
    // Test dry run
    let result = rt.block_on(deploy(Some(temp_dir.path().to_str().unwrap()), true, false));
    assert!(result.is_ok());
    
    Ok(())
}

#[test]
fn test_deploy_with_project_structure() -> Result<()> {
    let rt = Runtime::new()?;
    let temp_dir = setup_test_dir()?;
    
    // Create main buster.yml with projects structure
    let main_buster_yml = r#"
data_source_name: "default_source"
schema: "default_schema"
database: "default_db"
projects:
  - name: "Project 1"
    path: "project1"
    data_source_name: "project1_source"
  - name: "Project 2"
    path: "project2"
    schema: "project2_schema"
    "#;
    create_test_yaml(temp_dir.path(), "buster.yml", main_buster_yml)?;
    
    // Create project directories
    let proj1_dir = temp_dir.path().join("project1");
    let proj2_dir = temp_dir.path().join("project2");
    fs::create_dir(&proj1_dir)?;
    fs::create_dir(&proj2_dir)?;
    
    // Create model files in each project
    let model1_yml = r#"
name: model1
description: "Model in Project 1"
dimensions:
  - name: dim1
    description: "Dimension 1"
    type: "string"
schema: "model1_schema"
    "#;
    create_test_yaml(&proj1_dir, "model1.yml", model1_yml)?;
    
    let model2_yml = r#"
name: model2
description: "Model in Project 2"
dimensions:
  - name: dim2
    description: "Dimension 2"
    type: "number"
database: "model2_db"
    "#;
    create_test_yaml(&proj2_dir, "model2.yml", model2_yml)?;
    
    // Test dry run
    let result = rt.block_on(deploy(Some(temp_dir.path().to_str().unwrap()), true, true));
    assert!(result.is_ok());
    
    Ok(())
}

#[test]
fn test_deploy_with_missing_config() -> Result<()> {
    let rt = Runtime::new()?;
    let temp_dir = setup_test_dir()?;
    
    // Create a model file without required configurations
    let model_yml = r#"
name: incomplete_model
description: "Model missing configuration"
dimensions:
  - name: dim1
    description: "Dimension 1"
    type: "string"
    "#;
    create_test_yaml(temp_dir.path(), "incomplete_model.yml", model_yml)?;
    
    // Test dry run - should fail due to missing configurations
    let result = rt.block_on(deploy(Some(temp_dir.path().to_str().unwrap()), true, false));
    assert!(result.is_err());
    
    Ok(())
}