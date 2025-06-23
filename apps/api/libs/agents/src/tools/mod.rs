//! Tools module containing various tool implementations and the core ToolExecutor trait
//!
//! This module provides a standardized interface for creating tools that agents can use.

pub mod executor;
pub mod categories;

// Re-export the core types for easy access
pub use executor::{ToolExecutor, ToolCallExecutor, IntoToolCallExecutor};

// Re-export commonly used tool categories
pub use categories::file_tools;
pub use categories::planning_tools;
pub use categories::cli_tools;

