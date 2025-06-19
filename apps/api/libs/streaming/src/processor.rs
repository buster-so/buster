use anyhow::Result;
use std::collections::HashMap;

use crate::types::{ProcessedOutput, ProcessorType};

/// Trait defining the interface for streaming processors
pub trait Processor: Send + Sync {
    /// Returns the type of processor
    fn processor_type(&self) -> ProcessorType;

    /// Checks if this processor can handle the given JSON data
    fn can_process(&self, json: &str) -> bool;

    /// Processes the JSON data and returns a processed output
    fn process(&self, id: String, json: &str) -> Result<Option<ProcessedOutput>>;

    /// Processes the JSON data with context from a previous output and returns a processed output
    fn process_with_context(
        &self,
        id: String,
        json: &str,
        previous_output: Option<ProcessedOutput>,
    ) -> Result<Option<ProcessedOutput>> {
        // Default implementation just calls process without using the context
        self.process(id, json)
    }

    /// Creates a clone of this processor
    fn clone_box(&self) -> Box<dyn Processor>;
}

/// Registry for managing processors
pub struct ProcessorRegistry {
    processors: HashMap<String, (String, Box<dyn Processor>)>, // (id, (type, processor))
    tool_processors: HashMap<String, Box<dyn Processor>>,      // (tool_name, processor)
    output_cache: HashMap<String, ProcessedOutput>,            // (id, output)
    chunk_buffers: HashMap<String, String>,                    // (id, buffer)
}

impl ProcessorRegistry {
    /// Creates a new processor registry
    pub fn new() -> Self {
        ProcessorRegistry {
            processors: HashMap::new(),
            tool_processors: HashMap::new(),
            output_cache: HashMap::new(),
            chunk_buffers: HashMap::new(),
        }
    }

    /// Registers a processor
    pub fn register(&mut self, processor: Box<dyn Processor>) {
        let processor_type = processor.processor_type().as_str().to_string();
        self.processors
            .insert(processor_type.clone(), (processor_type, processor));
    }

    /// Registers a processor with a specific ID
    pub fn register_with_id(&mut self, id: String, processor: Box<dyn Processor>) {
        let processor_type = processor.processor_type().as_str().to_string();
        self.processors.insert(id, (processor_type, processor));
    }

    /// Registers a processor for a specific tool
    pub fn register_tool_processor(&mut self, tool_name: &str, processor: Box<dyn Processor>) {
        self.tool_processors.insert(tool_name.to_string(), processor);
    }

    /// Returns true if the registry has a processor for the given type
    pub fn has_processor(&self, processor_type: &str) -> bool {
        self.processors
            .values()
            .any(|(type_str, _)| type_str == processor_type)
    }

    /// Returns true if the registry has a processor for the given ID
    pub fn has_processor_with_id(&self, id: &str) -> bool {
        self.processors.contains_key(id)
    }

    /// Returns true if the registry has a processor for the given tool
    pub fn has_processor_for_tool(&self, tool_name: &str) -> bool {
        self.tool_processors.contains_key(tool_name)
    }

    /// Returns a reference to all processors
    pub fn get_processors(&self) -> &HashMap<String, (String, Box<dyn Processor>)> {
        &self.processors
    }

    /// Returns a processor for a specific tool
    pub fn get_processor_for_tool(&self, tool_name: &str) -> Option<&Box<dyn Processor>> {
        self.tool_processors.get(tool_name)
    }

    /// Processes the given JSON with the appropriate processor
    pub fn process(
        &self,
        id: String,
        json: &str,
        processor_type: &str,
    ) -> Result<Option<ProcessedOutput>> {
        // Check if we have a processor registered with this ID
        if let Some((_, processor)) = self.processors.get(&id) {
            if processor.can_process(json) {
                return processor.process(id, json);
            }
        }

        // If not, find a processor by type
        for (_, (type_str, processor)) in &self.processors {
            if type_str == processor_type && processor.can_process(json) {
                // Create a new processor instance with this ID for future use
                let result = processor.process(id.clone(), json);
                return result;
            }
        }

        Ok(None)
    }

