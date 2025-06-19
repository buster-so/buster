use anyhow::Result;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;

/// A trait that defines how tools should be implemented.
/// Any struct that wants to be used as a tool must implement this trait.
/// Tools are constructed with a reference to their agent and can access its capabilities.
#[async_trait::async_trait]
pub trait ToolExecutor: Send + Sync {
    /// The type of the output of the tool
    type Output: Serialize + Send;

    /// The type of the parameters for this tool
    type Params: DeserializeOwned + Send;

    /// Execute the tool with the given parameters.
    async fn execute(&self, params: Self::Params) -> Result<Self::Output>;

    /// Get the JSON schema for this tool
    fn get_schema(&self) -> Value;

    /// Get the name of this tool
    fn get_name(&self) -> String;

    /// Check if this tool is currently enabled
    async fn is_enabled(&self) -> bool;

    /// Handle shutdown signal. Default implementation does nothing.
    /// Tools should override this if they need to perform cleanup on shutdown.
    async fn handle_shutdown(&self) -> Result<()> {
        Ok(())
    }
} 