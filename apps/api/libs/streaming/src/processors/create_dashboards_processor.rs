use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;
use database::models::MetricFileToDashboardFile;
use database::pool::get_pg_pool;
use database::schema::metric_files_to_dashboard_files;
use database::types::dashboard_yml::DashboardYml;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use chrono::Utc;

use crate::processor::Processor;
use crate::types::{File, FileContent, ProcessedOutput, ProcessorType, ReasoningFile};

/// Processor for dashboard files
pub struct CreateDashboardsProcessor;

impl CreateDashboardsProcessor {
    /// Creates a new DashboardProcessor
    pub fn new() -> Self {
        CreateDashboardsProcessor
    }

    /// Generate a deterministic UUID based on input parameters
    fn generate_deterministic_uuid(&self, base_id: &str, name: &str, file_type: &str) -> Result<Uuid> {
        use sha2::{Digest, Sha256};
        
        // Create a deterministic string by combining the inputs
        let combined = format!("{}:{}:{}", base_id, name, file_type);
        
        // Hash the combined string
        let mut hasher = Sha256::new();
        hasher.update(combined.as_bytes());
        let result = hasher.finalize();
        
        // Use the first 16 bytes of the hash as the UUID
        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&result[0..16]);
        
        Ok(Uuid::from_bytes(bytes))
    }
    
    /// Extract metric IDs from dashboard YAML content
    fn extract_metric_ids_from_yaml(&self, yaml_content: &str) -> Result<Vec<Uuid>> {
        // Parse the YAML into DashboardYml
        let dashboard: DashboardYml = serde_yaml::from_str(yaml_content)?;
        
        let mut metric_ids = Vec::new();
        
        // Iterate through all rows and collect metric IDs
        for row in &dashboard.rows {
            for item in &row.items {
                metric_ids.push(item.id);
            }
        }
        
        Ok(metric_ids)
    }
    
    /// Create associations between a dashboard and its metrics
    async fn create_dashboard_metric_associations(
        &self,
        dashboard_id: &Uuid,
        yaml_content: &str,
        user_id: Uuid,
    ) -> Result<()> {
        // Extract metric IDs from the dashboard YAML
        let metric_ids = match self.extract_metric_ids_from_yaml(yaml_content) {
            Ok(ids) => ids,
            Err(_) => return Ok(()), // If we can't parse the YAML, just skip creating associations
        };
        
        if metric_ids.is_empty() {
            return Ok(());
        }
        
        // Get database connection
        let pool = get_pg_pool();
        let mut conn = match pool.get().await {
            Ok(conn) => conn,
            Err(_) => return Ok(()), // If we can't get a connection, just skip creating associations
        };
        
        // For each metric ID, create an association if the metric exists
        for metric_id in metric_ids {
            // Check if the metric exists
            let metric_exists = diesel::dsl::select(
                diesel::dsl::exists(
                    database::schema::metric_files::table
                        .filter(database::schema::metric_files::id.eq(metric_id))
                        .filter(database::schema::metric_files::deleted_at.is_null())
                )
            )
            .get_result::<bool>(&mut conn)
            .await;
            
            // Skip if metric doesn't exist
            if let Ok(exists) = metric_exists {
                if !exists {
                    continue;
                }
            } else {
                continue;
            }
            
            // Create the association
            match diesel::insert_into(metric_files_to_dashboard_files::table)
                .values((
                    metric_files_to_dashboard_files::dashboard_file_id.eq(dashboard_id),
                    metric_files_to_dashboard_files::metric_file_id.eq(metric_id),
                    metric_files_to_dashboard_files::created_at.eq(Utc::now()),
                    metric_files_to_dashboard_files::updated_at.eq(Utc::now()),
                    metric_files_to_dashboard_files::created_by.eq(user_id),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => (), // Association created successfully
                Err(_) => continue, // Skip if there's an error (e.g., association already exists)
            }
        }
        
        Ok(())
    }
}

impl Processor for CreateDashboardsProcessor {
    fn processor_type(&self) -> ProcessorType {
        ProcessorType::Dashboard
    }

