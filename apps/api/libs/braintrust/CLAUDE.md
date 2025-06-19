# Braintrust Library - Agent Guidance

## Purpose & Role

The Braintrust library provides a client for interacting with the Braintrust API, enabling the tracking and logging of AI application performance through spans and traces. It serves as the monitoring and observability layer for LLM interactions.

## Key Functionality

- Braintrust API client for logging AI application performance
- Span and trace creation for measuring LLM operations
- Event and metrics tracking
- Prompt and response logging
- Structured metadata collection for AI operations

## Internal Organization

### Directory Structure

```
src/
  ├── client.rs - BraintrustClient implementation
  ├── types.rs - Core data structures for API interactions
  ├── trace.rs - TraceBuilder for creating trace spans
  ├── helpers.rs - Utility functions and helpers
  └── lib.rs - Public exports and documentation
```

### Key Modules

- `client`: Implements the `BraintrustClient` for API communication
- `types`: Defines data structures like `Span`, `Metrics`, and `EventPayload`
- `trace`: Provides the `TraceBuilder` for creating and managing trace spans
- `helpers`: Utility functions for working with the Braintrust API

## Usage Patterns

```rust
use braintrust::{BraintrustClient, TraceBuilder};

async fn example_usage() -> Result<(), anyhow::Error> {
    // Create a client
    let client = BraintrustClient::new("YOUR_API_KEY").await?;
    
    // Create a trace
    let trace = TraceBuilder::new("example-trace")
        .with_metadata("user_id", "123")
        .build();
    
    // Log a span with the client
    client.log_span(trace, "llm-call", |span| {
        // Your LLM call logic here
        span.with_input("What is the capital of France?")
            .with_output("Paris is the capital of France.")
    }).await?;
    
    Ok(())
}
```

### Common Implementation Patterns

- Initialize the `BraintrustClient` once and reuse it throughout the application
- Create traces for logical units of work (e.g., a chat session)
- Use spans to measure individual operations within a trace (e.g., an LLM call)
- Add metadata to traces and spans for better filtering and analysis
- Properly handle errors from the Braintrust API

## Dependencies

- **Internal Dependencies**:
  - None - this is a standalone library that other libraries depend on

- **External Dependencies**:
  - `reqwest`: For making HTTP requests to the Braintrust API
  - `serde_json`: For JSON serialization/deserialization
  - `tokio`: For async runtime
  - `uuid`: For generating unique IDs
  - `chrono`: For timestamp handling

## Code Navigation Tips

- Start with `lib.rs` to see the exported API
- The `BraintrustClient` in `client.rs` is the main entry point for usage
- `types.rs` contains all the data structures used for API interactions
- `trace.rs` contains the `TraceBuilder` for creating traces
- When adding new metrics or events, extend the existing types in `types.rs`

## Testing Guidelines

- Mock the HTTP responses in unit tests using `mockito`
- Test error handling by simulating API errors
- Validate the correct structure of API requests in tests
- Run tests with: `cargo test -p braintrust`
- Use the examples in the `examples/` directory as reference implementations