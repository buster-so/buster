use anyhow::Result;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;

/// A trait that defines how tools should be implemented.
/// Any struct that wants to be used as a tool must implement this trait.
#[async_trait::async_trait]
pub trait ToolExecutor: Send + Sync {
    /// The type of the output of the tool
    type Output: Serialize + Send;

    /// The type of the parameters for this tool
    type Params: DeserializeOwned + Send;

    /// Execute the tool with the given parameters and tool call ID.
    async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output>;

    /// Get the JSON schema for this tool
    async fn get_schema(&self) -> Value;

    /// Get the name of this tool
    fn get_name(&self) -> String;

    /// Handle shutdown signal. Default implementation does nothing.
    /// Tools should override this if they need to perform cleanup on shutdown.
    async fn handle_shutdown(&self) -> Result<()> {
        Ok(())
    }
}

/// A wrapper type that converts ToolCall parameters to Value before executing
pub struct ToolCallExecutor<T: ToolExecutor> {
    inner: Box<T>,
}

impl<T: ToolExecutor> ToolCallExecutor<T> {
    pub fn new(inner: T) -> Self {
        Self {
            inner: Box::new(inner),
        }
    }
}

#[async_trait::async_trait]
impl<T: ToolExecutor + Send + Sync> ToolExecutor for ToolCallExecutor<T>
where
    T::Params: serde::de::DeserializeOwned,
    T::Output: serde::Serialize,
{
    type Output = Value;
    type Params = Value;

    async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output> {
        let params = serde_json::from_value(params)?;
        let result = self.inner.execute(params, tool_call_id).await?;
        Ok(serde_json::to_value(result)?)
    }

    async fn get_schema(&self) -> Value {
        self.inner.get_schema().await
    }

    fn get_name(&self) -> String {
        self.inner.get_name()
    }
}

/// Implementation for Box<T> to enable dynamic dispatch
#[async_trait::async_trait]
impl<T: ToolExecutor<Output = Value, Params = Value> + Send + Sync> ToolExecutor for Box<T> {
    type Output = Value;
    type Params = Value;

    async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output> {
        (**self).execute(params, tool_call_id).await
    }

    async fn get_schema(&self) -> Value {
        (**self).get_schema().await
    }

    fn get_name(&self) -> String {
        (**self).get_name()
    }
}

/// A trait to convert any ToolExecutor to a ToolCallExecutor
pub trait IntoToolCallExecutor: ToolExecutor
where
    Self::Params: serde::de::DeserializeOwned,
    Self::Output: serde::Serialize,
{
    /// Convert this tool to a ToolCallExecutor which works with JSON values
    fn into_tool_call_executor(self) -> ToolCallExecutor<Self>
    where
        Self: Sized,
    {
        ToolCallExecutor::new(self)
    }
}

// Implement IntoToolCallExecutor for all types that meet the requirements
impl<T> IntoToolCallExecutor for T
where
    T: ToolExecutor,
    T::Params: serde::de::DeserializeOwned,
    T::Output: serde::Serialize,
{
}