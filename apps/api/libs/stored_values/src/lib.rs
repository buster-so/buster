//! Library for managing stored column values and their embeddings for search.

pub use anyhow::Result;

pub mod schema;
pub mod jobs;
pub mod search;

// Re-export key functions
pub use schema::create_search_schema;
pub use jobs::setup_sync_job;
pub use search::{search_values_by_embedding, StoredValueResult};

// Add other modules like types, errors, etc. as needed 