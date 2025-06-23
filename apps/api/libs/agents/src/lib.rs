//! Agents Library
//! 
//! This library provides agent functionality for interacting with LLMs.

mod agent;
mod agents;
mod models;
pub mod tools;

// Re-export public API
pub use agent::{Agent, AgentError, AgentExt};
pub use agents::*;
pub use models::*;

// Re-export the ToolExecutor trait for convenience
pub use tools::ToolExecutor;

// Re-export types from dependencies that are part of our public API
pub use litellm::AgentMessage; 