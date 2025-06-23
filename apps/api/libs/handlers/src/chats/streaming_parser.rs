use agents::tools::categories::file_tools::common::generate_deterministic_uuid;
use anyhow::Result;
use serde_json::Value;
use serde::Deserialize;

use super::post_chat_handler::{
    BusterFile, BusterFileContent, BusterReasoningFile, BusterReasoningMessage, BusterReasoningText,
};

pub struct StreamingParser {
    buffer: String,
    yml_content_regex: regex::Regex,
}

impl Default for StreamingParser {
    fn default() -> Self {
        Self::new()
    }
}

impl StreamingParser {
    pub fn new() -> Self {
        StreamingParser {
            buffer: String::new(),
            yml_content_regex: regex::Regex::new(
                r#""yml_content":\s*"((?:[^"\\]|\\.|[\r\n])*?)(?:"|$)"#,
            )
            .unwrap(),
        }
    }

    // Clear the buffer - useful when reusing the parser for different content formats
    pub fn clear_buffer(&mut self) {
        self.buffer.clear();
    }

    // Process chunks meant for plan creation
    pub fn process_plan_chunk(
        &mut self,
        _id: String,
        chunk: &str,
    ) -> Option<String> {
        // Clear buffer and add new chunk
        self.clear_buffer();
        self.buffer.push_str(chunk);

        // Complete any incomplete JSON structure
        let processed_json = self.complete_json_structure(self.buffer.clone());

        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(&processed_json) {
            // Check if it's a plan structure (has 'plan' key)
            if let Some(plan_content) = value.get("plan").and_then(Value::as_str) {
                // Return the extracted plan string
                return Some(plan_content.to_string());
            }
        }

        None
    }

    // Process chunks meant for search data catalog
    pub fn process_search_data_catalog_chunk(
        &mut self,
        _id: String,
        _chunk: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        // We no longer process streaming search args here.
        // Logic moved to post_chat_handler on message completion.
        self.clear_buffer(); // Clear buffer in case it was used
        Ok(None) // Always return None during streaming for this tool now
    }

    // Process chunks meant for metric files
    pub fn process_metric_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Clear buffer and add new chunk
        self.clear_buffer();
        self.buffer.push_str(chunk);