    /// Processes the given JSON with the processor registered with the given ID
    pub fn process_by_id(
        &self,
        id: String,
        json: &str,
        processor_type: &str,
    ) -> Result<Option<ProcessedOutput>> {
        // Check if we have a processor registered with this ID
        if let Some((_, processor)) = self.processors.get(&id) {
            if processor.can_process(json) {
                return processor.process(id, json);
            }
        }

        // If not, find a processor by type and register it with this ID
        for (_, (type_str, processor)) in &self.processors {
            if type_str == processor_type && processor.can_process(json) {
                return processor.process(id, json);
            }
        }

        Ok(None)
    }

    /// Process a JSON string with a processor by ID and processor type, providing previous output context
    pub fn process_by_id_with_context(
        &self,
        id: String,
        json: &str,
        processor_type: &str,
        previous_output: Option<ProcessedOutput>,
    ) -> Result<Option<ProcessedOutput>> {
        println!("Processor ID: {}", id);
        // Check if we have a processor registered with this ID
        if let Some((_, processor)) = self.processors.get(&id) {
            println!("Processor exists");
            return processor.process_with_context(id, json, previous_output);
        }

        // If not, find a processor by type and register it with this ID
        for (_, (type_str, processor)) in &self.processors {
            if type_str == processor_type && processor.can_process(json) {
                println!("Processor does not exist");
                return processor.process_with_context(id, json, previous_output);
            }
        }

        Ok(None)
    }

    /// Process a JSON string with a processor for a specific tool
    pub fn process_with_tool(
        &self,
        tool_name: &str,
        id: String,
        json: &str,
    ) -> Result<Option<ProcessedOutput>> {
        if let Some(processor) = self.get_processor_for_tool(tool_name) {
            return processor.process(id, json);
        }
        
        Ok(None)
    }

    /// Process a JSON string with a processor for a specific tool, providing previous output context
    pub fn process_with_tool_and_context(
        &self,
        tool_name: &str,
        id: String,
        json: &str,
        previous_output: Option<ProcessedOutput>,
    ) -> Result<Option<ProcessedOutput>> {
        if let Some(processor) = self.get_processor_for_tool(tool_name) {
            return processor.process_with_context(id, json, previous_output);
        }
        
        Ok(None)
    }

    /// Process a JSON string with a processor for a specific tool and cache the output
    pub fn process_and_cache_tool_output(
        &mut self,
        tool_name: &str,
        id: String,
        json: &str,
    ) -> Result<Option<ProcessedOutput>> {
        let result = self.process_with_tool(tool_name, id.clone(), json)?;
        
        if let Some(output) = &result {
            self.output_cache.insert(id, output.clone());
        }
        
        Ok(result)
    }
    
    /// Process a JSON string with a processor for a specific tool, providing previous output context,
    /// and cache the result
    pub fn process_and_cache_tool_output_with_context(
        &mut self,
        tool_name: &str,
        id: String,
        json: &str,
        previous_output: Option<ProcessedOutput>,
    ) -> Result<Option<ProcessedOutput>> {
        let result = self.process_with_tool_and_context(tool_name, id.clone(), json, previous_output)?;
        
        if let Some(output) = &result {
            self.output_cache.insert(id, output.clone());
        }
        
        Ok(result)
    }
    
    /// Updates the chunk buffer for a specific tool call
    pub fn update_tool_chunk_buffer(&mut self, id: &str, chunk: &str) {
        if let Some(buffer) = self.chunk_buffers.get_mut(id) {
            buffer.push_str(chunk);
        } else {
            self.chunk_buffers.insert(id.to_string(), chunk.to_string());
        }
    }
    
    /// Gets the chunk buffer for a specific tool call
    pub fn get_tool_chunk_buffer(&self, id: &str) -> Option<&String> {
        self.chunk_buffers.get(id)
    }
    
    /// Clears the chunk buffer for a specific tool call
    pub fn clear_tool_chunk_buffer(&mut self, id: &str) {
        self.chunk_buffers.remove(id);
    }

    /// Gets the chunk buffer for the given ID
    pub fn get_chunk_buffer(&self, id: &str) -> Option<String> {
        self.chunk_buffers.get(id).cloned()
    }

    /// Updates the chunk buffer for the given ID
    pub fn update_chunk_buffer(&mut self, id: String, buffer: String) {
        self.chunk_buffers.insert(id, buffer);
    }

