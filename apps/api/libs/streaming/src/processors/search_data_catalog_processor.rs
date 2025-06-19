use anyhow::Result;
use serde_json::Value;

use crate::processor::Processor;
use crate::types::{ProcessedOutput, ProcessorType, ReasoningText};

/// Processor for search data catalog
pub struct SearchDataCatalogProcessor;

impl SearchDataCatalogProcessor {
    /// Creates a new SearchProcessor
    pub fn new() -> Self {
        SearchDataCatalogProcessor
    }
}

impl Processor for SearchDataCatalogProcessor {
    fn processor_type(&self) -> ProcessorType {
        ProcessorType::SearchDataCatalog
    }

    fn can_process(&self, json: &str) -> bool {
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            return value.get("search_requirements").is_some();
        }
        false
    }

    fn process(&self, id: String, json: &str) -> Result<Option<ProcessedOutput>> {
        self.process_with_context(id, json, None)
    }

    fn process_with_context(&self, id: String, json: &str, previous_output: Option<ProcessedOutput>) -> Result<Option<ProcessedOutput>> {
        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            // Check if it's a search requirements structure
            if let Some(search_requirements) = value.get("search_requirements").and_then(Value::as_str) {
                // Get the previously processed content
                let previous_content = if let Some(ProcessedOutput::Text(text)) = previous_output {
                    text.message_chunk.clone().unwrap_or_default()
                } else {
                    String::new()
                };
                
                // Calculate the new content (what wasn't in the previous content)
                let new_content = if search_requirements.len() > previous_content.len() {
                    search_requirements[previous_content.len()..].to_string()
                } else {
                    // If for some reason the new content is shorter, just use the whole thing
                    search_requirements.to_string()
                };
                
                // Return the search requirements as a ReasoningText
                return Ok(Some(ProcessedOutput::Text(ReasoningText {
                    id,
                    reasoning_type: "text".to_string(),
                    title: "Searching your data catalog...".to_string(),
                    secondary_title: String::from(""),
                    message: None,
                    message_chunk: if new_content.is_empty() { None } else { Some(new_content) },
                    status: Some("loading".to_string()),
                })));
            }
        }

        Ok(None)
    }

    fn clone_box(&self) -> Box<dyn Processor> {
        Box::new(SearchDataCatalogProcessor::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ProcessedOutput;

    #[test]
    fn test_can_process() {
        let processor = SearchDataCatalogProcessor::new();

        // Test with valid search data
        let json = r#"{"search_requirements":"Find data about sales"}"#;
        assert!(processor.can_process(json));

        // Test with invalid data
        let json = r#"{"other_key":"value"}"#;
        assert!(!processor.can_process(json));

        // Test with malformed JSON
        let json = r#"{"search_requirements":"Find data about sales"#;
        assert!(!processor.can_process(json));
    }

    #[test]
    fn test_process() {
        let processor = SearchDataCatalogProcessor::new();
        let id = "test_id".to_string();

        // Test with valid search data
        let json = r#"{"search_requirements":"Find data about sales"}"#;
        let result = processor.process(id.clone(), json);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.is_some());

        if let Some(ProcessedOutput::Text(text)) = output {
            assert_eq!(text.message, None);
            assert_eq!(text.message_chunk, Some("Find data about sales".to_string()));
        } else {
            panic!("Expected ProcessedOutput::Text");
        }
    }

    #[test]
    fn test_process_with_context_streaming() {
        let processor = SearchDataCatalogProcessor::new();
        let id = "test_id".to_string();

        // First chunk
        let json1 = r#"{"search_requirements":""}"#;
        let result1 = processor.process_with_context(id.clone(), json1, None);
        assert!(result1.is_ok());
        let output1 = result1.unwrap();
        assert!(output1.is_some());

        if let Some(ProcessedOutput::Text(text)) = &output1 {
            assert_eq!(text.message, None);
            assert_eq!(text.message_chunk, None); // Empty string, so no chunk
        } else {
            panic!("Expected ProcessedOutput::Text");
        }

        // Second chunk
        let json2 = r#"{"search_requirements":"Find data "}"#;
        let result2 = processor.process_with_context(id.clone(), json2, output1);
        assert!(result2.is_ok());
        let output2 = result2.unwrap();
        assert!(output2.is_some());

        if let Some(ProcessedOutput::Text(text)) = &output2 {
            assert_eq!(text.message, None);
            assert_eq!(text.message_chunk, Some("Find data ".to_string()));
        } else {
            panic!("Expected ProcessedOutput::Text");
        }

        // Third chunk
        let json3 = r#"{"search_requirements":"Find data about sales"}"#;
        let result3 = processor.process_with_context(id.clone(), json3, output2);
        assert!(result3.is_ok());
        let output3 = result3.unwrap();
        assert!(output3.is_some());

        if let Some(ProcessedOutput::Text(text)) = &output3 {
            assert_eq!(text.message, None);
            assert_eq!(text.message_chunk, Some("about sales".to_string()));
        } else {
            panic!("Expected ProcessedOutput::Text");
        }
    }
}
