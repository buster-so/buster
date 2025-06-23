# Agents Library - Agent Guidance

## Purpose & Role

The Agents library provides a framework for creating and using AI agents that can interact with LLMs and execute tools. It serves as the foundation for implementing autonomous agents that can perform complex tasks like data analysis, dashboard creation, and planning.

## Key Functionality

- Agent interfaces for standardized LLM interaction
- Tool execution framework for defining and running agent tools
- Specialized agents for data-related tasks
- Tool categorization system for organizing agent capabilities
- Utilities for agent message handling and response processing

## Internal Organization

### Directory Structure

```
src/
  ├── agent.rs - Core agent trait definitions and implementations
  ├── agents/
  │   ├── buster_super_agent.rs - Buster's primary agent implementation
  │   └── mod.rs
  ├── models/
  │   ├── types.rs - Agent-related data structures
  │   └── mod.rs
  ├── tools/
  │   ├── categories/ - Tool categorization
  │   │   ├── agents_as_tools/ - Using agents as tools
  │   │   ├── file_tools/ - File manipulation tools
  │   │   ├── planning_tools/ - Planning and strategy tools
  │   │   └── mod.rs
  │   ├── executor.rs - Tool execution machinery
  │   └── mod.rs
  ├── utils/
  │   ├── tools.rs - Tool utility functions
  │   └── mod.rs
  └── lib.rs - Public exports and library documentation
```

### Key Modules

- `agent`: Defines the core `Agent` trait and related functionality that all agents implement
- `agents`: Contains concrete agent implementations, including the primary BusterSuperAgent
- `models`: Data structures and types used throughout the agent system
- `tools`: The tool execution framework, including the `ToolExecutor` trait
- `utils`: Utility functions for agent operations and tool management

## Usage Patterns

```rust
use agents::{Agent, BusterSuperAgent};
use litellm::AgentMessage;

async fn example_agent_use() -> Result<(), anyhow::Error> {
    // Create a new agent
    let agent = BusterSuperAgent::new(config).await?;
    
    // Send a message to the agent
    let messages = vec![
        AgentMessage::user("Analyze the sales data for Q1")
    ];
    
    // Execute the agent and process the response
    let response = agent.execute(messages).await?;
    
    // Process agent response...
    Ok(())
}
```

### Common Implementation Patterns

- Agents are typically created once and reused for multiple interactions
- Tools are registered with agents at creation time
- Agent responses should be parsed for both content and tool call requests
- Chain agent calls together for multi-step reasoning
- Tool implementations should be focused, performing one specific task
- Error handling flows up from tools to the agent executor

## Dependencies

- **Internal Dependencies**:
  - `litellm`: Used for LLM provider communication
  - `database`: Used for persisting agent state and accessing data
  - `query_engine`: Used by data-related tools to execute queries
  - `braintrust`: Used for agent performance monitoring

- **External Dependencies**:
  - `serde_json`: Used for parsing and generating JSON for agent communication
  - `anyhow` and `thiserror`: Used for error handling
  - `async-trait`: Used for async trait implementations
  - `tokio`: Used for async runtime

## Code Navigation Tips

- Start with `lib.rs` to see what's exported and main entry points
- The `Agent` trait in `agent.rs` defines the core agent interface
- `BusterSuperAgent` in `agents/buster_super_agent.rs` is the main implementation
- Tool categories in `tools/categories/` are organized by functional area
- The `ToolExecutor` trait in `tools/mod.rs` is implemented by various tool types
- New tools should be added to the appropriate category in `tools/categories/`

## Testing Guidelines

- Unit tests focus on individual tool functionality
- Mock the LLM responses using test fixtures
- Use in-memory database for integration tests
- Run tests with: `cargo test -p agents`
- Test tools individually before testing complete agent flows
- Create mock implementations of `Agent` trait for testing dependent code