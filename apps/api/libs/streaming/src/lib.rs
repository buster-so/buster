//! Streaming Parser Library
//!
//! This library provides functionality for parsing incomplete JSON streams
//! and processing them through specialized processors.
//!
//! The library now supports ID-based processors, allowing multiple tool calls
//! of the same type to be processed simultaneously without interference.
//! It also handles caching and chunk tracking for each individual tool call.

pub mod parser;
pub mod processor;
pub mod types;
pub mod processors;

// Re-export the main types
pub use parser::StreamingParser;
pub use processor::{Processor, ProcessorRegistry};
pub use types::{ProcessedOutput, ProcessorType, MessageType, ToolCallInfo, ToolCallState, ProcessedMessage};
pub use processors::*;