    /// Clears the chunk buffer for the given ID
    pub fn clear_chunk_buffer(&mut self, id: &str) {
        self.chunk_buffers.remove(id);
    }

    /// Caches the processed output for the given ID
    pub fn cache_output(&mut self, id: String, output: ProcessedOutput) {
        self.output_cache.insert(id, output);
    }

    /// Gets the cached output for the given ID
    pub fn get_cached_output(&self, id: &str) -> Option<&ProcessedOutput> {
        self.output_cache.get(id)
    }

    /// Clears the cache for the given ID
    pub fn clear_cache(&mut self, id: &str) {
        self.output_cache.remove(id);
    }

    /// Clears all caches
    pub fn clear_all_caches(&mut self) {
        self.output_cache.clear();
        self.chunk_buffers.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{ProcessedOutput, ReasoningText};

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
                secondary_title: "Test".to_string(),
                message: Some(json.to_string()),
                message_chunk: None,
                status: Some("loading".to_string()),
            })))
        }

        fn process_with_context(
            &self,
            id: String,
            json: &str,
            _previous_output: Option<ProcessedOutput>,
        ) -> Result<Option<ProcessedOutput>> {
            Ok(Some(ProcessedOutput::Text(ReasoningText {
                id,
                reasoning_type: "text".to_string(),
                title: "Test".to_string(),
                secondary_title: "Test".to_string(),
                message: Some(json.to_string()),
                message_chunk: None,
                status: Some("loading".to_string()),
            })))
        }

        fn clone_box(&self) -> Box<dyn Processor> {
            Box::new(TestProcessor)
        }
    }

    #[test]
    fn test_processor_registry() {
        let mut registry = ProcessorRegistry::new();
        registry.register(Box::new(TestProcessor));

        let result = registry.process("id1".to_string(), r#"{"test": "value"}"#, "test");
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());
    }

    #[test]
    fn test_processor_registry_with_id() {
        let mut registry = ProcessorRegistry::new();
        registry.register_with_id("custom_id".to_string(), Box::new(TestProcessor));

        let result =
            registry.process_by_id("custom_id".to_string(), r#"{"test": "value"}"#, "test");
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());
    }

    #[test]
    fn test_processor_registry_caching() {
        let mut registry = ProcessorRegistry::new();
        registry.register(Box::new(TestProcessor));

        // Process once
        let id = "cache_test_id".to_string();
        let result = registry.process(id.clone(), r#"{"test": "value"}"#, "test");
        assert!(result.is_ok());
        let output = result.unwrap().unwrap();

        // Cache the output
        registry.cache_output(id.clone(), output.clone());

        // Check if cached
        let cached = registry.get_cached_output(&id);
        assert!(cached.is_some());
        assert_eq!(cached.unwrap(), &output);
    }

    #[test]
    fn test_processor_registry_chunk_buffers() {
        let mut registry = ProcessorRegistry::new();

        // Set chunk buffer
        let id = "buffer_test_id".to_string();
        registry.update_chunk_buffer(id.clone(), "partial json".to_string());

        // Get chunk buffer
        let buffer = registry.get_chunk_buffer(&id);
        assert!(buffer.is_some());
        assert_eq!(buffer.unwrap(), "partial json");

        // Update chunk buffer
        registry.update_chunk_buffer(id.clone(), "complete json".to_string());
        let updated_buffer = registry.get_chunk_buffer(&id);
        assert!(updated_buffer.is_some());
        assert_eq!(updated_buffer.unwrap(), "complete json");

        // Clear chunk buffer
        registry.clear_chunk_buffer(&id);
        let cleared_buffer = registry.get_chunk_buffer(&id);
        assert!(cleared_buffer.is_none());
    }

    #[test]
    fn test_multiple_processors_same_type() {
        let mut registry = ProcessorRegistry::new();

        // Register two processors with the same type but different IDs
        registry.register_with_id("id1".to_string(), Box::new(TestProcessor));
        registry.register_with_id("id2".to_string(), Box::new(TestProcessor));

        // Process with first ID
        let result1 = registry.process_by_id("id1".to_string(), r#"{"test": "value1"}"#, "test");
        assert!(result1.is_ok());
        let output1 = result1.unwrap().unwrap();

        // Process with second ID
        let result2 = registry.process_by_id("id2".to_string(), r#"{"test": "value2"}"#, "test");
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
}
