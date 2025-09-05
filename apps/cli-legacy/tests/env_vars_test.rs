use anyhow::Result;
use std::fs;
use std::path::Path;
use tempfile::TempDir;

// Import from the buster CLI library
use buster_cli::commands::config_utils;

/// Test that update_arbitrary_env_vars correctly updates environment variables
#[tokio::test]
async fn test_update_arbitrary_env_vars_new_file() -> Result<()> {
    let temp_dir = TempDir::new()?;
    let env_file_path = temp_dir.path().join(".env");
    
    // Test data
    let env_vars = vec![
        ("DATABASE_URL".to_string(), "postgres://localhost:5432/testdb".to_string()),
        ("API_KEY".to_string(), "secret123".to_string()),
        ("DEBUG".to_string(), "true".to_string()),
    ];
    
    // Update env vars (should create new file)
    config_utils::update_arbitrary_env_vars(&env_file_path, &env_vars)?;
    
    // Verify file was created and contains correct content
    assert!(env_file_path.exists());
    let content = fs::read_to_string(&env_file_path)?;
    
    assert!(content.contains("DATABASE_URL=\"postgres://localhost:5432/testdb\""));
    assert!(content.contains("API_KEY=\"secret123\""));
    assert!(content.contains("DEBUG=\"true\""));
    
    Ok(())
}

#[tokio::test]
async fn test_update_arbitrary_env_vars_existing_file() -> Result<()> {
    let temp_dir = TempDir::new()?;
    let env_file_path = temp_dir.path().join(".env");
    
    // Create initial .env file
    let initial_content = r#"
# Existing configuration
EXISTING_VAR="keep_this"
OLD_API_KEY="old_secret"
DATABASE_URL="postgres://localhost:5432/olddb"
"#;
    fs::write(&env_file_path, initial_content)?;
    
    // Test data - some new, some updating existing
    let env_vars = vec![
        ("DATABASE_URL".to_string(), "postgres://localhost:5432/newdb".to_string()),
        ("NEW_VAR".to_string(), "new_value".to_string()),
        ("API_SECRET".to_string(), "super_secret".to_string()),
    ];
    
    // Update env vars
    config_utils::update_arbitrary_env_vars(&env_file_path, &env_vars)?;
    
    // Verify content
    let content = fs::read_to_string(&env_file_path)?;
    
    // Should preserve existing vars not being updated
    assert!(content.contains("EXISTING_VAR=\"keep_this\""));
    assert!(content.contains("OLD_API_KEY=\"old_secret\""));
    
    // Should update existing var
    assert!(content.contains("DATABASE_URL=\"postgres://localhost:5432/newdb\""));
    assert!(!content.contains("postgres://localhost:5432/olddb"));
    
    // Should add new vars
    assert!(content.contains("NEW_VAR=\"new_value\""));
    assert!(content.contains("API_SECRET=\"super_secret\""));
    
    Ok(())
}

#[tokio::test]
async fn test_update_arbitrary_env_vars_preserves_comments() -> Result<()> {
    let temp_dir = TempDir::new()?;
    let env_file_path = temp_dir.path().join(".env");
    
    // Create initial .env file with comments
    let initial_content = r#"# Database configuration
DATABASE_URL="postgres://localhost:5432/olddb"

# API configuration  
API_KEY="old_key"
# This is a comment that should be preserved
KEEP_THIS="unchanged"
"#;
    fs::write(&env_file_path, initial_content)?;
    
    // Update only one variable
    let env_vars = vec![
        ("API_KEY".to_string(), "new_key".to_string()),
    ];
    
    config_utils::update_arbitrary_env_vars(&env_file_path, &env_vars)?;
    
    let content = fs::read_to_string(&env_file_path)?;
    
    // Should preserve comments and other variables
    assert!(content.contains("# Database configuration"));
    assert!(content.contains("# API configuration"));
    assert!(content.contains("# This is a comment that should be preserved"));
    assert!(content.contains("DATABASE_URL=\"postgres://localhost:5432/olddb\""));
    assert!(content.contains("KEEP_THIS=\"unchanged\""));
    
    // Should update the target variable
    assert!(content.contains("API_KEY=\"new_key\""));
    assert!(!content.contains("API_KEY=\"old_key\""));
    
    Ok(())
}

#[tokio::test]
async fn test_update_arbitrary_env_vars_empty_list() -> Result<()> {
    let temp_dir = TempDir::new()?;
    let env_file_path = temp_dir.path().join(".env");
    
    // Create initial .env file
    let initial_content = "EXISTING_VAR=\"value\"\n";
    fs::write(&env_file_path, initial_content)?;
    
    // Update with empty list
    let env_vars = vec![];
    config_utils::update_arbitrary_env_vars(&env_file_path, &env_vars)?;
    
    // Should preserve existing content
    let content = fs::read_to_string(&env_file_path)?;
    assert_eq!(content, initial_content);
    
    Ok(())
}

#[tokio::test]
async fn test_update_arbitrary_env_vars_handles_special_characters() -> Result<()> {
    let temp_dir = TempDir::new()?;
    let env_file_path = temp_dir.path().join(".env");
    
    // Test data with special characters
    let env_vars = vec![
        ("URL_WITH_PARAMS".to_string(), "http://localhost:3000/api?key=value&other=123".to_string()),
        ("PASSWORD_WITH_SYMBOLS".to_string(), "p@ssw0rd!#$%^&*()".to_string()),
        ("JSON_CONFIG".to_string(), "{\"key\":\"value\",\"number\":42}".to_string()),
    ];
    
    config_utils::update_arbitrary_env_vars(&env_file_path, &env_vars)?;
    
    let content = fs::read_to_string(&env_file_path)?;
    
    // Verify special characters are preserved
    assert!(content.contains("URL_WITH_PARAMS=\"http://localhost:3000/api?key=value&other=123\""));
    assert!(content.contains("PASSWORD_WITH_SYMBOLS=\"p@ssw0rd!#$%^&*()\""));
    assert!(content.contains("JSON_CONFIG=\"{\"key\":\"value\",\"number\":42}\""));
    
    Ok(())
} 