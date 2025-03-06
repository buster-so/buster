#[cfg(test)]
mod tests {
    use super::*;
    use std::{fs, path::PathBuf};
    use tempfile::TempDir;

    // Helper function to create a temporary directory with test files
    fn setup_test_dir() -> (TempDir, PathBuf) {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().to_path_buf();
        
        // Create some test files
        fs::write(base_path.join("test1.sql"), "SELECT * FROM table1").unwrap();
        fs::write(base_path.join("test2.sql"), "SELECT * FROM table2 -- tags = ['test']").unwrap();
        fs::write(base_path.join("nested/test3.sql"), "SELECT * FROM table3").unwrap();
        
        // Create subdirectory
        fs::create_dir_all(base_path.join("nested")).unwrap();
        
        (temp_dir, base_path)
    }

    #[test]
    fn test_load_config() {
        let (temp_dir, base_path) = setup_test_dir();
        
        // Create buster.yml
        let config_content = r#"
        data_source_name: "test_source"
        schema: "test_schema"
        exclude_files:
          - "*.tmp"
          - "test*.sql"
        exclude_tags:
          - "test"
          - "temp"
        "#;
        
        fs::write(base_path.join("buster.yml"), config_content).unwrap();
        
        // Load config
        let config = BusterConfig::load_from_dir(&base_path).unwrap().unwrap();
        
        // Verify
        assert_eq!(config.data_source_name, Some("test_source".to_string()));
        assert_eq!(config.schema, Some("test_schema".to_string()));
        assert_eq!(config.exclude_files.unwrap().len(), 2);
        assert_eq!(config.exclude_tags.unwrap().len(), 2);
    }

    #[test]
    fn test_exclusion_by_pattern() {
        let (temp_dir, base_path) = setup_test_dir();
        
        // Create config with file exclusions
        let config = BusterConfig {
            data_source_name: Some("test".to_string()),
            schema: Some("test".to_string()),
            database: None,
            exclude_files: Some(vec!["test1.sql".to_string()]),
            exclude_tags: None,
        };
        
        let manager = ExclusionManager::new(&config).unwrap();
        
        // Test exclusion
        let (excluded, pattern) = manager.should_exclude_file(&base_path.join("test1.sql"), &base_path);
        assert!(excluded);
        assert_eq!(pattern.unwrap(), "test1.sql");
        
        // Test non-exclusion
        let (excluded, _) = manager.should_exclude_file(&base_path.join("test2.sql"), &base_path);
        assert!(!excluded);
    }

    #[test]
    fn test_exclusion_by_tag() {
        let (temp_dir, base_path) = setup_test_dir();
        
        // Create config with tag exclusions
        let config = BusterConfig {
            data_source_name: Some("test".to_string()),
            schema: Some("test".to_string()),
            database: None,
            exclude_files: None,
            exclude_tags: Some(vec!["test".to_string()]),
        };
        
        let manager = ExclusionManager::new(&config).unwrap();
        
        // Test exclusion
        let content = "SELECT * FROM table -- tags = ['test', 'production']";
        let (excluded, tag) = manager.should_exclude_by_tags(content);
        assert!(excluded);
        assert_eq!(tag.unwrap(), "test");
        
        // Test non-exclusion
        let content = "SELECT * FROM table -- tags = ['production']";
        let (excluded, _) = manager.should_exclude_by_tags(content);
        assert!(!excluded);
    }

    #[test]
    fn test_find_files_with_exclusions() {
        let (temp_dir, base_path) = setup_test_dir();
        
        // Create config with exclusions
        let config = BusterConfig {
            data_source_name: Some("test".to_string()),
            schema: Some("test".to_string()),
            database: None,
            exclude_files: Some(vec!["test1.sql".to_string()]),
            exclude_tags: None,
        };
        
        let manager = ExclusionManager::new(&config).unwrap();
        
        // Find SQL files
        let files = find_sql_files(&base_path, true, &manager).unwrap();
        
        // Should find test2.sql and nested/test3.sql, but not test1.sql
        assert_eq!(files.len(), 2);
        assert!(files.iter().any(|p| p.ends_with("test2.sql")));
        assert!(files.iter().any(|p| p.ends_with("test3.sql")));
        assert!(!files.iter().any(|p| p.ends_with("test1.sql")));
    }
} 