use anyhow::{anyhow, Result};
use regex::Regex;
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;
use chrono::Utc;
use litellm::{LiteLlmMessage, ToolCall};

use crate::processor::ProcessorRegistry;
use crate::types::{
    File, FileContent, MessageType, ProcessedMessage, ProcessedOutput, 
    ReasoningFile, ReasoningText, ToolCallInfo, ToolCallState
};

/// StreamingParser handles parsing of incomplete JSON streams and LiteLlmMessage processing
pub struct StreamingParser {
    /// Buffer to accumulate chunks of data
    buffer: String,
    /// Registry of processors for different types of content
    processors: ProcessorRegistry,
    /// Regex for extracting YAML content
    yml_content_regex: Regex,
    /// Map of tool call IDs to their information
    tool_calls: HashMap<String, ToolCallInfo>,
    /// List of reasoning messages (tool calls and outputs)
    reasoning_messages: Vec<ProcessedMessage>,
    /// List of response messages
    response_messages: Vec<String>,
}

impl StreamingParser {
    /// Creates a new StreamingParser with an empty processor registry
    pub fn new() -> Self {
        StreamingParser {
            buffer: String::new(),
            processors: ProcessorRegistry::new(),
            yml_content_regex: Regex::new(r#""yml_content":\s*"((?:[^"\\]|\\.|[\r\n])*?)(?:"|$)"#)
                .unwrap(),
            tool_calls: HashMap::new(),
            reasoning_messages: Vec::new(),
            response_messages: Vec::new(),
        }
    }

    /// Creates a new StreamingParser with the provided processor registry
    pub fn with_processors(processors: ProcessorRegistry) -> Self {
        StreamingParser {
            buffer: String::new(),
            processors,
            yml_content_regex: Regex::new(r#""yml_content":\s*"((?:[^"\\]|\\.|[\r\n])*?)(?:"|$)"#)
                .unwrap(),
            tool_calls: HashMap::new(),
            reasoning_messages: Vec::new(),
            response_messages: Vec::new(),
        }
    }

    /// Registers a processor with the parser
    pub fn register_processor(&mut self, processor: Box<dyn crate::processor::Processor>) {
        self.processors.register(processor);
    }

    /// Registers a processor with a specific ID
    pub fn register_processor_with_id(
        &mut self,
        id: String,
        processor: Box<dyn crate::processor::Processor>,
    ) {
        self.processors.register_with_id(id, processor);
    }

    /// Clear the buffer - useful when reusing the parser for different content formats
    pub fn clear_buffer(&mut self) {
        self.buffer.clear();
    }

    /// Process a chunk of data with the specified processor type
    pub fn process_chunk(
        &mut self,
        id: String,
        chunk: &str,
        processor_type: &str,
    ) -> Result<Option<ProcessedOutput>> {
        // Get or create buffer for this ID
        let buffer = self.processors.get_chunk_buffer(&id).unwrap_or_default();
        let updated_buffer = buffer + chunk;

        println!("Updated buffer: {}", updated_buffer);

        // Store updated buffer
        self.processors
            .update_chunk_buffer(id.clone(), updated_buffer.clone());

        // Get the previously cached output, if any
        let previous_output = self.processors.get_cached_output(&id).cloned();

        println!("Previous output: {:#?}", previous_output);

        // Complete any incomplete JSON structure
        let processed_json = self.complete_json_structure(updated_buffer.clone());
        
        // If we don't have a processor registered with this ID yet, find one by type and register it
        if !self.processors.has_processor_with_id(&id) {
            for (_, (type_str, processor)) in self.processors.get_processors() {
                if type_str == processor_type && processor.can_process(&processed_json) {
                    // Clone the processor and register it with this ID
                    let processor_clone = processor.clone_box();
                    self.processors.register_with_id(id.clone(), processor_clone);
                    break;
                }
            }
        }

        // Process with the appropriate processor, passing the previous output
        let result = self
            .processors
            .process_by_id_with_context(id.clone(), &processed_json, processor_type, previous_output);

        println!("Result: {:#?}", result);

        // If processing succeeded, cache the result
        if let Ok(Some(output)) = &result {
            self.processors.cache_output(id, output.clone());
        }

        result
    }

    /// Process a LiteLlmMessage
    pub fn process_message(&mut self, message: &LiteLlmMessage) -> Result<Option<ProcessedOutput>> {
        match message {
            LiteLlmMessage::Assistant { tool_calls: Some(tool_calls), id, .. } => {
                self.process_assistant_tool_call(message, tool_calls, id.clone())
            },
            LiteLlmMessage::Assistant { content: Some(content), id, tool_calls: None, .. } => {
                self.process_assistant_response(message, content, id.clone())
            },
            LiteLlmMessage::Tool { content, tool_call_id, id, .. } => {
                self.process_tool_output(message, tool_call_id, content, id.clone())
            },
            _ => Ok(None), // Ignore other message types
        }
    }

    /// Process an Assistant message with tool calls
    fn process_assistant_tool_call(
        &mut self, 
        _message: &LiteLlmMessage, 
        tool_calls: &[ToolCall],
        id: Option<String>
    ) -> Result<Option<ProcessedOutput>> {
        for tool_call in tool_calls {
            let tool_id = tool_call.id.clone();
            let name = tool_call.function.name.clone();
            let arguments = tool_call.function.arguments.clone();
            
            // Parse arguments as JSON
            let input = serde_json::from_str::<Value>(&arguments)
                .unwrap_or_else(|_| serde_json::json!({"raw": arguments}));
            
            // Register or update tool call
            if let Some(existing_tool_call) = self.tool_calls.get_mut(&tool_id) {
                // Update existing tool call with new chunks
                existing_tool_call.chunks.push(arguments.clone());
                existing_tool_call.input = input.clone();
                if existing_tool_call.state == ToolCallState::InProgress {
                    existing_tool_call.state = ToolCallState::Complete;
                }
            } else {
                // Register new tool call
                self.tool_calls.insert(tool_id.clone(), ToolCallInfo {
                    id: tool_id.clone(),
                    name: name.clone(),
                    input: input.clone(),
                    output: None,
                    timestamp: Utc::now(),
                    state: ToolCallState::Complete,
                    chunks: vec![arguments.clone()],
                });
            }
            
            // Process with appropriate processor
            if let Some(processor) = self.processors.get_processor_for_tool(&name) {
                let processed = processor.process(tool_id.clone(), &serde_json::to_string(&input)?)?;
                
                if let Some(output) = processed.clone() {
                    // Store as reasoning message
                    self.add_reasoning_message(
                        tool_id.clone(), 
                        MessageType::AssistantToolCall, 
                        output.clone()
                    );
                    
                    return Ok(Some(output));
                }
            }
        }
        
        Ok(None)
    }

    /// Process an Assistant message with content (text response)
    fn process_assistant_response(
        &mut self, 
        _message: &LiteLlmMessage, 
        content: &str,
        id: Option<String>
    ) -> Result<Option<ProcessedOutput>> {
        // For response messages, we just store the text
        self.response_messages.push(content.to_string());
        
        // Create a simple processed output
        let processed = ProcessedOutput::Text(ReasoningText {
            id: id.clone().unwrap_or_else(|| Uuid::new_v4().to_string()),
            reasoning_type: "response".to_string(),
            title: "Assistant Response".to_string(),
            secondary_title: "".to_string(),
            message: Some(content.to_string()),
            message_chunk: None,
            status: Some("complete".to_string()),
        });
        
        // Add to reasoning messages
        self.add_reasoning_message(
            id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            MessageType::AssistantResponse,
            processed.clone()
        );
        
        Ok(Some(processed))
    }

    /// Process a Tool message (output from executed tool call)
    fn process_tool_output(
        &mut self, 
        _message: &LiteLlmMessage, 
        tool_call_id: &str, 
        content: &str,
        _id: Option<String>
    ) -> Result<Option<ProcessedOutput>> {
        // Parse content as JSON if possible
        let output = serde_json::from_str::<Value>(content)
            .unwrap_or_else(|_| serde_json::json!({"text": content}));
        
        // Update tool call with output
        if let Some(tool_call) = self.tool_calls.get_mut(tool_call_id) {
            tool_call.output = Some(output.clone());
            tool_call.state = ToolCallState::HasOutput;
            
            // Get the tool name
            let name = tool_call.name.clone();
            
            // Process with appropriate processor
            if self.processors.has_processor_for_tool(&name) {
                if let Ok(Some(processed)) = self.processors.process_with_tool(
                    &name,
                    tool_call_id.to_string(),
                    &serde_json::to_string(&output)?
                ) {
                    // Store as reasoning message
                    self.add_reasoning_message(
                        tool_call_id.to_string(), 
                        MessageType::ToolOutput, 
                        processed.clone()
                    );
                    
                    return Ok(Some(processed));
                }
            }
        }
        
        Ok(None)
    }

    /// Gets the cached output for the given ID
    pub fn get_cached_output(&self, id: &str) -> Option<&ProcessedOutput> {
        self.processors.get_cached_output(id)
    }

    /// Caches the output for the given ID
    pub fn cache_output(&mut self, id: String, output: ProcessedOutput) {
        self.processors.cache_output(id, output);
    }

    /// Clears the cache for the given ID
    pub fn clear_cache(&mut self, id: &str) {
        self.processors.clear_cache(id);
    }

    /// Clears all caches
    pub fn clear_all_caches(&mut self) {
        self.processors.clear_all_caches();
    }

    /// Clears the chunk buffer for the given ID
    pub fn clear_chunk_buffer(&mut self, id: &str) {
        self.processors.clear_chunk_buffer(id);
    }

    /// Process YAML content in JSON
    pub fn process_yml_content(&self, json: String) -> String {
        // Extract and replace yml_content with placeholders
        let mut yml_contents = Vec::new();
        let mut positions = Vec::new();
        let mut processed_json = json.clone();

        // Find all yml_content matches and store them with their positions
        for captures in self.yml_content_regex.captures_iter(&json) {
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
            // Put back the yml_content and process escapes
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

            // Return the JSON as a string
            if let Ok(json_str) = serde_json::to_string(&value) {
                return json_str;
            }
        }

        // If we couldn't parse the JSON, return the processed JSON as is
        processed_json
    }

    /// Process file data for metric and dashboard files
    pub fn process_file_data(
        &mut self,
        id: String,
        file_type: String,
        json: &str,
    ) -> Result<Option<ProcessedOutput>> {
        // Process the chunk with the appropriate processor type
        if !json.is_empty() {
            self.buffer.push_str(json);
        }

        // Complete any incomplete JSON structure
        let processed_json = self.complete_json_structure(self.buffer.clone());

        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(&processed_json) {
            return self.convert_file_to_message(id, value, file_type);
        }

        // If we can't parse the JSON, try to process it with the appropriate processor type
        self.process_chunk(id, "", &file_type)
    }

    /// Helper method to convert file JSON to message
    pub fn convert_file_to_message(
        &self,
        id: String,
        value: Value,
        file_type: String,
    ) -> Result<Option<ProcessedOutput>> {
        // Check if we have a files array
        if let Some(obj) = value.as_object() {
            if let Some(files) = obj.get("files").and_then(|v| v.as_array()) {
                let mut file_ids = Vec::new();
                let mut file_map = HashMap::new();

                // Process each file in the array
                for file_value in files {
                    if let Some(file_obj) = file_value.as_object() {
                        // Extract file properties
                        let file_id = file_obj
                            .get("id")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default()
                            .to_string();
                        let file_name = file_obj
                            .get("name")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default()
                            .to_string();
                        let yml_content = file_obj
                            .get("yml_content")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default()
                            .to_string();

                        // Create file content
                        let file_content = FileContent {
                            text: Some(yml_content),
                            text_chunk: None,
                            modified: None,
                        };

                        // Create file
                        let file = File {
                            id: file_id.clone(),
                            file_type: file_type.clone(),
                            file_name: file_name.clone(),
                            version_number: 1,
                            status: "completed".to_string(),
                            file: file_content,
                            metadata: Some(vec![]),
                        };

                        // Add to file map and IDs
                        file_ids.push(file_id.clone());
                        file_map.insert(file_id, file);
                    }
                }

                // If we have files, create a ReasoningFile
                if !file_map.is_empty() {
                    let title = format!("Created {} {} files", file_map.len(), file_type);
                    let reasoning_file = ReasoningFile {
                        id,
                        message_type: "files".to_string(),
                        title,
                        secondary_title: "".to_string(),
                        status: "completed".to_string(),
                        file_ids,
                        files: file_map,
                    };

                    return Ok(Some(ProcessedOutput::File(reasoning_file)));
                }
            }
        }

        Ok(None)
    }

    /// Generate a deterministic UUID based on input parameters
    fn generate_deterministic_uuid(
        &self,
        id: &str,
        file_name: &str,
        file_type: &str,
    ) -> Result<Uuid> {
        use sha2::{Digest, Sha256};
        use uuid::Uuid;

        // Create a deterministic string to hash
        let combined = format!("{}:{}:{}", id, file_name, file_type);

        // Hash the combined string
        let mut hasher = Sha256::new();
        hasher.update(combined.as_bytes());
        let result = hasher.finalize();

        // Convert the first 16 bytes of the hash to a UUID
        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&result[0..16]);

        Ok(Uuid::from_bytes(bytes))
    }

    /// Completes any incomplete JSON structure by adding missing closing brackets
    fn complete_json_structure(&self, json: String) -> String {
        let mut stack = Vec::new();
        let mut in_string = false;
        let mut escape_next = false;

        for c in json.chars() {
            if escape_next {
                escape_next = false;
                continue;
            }

            match c {
                '\\' if in_string => escape_next = true,
                '"' => in_string = !in_string,
                '{' | '[' if !in_string => stack.push(c),
                '}' if !in_string => {
                    if let Some('{') = stack.last() {
                        stack.pop();
                    }
                }
                ']' if !in_string => {
                    if let Some('[') = stack.last() {
                        stack.pop();
                    }
                }
                _ => {}
            }
        }

        // If we have an incomplete JSON, add the missing closing brackets
        let mut completed_json = json;
        while let Some(c) = stack.pop() {
            match c {
                '{' => completed_json.push('}'),
                '[' => completed_json.push(']'),
                _ => {}
            }
        }

        completed_json
    }

    /// Adds a reasoning message
    fn add_reasoning_message(&mut self, id: String, message_type: MessageType, content: ProcessedOutput) {
        self.reasoning_messages.push(ProcessedMessage {
            id,
            message_type,
            content,
            timestamp: Utc::now(),
        });
    }

    /// Gets all reasoning messages
    pub fn get_reasoning_messages(&self) -> &[ProcessedMessage] {
        &self.reasoning_messages
    }
    
    /// Gets all response messages
    pub fn get_response_messages(&self) -> &[String] {
        &self.response_messages
    }
    
    /// Gets all tool calls
    pub fn get_tool_calls(&self) -> &HashMap<String, ToolCallInfo> {
        &self.tool_calls
    }
    
    /// Gets a specific tool call by ID
    pub fn get_tool_call(&self, id: &str) -> Option<&ToolCallInfo> {
        self.tool_calls.get(id)
    }
    
    /// Registers a processor for a specific tool
    pub fn register_tool_processor(&mut self, name: &str, processor: Box<dyn crate::processor::Processor>) {
        self.processors.register_tool_processor(name, processor);
    }

    /// Process a streaming chunk for a tool call
    pub fn process_tool_call_chunk(
        &mut self,
        tool_id: &str,
        tool_name: &str,
        chunk: &str
    ) -> Result<Option<ProcessedOutput>> {
        // Update or create tool call info
        if let Some(tool_call) = self.tool_calls.get_mut(tool_id) {
            // Update existing tool call
            tool_call.chunks.push(chunk.to_string());
            
            // Update chunk buffer
            self.processors.update_tool_chunk_buffer(tool_id, chunk);
            
            // Get the complete buffer - clone it to end the immutable borrow
            let buffer = match self.processors.get_tool_chunk_buffer(tool_id) {
                Some(buffer) => buffer.clone(),
                None => return Ok(None),
            };
            
            // Try to parse as JSON
            if let Ok(input) = serde_json::from_str::<Value>(&buffer) {
                // Update the tool call input
                tool_call.input = input.clone();
                
                // Check if we have a processor for this tool - store result to end immutable borrow
                let has_processor = self.processors.has_processor_for_tool(tool_name);
                
                // Process with appropriate processor
                if has_processor {
                    if let Ok(Some(processed)) = self.processors.process_and_cache_tool_output(
                        tool_name,
                        tool_id.to_string(),
                        &buffer
                    ) {
                        // Update the tool call state
                        tool_call.state = ToolCallState::Complete;
                        
                        // Store as reasoning message
                        self.add_reasoning_message(
                            tool_id.to_string(),
                            MessageType::AssistantToolCall,
                            processed.clone()
                        );
                        
                        return Ok(Some(processed));
                    }
                }
            }
        } else {
            // Create new tool call
            self.tool_calls.insert(tool_id.to_string(), ToolCallInfo {
                id: tool_id.to_string(),
                name: tool_name.to_string(),
                input: serde_json::json!({}),
                output: None,
                timestamp: Utc::now(),
                state: ToolCallState::InProgress,
                chunks: vec![chunk.to_string()],
            });
            
            // Initialize chunk buffer
            self.processors.update_tool_chunk_buffer(tool_id, chunk);
        }
        
        Ok(None)
    }
    
    /// Process a streaming chunk for a tool output
    pub fn process_tool_output_chunk(
        &mut self,
        tool_id: &str,
        chunk: &str
    ) -> Result<Option<ProcessedOutput>> {
        // Update chunk buffer
        self.processors.update_tool_chunk_buffer(tool_id, chunk);
        
        // Get the tool call
        if let Some(tool_call) = self.tool_calls.get_mut(tool_id) {
            // Get the tool name
            let tool_name = tool_call.name.clone();
            
            // Get the complete buffer - clone it to end the immutable borrow
            let buffer = match self.processors.get_tool_chunk_buffer(tool_id) {
                Some(buffer_ref) => buffer_ref.clone(),
                None => return Ok(None),
            };
            
            // Try to parse as JSON
            let output = serde_json::from_str::<Value>(&buffer)
                .unwrap_or_else(|_| serde_json::json!({"text": buffer.clone()}));
            
            // Update the tool call output
            tool_call.output = Some(output.clone());
            tool_call.state = ToolCallState::HasOutput;
            
            // Process with appropriate processor
            if self.processors.has_processor_for_tool(&tool_name) {
                // Get previous output if available
                let previous_output = self.processors.get_cached_output(tool_id).cloned();
                
                if let Ok(Some(processed)) = self.processors.process_and_cache_tool_output_with_context(
                    &tool_name,
                    tool_id.to_string(),
                    &buffer,
                    previous_output
                ) {
                    // Store as reasoning message
                    self.add_reasoning_message(
                        tool_id.to_string(),
                        MessageType::ToolOutput,
                        processed.clone()
                    );
                    
                    return Ok(Some(processed));
                }
            }
        }
        
        Ok(None)
    }
    
    /// Process a streaming chunk for an assistant response
    pub fn process_response_chunk(
        &mut self,
        id: &str,
        chunk: &str
    ) -> Result<Option<ProcessedOutput>> {
        // Update chunk buffer
        self.processors.update_chunk_buffer(id.to_string(), chunk.to_string());
        
        // Get the complete buffer
        if let Some(buffer) = self.processors.get_chunk_buffer(id) {
            // Add to response messages if not already present
            if !self.response_messages.contains(&buffer) {
                self.response_messages.push(buffer.clone());
            }
            
            // Create a simple processed output
            let processed = ProcessedOutput::Text(ReasoningText {
                id: id.to_string(),
                reasoning_type: "response".to_string(),
                title: "Assistant Response".to_string(),
                secondary_title: "".to_string(),
                message: Some(buffer),
                message_chunk: Some(chunk.to_string()),
                status: Some("streaming".to_string()),
            });
            
            // Add to reasoning messages
            self.add_reasoning_message(
                id.to_string(),
                MessageType::AssistantResponse,
                processed.clone()
            );
            
            return Ok(Some(processed));
        }
        
        Ok(None)
    }

    /// Clears all tool calls and their associated data
    pub fn clear_tool_calls(&mut self) {
        self.tool_calls.clear();
        self.reasoning_messages.retain(|msg| {
            msg.message_type != MessageType::AssistantToolCall && 
            msg.message_type != MessageType::ToolOutput
        });
    }
    
    /// Clears a specific tool call and its associated data
    pub fn clear_tool_call(&mut self, tool_id: &str) {
        self.tool_calls.remove(tool_id);
        self.reasoning_messages.retain(|msg| msg.id != tool_id);
        self.processors.clear_tool_chunk_buffer(tool_id);
        self.processors.clear_cache(tool_id);
    }
    
    /// Gets all tool calls that are in the specified state
    pub fn get_tool_calls_by_state(&self, state: ToolCallState) -> Vec<&ToolCallInfo> {
        self.tool_calls
            .values()
            .filter(|call| call.state == state)
            .collect()
    }
    
    /// Gets all completed tool calls (those with state Complete or HasOutput)
    pub fn get_completed_tool_calls(&self) -> Vec<&ToolCallInfo> {
        self.tool_calls
            .values()
            .filter(|call| call.state == ToolCallState::Complete || call.state == ToolCallState::HasOutput)
            .collect()
    }
    
    /// Gets all tool calls for a specific tool name
    pub fn get_tool_calls_by_name(&self, name: &str) -> Vec<&ToolCallInfo> {
        self.tool_calls
            .values()
            .filter(|call| call.name == name)
            .collect()
    }
    
    /// Gets the most recent tool call for a specific tool name
    pub fn get_latest_tool_call_by_name(&self, name: &str) -> Option<&ToolCallInfo> {
        self.tool_calls
            .values()
            .filter(|call| call.name == name)
            .max_by_key(|call| call.timestamp)
    }
    
    /// Gets the reasoning messages for a specific tool call
    pub fn get_reasoning_messages_for_tool(&self, tool_id: &str) -> Vec<&ProcessedMessage> {
        self.reasoning_messages
            .iter()
            .filter(|msg| msg.id == tool_id)
            .collect()
    }
    
    /// Gets the combined input and output for a specific tool call
    pub fn get_tool_call_with_output(&self, tool_id: &str) -> Option<(Value, Option<Value>)> {
        self.tool_calls.get(tool_id).map(|call| (call.input.clone(), call.output.clone()))
    }
    
    /// Exports all tool calls and their outputs as a JSON object
    pub fn export_tool_calls_as_json(&self) -> Value {
        let mut result = serde_json::json!({});
        
        for (id, call) in &self.tool_calls {
            let mut call_data = serde_json::json!({
                "name": call.name,
                "input": call.input,
                "state": match call.state {
                    ToolCallState::InProgress => "in_progress",
                    ToolCallState::Complete => "complete",
                    ToolCallState::HasOutput => "has_output",
                },
                "timestamp": call.timestamp.to_rfc3339(),
            });
            
            if let Some(output) = &call.output {
                call_data["output"] = output.clone();
            }
            
            result[id] = call_data;
        }
        
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::processor::Processor;
    use crate::types::{ProcessorType, ReasoningText};

    struct TestProcessor;

    impl Processor for TestProcessor {
        fn processor_type(&self) -> ProcessorType {
            ProcessorType::Custom("test".to_string())
        }

        fn can_process(&self, _json: &str) -> bool {
            true
        }

        fn process(&self, id: String, json: &str) -> Result<Option<ProcessedOutput>> {
            Ok(Some(ProcessedOutput::Text(ReasoningText {
                id,
                reasoning_type: "text".to_string(),
                title: "Test".to_string(),
                secondary_title: "".to_string(),
                message: Some(json.to_string()),
                message_chunk: None,
                status: Some("completed".to_string()),
            })))
        }

        fn process_with_context(&self, id: String, json: &str, previous_output: Option<ProcessedOutput>) -> Result<Option<ProcessedOutput>> {
            // Get the previously processed content
            let previous_content = if let Some(ProcessedOutput::Text(text)) = previous_output {
                text.message.clone().unwrap_or_default()
            } else {
                String::new()
            };
            
            // Calculate the new content (what wasn't in the previous content)
            let new_content = if json.len() > previous_content.len() {
                json[previous_content.len()..].to_string()
            } else {
                // If for some reason the new content is shorter, just use the whole thing
                json.to_string()
            };
            
            Ok(Some(ProcessedOutput::Text(ReasoningText {
                id,
                reasoning_type: "text".to_string(),
                title: "Test".to_string(),
                secondary_title: "".to_string(),
                message: Some(json.to_string()),
                message_chunk: if new_content.is_empty() { None } else { Some(new_content) },
                status: Some("loading".to_string()),
            })))
        }
        
        fn clone_box(&self) -> Box<dyn Processor> {
            Box::new(TestProcessor)
        }
    }

    struct MockProcessor {
        processor_type: ProcessorType,
    }

    impl Processor for MockProcessor {
        fn processor_type(&self) -> ProcessorType {
            self.processor_type.clone()
        }

        fn can_process(&self, _json: &str) -> bool {
            true
        }

        fn process(&self, id: String, _json: &str) -> Result<Option<ProcessedOutput>> {
            Ok(Some(ProcessedOutput::Text(ReasoningText {
                id,
                reasoning_type: "text".to_string(),
                title: "Mock".to_string(),
                secondary_title: "".to_string(),
                message: Some("Mock message".to_string()),
                message_chunk: None,
                status: Some("completed".to_string()),
            })))
        }

        fn process_with_context(
            &self,
            id: String,
            _json: &str,
            _previous_output: Option<ProcessedOutput>,
        ) -> Result<Option<ProcessedOutput>> {
            Ok(Some(ProcessedOutput::Text(ReasoningText {
                id,
                reasoning_type: "text".to_string(),
                title: "Mock".to_string(),
                secondary_title: "".to_string(),
                message: Some("Mock message".to_string()),
                message_chunk: None,
                status: Some("completed".to_string()),
            })))
        }
        
        fn clone_box(&self) -> Box<dyn Processor> {
            Box::new(MockProcessor {
                processor_type: self.processor_type.clone(),
            })
        }
    }

    #[test]
    fn test_streaming_parser_process_chunk() {
        let mut parser = StreamingParser::new();
        parser.register_processor(Box::new(TestProcessor));

        // Process a chunk
        let result = parser.process_chunk("id1".to_string(), r#"{"test": "value"}"#, "test");
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());
    }

    #[test]
    fn test_streaming_parser_caching() {
        let mut parser = StreamingParser::new();
        parser.register_processor(Box::new(TestProcessor));

        // Process a chunk
        let id = "cache_test_id".to_string();
        let result = parser.process_chunk(id.clone(), r#"{"test": "value"}"#, "test");
        assert!(result.is_ok());
        let output = result.unwrap().unwrap();

        // Cache the output
        parser.cache_output(id.clone(), output.clone());

        // Check if cached
        let cached = parser.get_cached_output(&id);
        assert!(cached.is_some());
        assert_eq!(cached.unwrap(), &output);
    }

    #[test]
    fn test_streaming_parser_multiple_ids() {
        let mut parser = StreamingParser::new();
        parser.register_processor(Box::new(TestProcessor));

        // Process with first ID
        let result1 = parser.process_chunk("id1".to_string(), r#"{"test": "value1"}"#, "test");
        assert!(result1.is_ok());
        let output1 = result1.unwrap().unwrap();

        // Process with second ID
        let result2 = parser.process_chunk("id2".to_string(), r#"{"test": "value2"}"#, "test");
        assert!(result2.is_ok());
        let output2 = result2.unwrap().unwrap();

        // Verify they have different content
        match (output1, output2) {
            (ProcessedOutput::Text(text1), ProcessedOutput::Text(text2)) => {
                assert_eq!(text1.id, "id1");
                assert_eq!(text2.id, "id2");
                assert_ne!(text1.message, text2.message);
            }
            _ => panic!("Expected Text outputs"),
        }
    }

    #[test]
    fn test_streaming_parser_incomplete_json() {
        let mut parser = StreamingParser::new();
        parser.register_processor(Box::new(TestProcessor));

        // Process incomplete JSON
        let id = "incomplete_json_id".to_string();
        let result = parser.process_chunk(id.clone(), r#"{"test": "value"#, "test");

        // The TestProcessor should process this and include the chunk
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.is_some());
        
        // Verify the output has the correct chunk
        if let Some(ProcessedOutput::Text(text)) = output {
            assert_eq!(text.message, Some(r#"{"test": "value}"#.to_string()));
            assert_eq!(text.message_chunk, Some(r#"{"test": "value}"#.to_string()));
        } else {
            panic!("Expected ProcessedOutput::Text");
        }
        
        // Complete the JSON
        let result = parser.process_chunk(id.clone(), r#"}"#, "test");
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.is_some());
        
        // Verify the output has the correct chunk - should only contain the new part
        if let Some(ProcessedOutput::Text(text)) = output {
            assert_eq!(text.message, Some(r#"{"test": "value}}"#.to_string()));
            assert_eq!(text.message_chunk, Some(r#"}"#.to_string()));
        } else {
            panic!("Expected ProcessedOutput::Text");
        }

        // Check the cached output
        let cached = parser.get_cached_output(&id);
        assert!(cached.is_some());
    }
}
