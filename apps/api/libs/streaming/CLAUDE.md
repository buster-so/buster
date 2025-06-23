# Streaming Library - Agent Guidance

## Purpose & Role

The Streaming library provides functionality for parsing and processing incomplete JSON streams from LLM responses. It allows for real-time processing of partial JSON data, handling tool calls and message content as they arrive, and supports concurrent processing of multiple tool calls of the same type.

## Key Functionality

- Streaming JSON parser for incomplete LLM responses
- Tool call detection and processing
- Processor registry for handling different types of tool calls
- State tracking for partial message processing
- Caching mechanism for tool call chunks
- Specialized processors for common tools

## Internal Organization

### Directory Structure

```
src/
  ├── parser.rs - StreamingParser implementation
  ├── processor.rs - Processor trait and registry
  ├── types.rs - Core type definitions
  ├── processors/ - Specialized processors
  │   ├── create_dashboards_processor.rs - Dashboard creation
  │   ├── create_metrics_processor.rs - Metric creation
  │   ├── create_plan_processor.rs - Plan creation
  │   ├── search_data_catalog_processor.rs - Data catalog search
  │   └── mod.rs
  └── lib.rs - Public exports and documentation
```

### Key Modules

- `parser`: Implements the `StreamingParser` that processes JSON chunks
- `processor`: Defines the `Processor` trait and the `ProcessorRegistry`
- `types`: Contains core types like `ProcessedOutput` and `ToolCallInfo`
- `processors`: Specialized implementations for specific tool calls

## Usage Patterns

```rust
use streaming::{StreamingParser, Processor, ProcessorRegistry, ToolCallInfo, ProcessedOutput};

async fn example_streaming(chunk: String, registry: &ProcessorRegistry) -> Result<Vec<ProcessedOutput>, anyhow::Error> {
    // Create a parser
    let mut parser = StreamingParser::new();
    
    // Process a chunk
    let outputs = parser.process_chunk(&chunk, registry).await?;
    
    // Handle the processed outputs
    for output in &outputs {
        match output {
            ProcessedOutput::ToolStart(tool_info) => {
                println!("Tool started: {}", tool_info.name);
            },
            ProcessedOutput::ToolOutput(tool_id, output) => {
                println!("Tool output for {}: {}", tool_id, output);
            },
            ProcessedOutput::ToolEnd(tool_id) => {
                println!("Tool completed: {}", tool_id);
            },
            ProcessedOutput::Message(content) => {
                println!("Message content: {}", content);
            },
        }
    }
    
    Ok(outputs)
}
```

### Common Implementation Patterns

- Register processors before parsing begins
- Process chunks sequentially as they arrive
- Handle both message content and tool calls
- Use the processor registry to delegate tool call processing
- Track the state of partial tool calls across chunks
- Cache partial chunks until complete JSON objects are received

## Dependencies

- **Internal Dependencies**:
  - `litellm`: For LLM message types and structures

- **External Dependencies**:
  - `serde_json`: For JSON parsing
  - `regex`: For pattern matching in JSON chunks
  - `uuid`: For unique identifiers
  - `sha2`: For hash generation
  - `chrono`: For timestamps

## Code Navigation Tips

- Start with `lib.rs` to see the exported types and functions
- `StreamingParser` in `parser.rs` is the main entry point
- `Processor` trait in `processor.rs` defines the interface for tool processors
- `ProcessorRegistry` manages the registered processors
- Each processor in the `processors/` directory implements the `Processor` trait
- `types.rs` defines the core data structures used throughout the library

## Testing Guidelines

- Test with partial and complete JSON chunks
- Verify correct handling of malformed JSON
- Test concurrent processing of multiple tool calls
- Test each processor individually
- Test the full streaming pipeline with realistic LLM responses
- Run tests with: `cargo test -p streaming`
- Create test fixtures for common LLM response patterns