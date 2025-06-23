use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;

use crate::processor::Processor;
use crate::types::{File, FileContent, ProcessedOutput, ProcessorType, ReasoningFile};

/// Processor for metric files
pub struct CreateMetricsProcessor;

impl CreateMetricsProcessor {
    /// Creates a new MetricProcessor
    pub fn new() -> Self {
        CreateMetricsProcessor
    }

    /// Generate a deterministic UUID based on input parameters
    fn generate_deterministic_uuid(
        &self,
        base_id: &str,
        name: &str,
        file_type: &str,
    ) -> Result<Uuid> {
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
}

impl Processor for CreateMetricsProcessor {
    fn processor_type(&self) -> ProcessorType {
        ProcessorType::Metric
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

    fn process_with_context(
        &self,
        id: String,
        json: &str,
        previous_output: Option<ProcessedOutput>,
    ) -> Result<Option<ProcessedOutput>> {
        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            // Check if it's a metric file structure
            if let Some(files) = value.get("files").and_then(Value::as_array) {
                let mut files_map = HashMap::new();
                let mut file_ids = Vec::new();

                // Get the previously processed files
                let previous_files = if let Some(ProcessedOutput::File(output)) = &previous_output {
                    output.files.clone()
                } else {
                    HashMap::new()
                };

                // Process each file
                for file in files {
                    // Check if the file has a name and yml_content
                    if let (Some(name), Some(yml_content)) = (
                        file.get("name").and_then(Value::as_str),
                        file.get("yml_content").and_then(Value::as_str),
                    ) {
                        // Only process files that end with .yml
                        if name.ends_with(".yml") {
                            // Generate a deterministic UUID for this file
                            let file_id = self.generate_deterministic_uuid(&id, name, "metric")?;
                            let file_id_str = file_id.to_string();

                            // Get the previously processed content for this file
                            let previous_content =
                                if let Some(prev_file) = previous_files.get(&file_id_str) {
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

                            // Add the file to the output
                            files_map.insert(
                                file_id_str.clone(),
                                File {
                                    id: file_id_str.clone(),
                                    file_type: "metric".to_string(),
                                    file_name: name.to_string(),
                                    version_number: 1,
                                    status: "loading".to_string(),
                                    file: FileContent {
                                        text: None,
                                        text_chunk: if new_content.is_empty() {
                                            None
                                        } else {
                                            Some(new_content)
                                        },
                                        modified: None,
                                    },
                                    metadata: None,
                                },
                            );
                            file_ids.push(file_id_str);
                        }
                    }
                }

                // Only return the output if we have files
                if !file_ids.is_empty() {
                    return Ok(Some(ProcessedOutput::File(ReasoningFile {
                        id,
                        message_type: "files".to_string(),
                        title: "Creating metric files...".to_string(),
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
        Box::new(CreateMetricsProcessor::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ProcessedOutput;

    #[test]
    fn test_can_process() {
        let processor = CreateMetricsProcessor::new();

        // Test with valid metric data
        let json = r#"{"files":[{"name":"test_metric.yml","yml_content":"name: Test Metric\ndescription: A test metric"}]}"#;
        assert!(processor.can_process(json));

        // Test with invalid data (missing yml_content)
        let json = r#"{"files":[{"name":"test_metric.yml"}]}"#;
        assert!(!processor.can_process(json));

        // Test with invalid data (missing name)
        let json = r#"{"files":[{"yml_content":"name: Test Metric\ndescription: A test metric"}]}"#;
        assert!(!processor.can_process(json));

        // Test with invalid data (no files)
        let json = r#"{"other_key":"value"}"#;
        assert!(!processor.can_process(json));

        // Test with malformed JSON
        let json = r#"{"files":[{"name":"test_metric.yml","yml_content":"name: Test Metric"}"#;
        assert!(!processor.can_process(json));
    }

    #[test]
    fn test_process() {
        let processor = CreateMetricsProcessor::new();
        let id = "test_id".to_string();

        // Test with valid metric data
        let json = r#"{"files":[{"name":"test_metric.yml","yml_content":"name: Test Metric\ndescription: A test metric"}]}"#;
        let result = processor.process(id.clone(), json);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.is_some());

        if let Some(ProcessedOutput::File(file_output)) = output {
            assert_eq!(file_output.id, id);
            assert_eq!(file_output.title, "Creating metric files...");
            assert_eq!(file_output.files.len(), 1);

            // Check the first file
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file_name, "test_metric.yml");
            assert_eq!(file.file.text, None);
            assert_eq!(
                file.file.text_chunk,
                Some("name: Test Metric\ndescription: A test metric".to_string())
            );
        } else {
            panic!("Expected ProcessedOutput::File");
        }
    }

    #[test]
    fn test_process_with_context_streaming() {
        let processor = CreateMetricsProcessor::new();
        let id = "test_id".to_string();

        // First chunk
        let json1 = r#"{"files":[{"name":"test_metric.yml","yml_content":""}]}"#;
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
        let json2 = r#"{"files":[{"name":"test_metric.yml","yml_content":"name: Test Metric\n"}]}"#;
        let result2 = processor.process_with_context(id.clone(), json2, output1);
        assert!(result2.is_ok());
        let output2 = result2.unwrap();
        assert!(output2.is_some());

        if let Some(ProcessedOutput::File(file_output)) = &output2 {
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file.text, None);
            assert_eq!(
                file.file.text_chunk,
                Some("name: Test Metric\n".to_string())
            );
        } else {
            panic!("Expected ProcessedOutput::File");
        }

        // Third chunk
        let json3 = r#"{"files":[{"name":"test_metric.yml","yml_content":"name: Test Metric\ndescription: A test metric"}]}"#;
        let result3 = processor.process_with_context(id.clone(), json3, output2);
        assert!(result3.is_ok());
        let output3 = result3.unwrap();
        assert!(output3.is_some());

        if let Some(ProcessedOutput::File(file_output)) = &output3 {
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file.text, None);
            assert_eq!(
                file.file.text_chunk,
                Some("description: A test metric".to_string())
            );
        } else {
            panic!("Expected ProcessedOutput::File");
        }
    }
}