    fn can_process(&self, json: &str) -> bool {
        // Check if the JSON contains files array
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            if let Some(files) = value.get("files").and_then(Value::as_array) {
                // Check if at least one file has name and yml_content
                return files.iter().any(|file| {
                    if let Some(file_obj) = file.as_object() {
                        file_obj.get("name").is_some() && file_obj.get("yml_content").is_some()
                    } else {
                        false
                    }
                });
            }
        }
        false
    }

    fn process(&self, id: String, json: &str) -> Result<Option<ProcessedOutput>> {
        self.process_with_context(id, json, None)
    }

    fn process_with_context(&self, id: String, json: &str, previous_output: Option<ProcessedOutput>) -> Result<Option<ProcessedOutput>> {
        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            // Check if it's a dashboard file structure
            if let Some(files) = value.get("files").and_then(Value::as_array) {
                let mut files_map = HashMap::new();
                let mut file_ids = Vec::new();

                // Get previous files if they exist
                let previous_files = if let Some(ProcessedOutput::File(file_output)) = &previous_output {
                    &file_output.files
                } else {
                    &HashMap::new()
                };

                for file in files {
                    if let Some(file_obj) = file.as_object() {
                        let has_name = file_obj.get("name").and_then(Value::as_str).is_some();
                        let has_yml_content = file_obj.get("yml_content").is_some();

                        if has_name && has_yml_content {
                            let name = file_obj.get("name").and_then(Value::as_str).unwrap_or("");
                            let yml_content = file_obj
                                .get("yml_content")
                                .and_then(Value::as_str)
                                .unwrap_or("");

                            // Generate deterministic UUID based on tool call ID, file name, and type
                            let file_id = self.generate_deterministic_uuid(&id, name, "dashboard")?;
                            let file_id_str = file_id.to_string();

                            // Get the previously processed content for this file
                            let previous_content = if let Some(prev_file) = previous_files.get(&file_id_str) {
                                prev_file.file.text_chunk.clone().unwrap_or_default()
                            } else {
                                String::new()
                            };

                            // Calculate the new content (what wasn't in the previous content)
                            let new_content = if yml_content.len() > previous_content.len() {
                                yml_content[previous_content.len()..].to_string()
                            } else {
                                // If for some reason the new content is shorter, just use the whole thing
                                yml_content.to_string()
                            };

                            let file = File {
                                id: file_id_str.clone(),
                                file_type: "dashboard".to_string(),
                                file_name: name.to_string(),
                                version_number: 1,
                                status: "loading".to_string(),
                                file: FileContent {
                                    text: None,
                                    text_chunk: if new_content.is_empty() { None } else { Some(new_content) },
                                    modified: None,
                                },
                                metadata: None,
                            };

                            file_ids.push(file_id_str.clone());
                            files_map.insert(file_id_str.clone(), file);
                            
                            // Try to create metric associations - use tokio::spawn to do this asynchronously
                            // so we don't block the dashboard creation process
                            let file_id_uuid = file_id;
                            let yml_content_clone = yml_content.to_string();
                            
                            // Attempt to parse creator_id from metadata if available
                            let user_id = file_obj
                                .get("metadata")
                                .and_then(|m| m.get("user_id"))
                                .and_then(|u| u.as_str())
                                .and_then(|s| Uuid::parse_str(s).ok())
                                .unwrap_or_else(|| Uuid::nil());
                                
                            tokio::spawn(async move {
                                let processor = CreateDashboardsProcessor::new();
                                let _ = processor.create_dashboard_metric_associations(
                                    &file_id_uuid,
                                    &yml_content_clone,
                                    user_id
                                ).await;
                            });
                        }
                    }
                }

                if !files_map.is_empty() {
                    return Ok(Some(ProcessedOutput::File(ReasoningFile {
                        id,
                        message_type: "files".to_string(),
                        title: "Creating dashboard files...".to_string(),
                        secondary_title: String::new(),
                        status: "loading".to_string(),
                        file_ids,
                        files: files_map,
                    })));
                }
            }
        }

        Ok(None)
    }

    fn clone_box(&self) -> Box<dyn Processor> {
        Box::new(CreateDashboardsProcessor::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ProcessedOutput;

    #[test]
    fn test_can_process() {
        let processor = CreateDashboardsProcessor::new();

        // Test with valid dashboard data
        let json = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard\ndescription: A test dashboard"}]}"#;
        assert!(processor.can_process(json));

        // Test with invalid data (missing yml_content)
        let json = r#"{"files":[{"name":"test_dashboard.yml"}]}"#;
        assert!(!processor.can_process(json));

        // Test with invalid data (missing name)
        let json = r#"{"files":[{"yml_content":"name: Test Dashboard\ndescription: A test dashboard"}]}"#;
        assert!(!processor.can_process(json));

        // Test with invalid data (no files)
        let json = r#"{"other_key":"value"}"#;
        assert!(!processor.can_process(json));

        // Test with malformed JSON
        let json = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard"}"#;
        assert!(!processor.can_process(json));
    }
    
    #[test]
    fn test_extract_metric_ids_from_yaml() {
        let processor = CreateDashboardsProcessor::new();
        
        // Create a test YAML with known metric IDs
        let yaml_content = r#"
name: Test Dashboard
description: A test dashboard
rows:
  - items:
      - id: 00000000-0000-0000-0000-000000000001
      - id: 00000000-0000-0000-0000-000000000002
    rowHeight: 400
    columnSizes: [6, 6]
    id: 1
  - items:
      - id: 00000000-0000-0000-0000-000000000003
    rowHeight: 300
    columnSizes: [12]
    id: 2
"#;
        
        // Extract metric IDs
        let result = processor.extract_metric_ids_from_yaml(yaml_content);
        assert!(result.is_ok());
        
        let metric_ids = result.unwrap();
        
        // Verify the expected IDs are extracted
        assert_eq!(metric_ids.len(), 3);
        
        let uuid1 = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
        let uuid2 = Uuid::parse_str("00000000-0000-0000-0000-000000000002").unwrap();
        let uuid3 = Uuid::parse_str("00000000-0000-0000-0000-000000000003").unwrap();
        
        assert!(metric_ids.contains(&uuid1));
        assert!(metric_ids.contains(&uuid2));
        assert!(metric_ids.contains(&uuid3));
    }
    
    #[test]
    fn test_extract_metric_ids_from_invalid_yaml() {
        let processor = CreateDashboardsProcessor::new();
        
        // Test with invalid YAML
        let invalid_yaml = "this is not valid YAML";
        let result = processor.extract_metric_ids_from_yaml(invalid_yaml);
        assert!(result.is_err());
        
        // Test with valid YAML but missing items
        let yaml_without_items = r#"
name: Test Dashboard
description: A test dashboard
rows:
  - rowHeight: 400
    columnSizes: [6, 6]
    id: 1
"#;
        let result = processor.extract_metric_ids_from_yaml(yaml_without_items);
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn test_process() {
        let processor = CreateDashboardsProcessor::new();
        let id = "test_id".to_string();

        // Test with valid dashboard data
        let json = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard\ndescription: A test dashboard"}]}"#;
        let result = processor.process(id.clone(), json);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.is_some());

        if let Some(ProcessedOutput::File(file_output)) = output {
            assert_eq!(file_output.id, id);
            assert_eq!(file_output.title, "Creating dashboard files...");
            assert_eq!(file_output.files.len(), 1);
            
            // Check the first file
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file_name, "test_dashboard.yml");
            assert_eq!(file.file.text, None);
            assert_eq!(file.file.text_chunk, Some("name: Test Dashboard\ndescription: A test dashboard".to_string()));
        } else {
            panic!("Expected ProcessedOutput::File");
        }
    }

    #[test]
    fn test_process_with_context_streaming() {
        let processor = CreateDashboardsProcessor::new();
        let id = "test_id".to_string();

        // First chunk
        let json1 = r#"{"files":[{"name":"test_dashboard.yml","yml_content":""}]}"#;
        let result1 = processor.process_with_context(id.clone(), json1, None);
        assert!(result1.is_ok());
        let output1 = result1.unwrap();
        assert!(output1.is_some());

        if let Some(ProcessedOutput::File(file_output)) = &output1 {
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file.text, None);
            assert_eq!(file.file.text_chunk, None); // Empty string, so no chunk
        } else {
            panic!("Expected ProcessedOutput::File");
        }

        // Second chunk
        let json2 = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard\n"}]}"#;
        let result2 = processor.process_with_context(id.clone(), json2, output1);
        assert!(result2.is_ok());
        let output2 = result2.unwrap();
        assert!(output2.is_some());

        if let Some(ProcessedOutput::File(file_output)) = &output2 {
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file.text, None);
            assert_eq!(file.file.text_chunk, Some("name: Test Dashboard\n".to_string()));
        } else {
            panic!("Expected ProcessedOutput::File");
        }

        // Third chunk
        let json3 = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard\ndescription: A test dashboard"}]}"#;
        let result3 = processor.process_with_context(id.clone(), json3, output2);
        assert!(result3.is_ok());
        let output3 = result3.unwrap();
        assert!(output3.is_some());

        if let Some(ProcessedOutput::File(file_output)) = &output3 {
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file.text, None);
            assert_eq!(file.file.text_chunk, Some("description: A test dashboard".to_string()));
        } else {
            panic!("Expected ProcessedOutput::File");
        }
    }
}
