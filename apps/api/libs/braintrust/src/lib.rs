//! Braintrust Client Library
//! 
//! This library provides a client for interacting with the Braintrust API,
//! allowing for logging of spans and traces to track AI application performance.

mod client;
mod types;
mod trace;
mod helpers;

// Re-export public API
pub use client::BraintrustClient;
pub use trace::TraceBuilder;
pub use types::{Span, Metrics, EventPayload, Prompt, PromptData, PromptContent, PromptOptions};
pub use helpers::*;

// Constants
pub const API_BASE: &str = "https://api.braintrust.dev/v1";
