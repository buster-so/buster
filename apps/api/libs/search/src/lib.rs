pub mod types;
pub mod search;
#[cfg(test)]
mod tests;

pub use types::{
    SearchObject, SearchObjectType, SearchOptions, 
    MessageSearchResult, GenericSearchResult
};

pub use search::{search, list_recent_assets};