        // Process the buffer with metric file type
        self.process_file_data(id.clone(), "metric".to_string())
    }

    // Process chunks meant for dashboard files
    pub fn process_dashboard_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Clear buffer and add new chunk
        self.clear_buffer();
        self.buffer.push_str(chunk);

        // Process the buffer with dashboard file type
        self.process_file_data(id.clone(), "dashboard".to_string())
    }

    // Internal function to process file data (shared by metric and dashboard processing)
    pub fn process_file_data(
        &mut self,
        id: String,
        file_type: String,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Extract and replace yml_content with placeholders
        let mut yml_contents = Vec::new();
        let mut positions = Vec::new();
        let mut processed_json = self.buffer.clone();

        // Find all yml_content matches and store them with their positions
        for captures in self.yml_content_regex.captures_iter(&self.buffer) {
            if let Some(content_match) = captures.get(1) {
                yml_contents.push(content_match.as_str().to_string());
                positions.push((
                    captures.get(0).unwrap().start(),
                    captures.get(0).unwrap().end(),
                ));
            }
        }

        // Sort positions from last to first to maintain correct indices when replacing
        let mut position_indices: Vec<usize> = (0..positions.len()).collect();
        position_indices.sort_by_key(|&i| std::cmp::Reverse(positions[i].0));

        // Replace matches with placeholders in reverse order
        for i in position_indices {
            let (start, end) = positions[i];
            let placeholder = format!(r#""yml_content":"YML_CONTENT_{i}""#);
            processed_json.replace_range(start..end, &placeholder);
        }

        // Complete any incomplete JSON structure
        processed_json = self.complete_json_structure(processed_json);

        // Try to parse the completed JSON
        if let Ok(mut value) = serde_json::from_str::<Value>(&processed_json) {
            // Put back the yml_content and process escapes first
            if let Some(obj) = value.as_object_mut() {
                if let Some(files) = obj.get_mut("files").and_then(|v| v.as_array_mut()) {
                    for (i, file) in files.iter_mut().enumerate() {
                        if let Some(file_obj) = file.as_object_mut() {
                            if let Some(yml_content) = yml_contents.get(i) {
                                // Process escaped characters
                                let processed_content =
                                    serde_json::from_str::<String>(&format!("\"{}\"", yml_content))
                                        .unwrap_or_else(|_| yml_content.clone());

                                file_obj.insert(
                                    "yml_content".to_string(),
                                    Value::String(processed_content),
                                );
                            }
                        }
                    }
                }
            }

            // Now check the structure after modifications
            return self.convert_file_to_message(id, value, file_type);
        }

        Ok(None)
    }

    // Helper method to complete JSON structure (shared functionality)
    fn complete_json_structure(&self, json: String) -> String {
        let mut processed = String::with_capacity(json.len());
        let mut nesting_stack = Vec::new();
        let mut in_string = false;
        let mut escape_next = false;

        // Process each character and track structure
        for c in json.chars() {
            processed.push(c);

            if escape_next {
                escape_next = false;
                continue;
            }

            match c {
                '\\' => escape_next = true,
                '"' if !escape_next => in_string = !in_string,
                '{' | '[' if !in_string => nesting_stack.push(c),
                '}' if !in_string => {
                    if nesting_stack.last() == Some(&'{') {
                        nesting_stack.pop();
                    }
                }
                ']' if !in_string => {
                    if nesting_stack.last() == Some(&'[') {
                        nesting_stack.pop();
                    }
                }
                _ => {}
            }
        }

        // Close any unclosed strings
        if in_string {
            processed.push('"');
        }

        // Close structures in reverse order of opening
        while let Some(c) = nesting_stack.pop() {
            match c {
                '{' => processed.push('}'),
                '[' => processed.push(']'),
                _ => {}
            }
        }

        processed
    }

    // Helper method to convert file JSON to message
    fn convert_file_to_message(
        &self,
        id: String,
        value: Value,
        file_type: String,
    ) -> Result<Option<BusterReasoningMessage>> {
        if let Some(files) = value.get("files").and_then(Value::as_array) {
            let mut files_map = std::collections::HashMap::new();
            let mut file_ids = Vec::new();
            let mut is_update_operation = false; // Flag to track if we found an 'id'

            for file in files {
                if let Some(file_obj) = file.as_object() {
                    let yml_content_opt = file_obj.get("yml_content").and_then(Value::as_str);
                    let id_opt = file_obj.get("id").and_then(Value::as_str);
                    let name_opt = file_obj.get("name").and_then(Value::as_str);

                    if let Some(yml_content) = yml_content_opt {
                        let file_id_str: String;
                        let file_name_str: String;

                        if let Some(provided_id_str) = id_opt {
                            // --- Update Operation --- 
                            is_update_operation = true; // Mark as update
                            file_id_str = provided_id_str.to_string();
                            // Name is not available during streaming for updates, use ID as placeholder
                            file_name_str = format!("{}...", provided_id_str.chars().take(8).collect::<String>());
                        } else if let Some(provided_name) = name_opt {
                            // --- Create Operation ---
                            // Generate deterministic UUID based on tool call ID, file name, and type
                            let generated_id = generate_deterministic_uuid(&id, provided_name, &file_type)?;
                            file_id_str = generated_id.to_string();
                            file_name_str = provided_name.to_string();
                        } else {
                            // Neither id nor name found, skip this file object
                            continue;
                        }

                        let buster_file = BusterFile {
                            id: file_id_str.clone(),
                            file_type: file_type.clone(),
                            file_name: file_name_str, // Use determined name (actual or placeholder)
                            version_number: 1, // Initial version for streaming, final message will have correct one
                            status: "loading".to_string(),
                            file: BusterFileContent {
                                text: None,
                                text_chunk: Some(yml_content.to_string()),
                                modifided: None,
                            },
                            metadata: None,
                        };

                        file_ids.push(file_id_str.clone());
                        files_map.insert(file_id_str, buster_file);
                    }
                }
            }

            if !files_map.is_empty() {
                // Determine title based on whether it was a create or update operation
                let title = if is_update_operation {
                    format!("Modifying {} files...", file_type)
                } else {
                    format!("Creating {} files...", file_type)
                };

                return Ok(Some(BusterReasoningMessage::File(BusterReasoningFile {
                    id, // Use the overall tool call ID
                    message_type: "files".to_string(),
                    title, // Use dynamic title
                    secondary_title: String::new(),
                    status: "loading".to_string(),
                    file_ids,
                    files: files_map,
                })));
            }
        }
        Ok(None)
    }

    // Process chunks meant for specific response tools like done, message_notify_user, etc.
    pub fn process_response_tool_chunk(
        &mut self,
        chunk: &str,
        argument_key: &str, // e.g., "text" or "final_response"
    ) -> Option<String> {
        // Clear buffer and add new chunk
        self.clear_buffer();
        self.buffer.push_str(chunk);

        // Complete any incomplete JSON structure
        let processed_json = self.complete_json_structure(self.buffer.clone());

        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(&processed_json) {
            // Check if it's an object and has the specified argument key
            if let Some(text_content) = value.get(argument_key).and_then(Value::as_str) {
                // Return the extracted text content
                return Some(text_content.to_string());
            }
        }

        // If parsing fails or structure doesn't match, return None
        None
    }
}
