use std::sync::Arc;

use anyhow::Result;
use async_trait::async_trait;
use serde::Serialize;
use serde_json::Value;

use crate::{agent::Agent, tools::ToolExecutor};

// Define the output structure for the tool
#[derive(Debug, Serialize)]
pub struct NoSearchNeededOutput {
    success: bool,
}

// Define the tool struct
pub struct NoSearchNeededTool {
    agent: Arc<Agent>,
}

impl NoSearchNeededTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for NoSearchNeededTool {
    // Specify the output type
    type Output = NoSearchNeededOutput;
    // Allow any valid JSON value as parameters, although they will be ignored.
    type Params = Value;

    async fn execute(&self, _params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        // Simply return a success indicator

        self.agent
            .set_state_value(String::from("searched_data_catalog"), Value::Bool(true))
            .await;

        Ok(NoSearchNeededOutput { success: true })
    }

    fn get_name(&self) -> String {
        "no_search_needed".to_string()
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": "no_search_needed",
          "description": "Indicates that no search is required because the datasets or other information from a previous `search_data_catalog` tool have everything needed to fulfill the user's request. (from a foundational data asset perspective)",
          "parameters": {
            "type": "object",
            "required": [], // No required parameters
            "properties": {}, // No properties
            "additionalProperties": false
          }
        })
    }
}

// Removed the Default implementation as agent is now required
// impl Default for NoSearchNeededTool {
//     fn default() -> Self {
//         // Cannot provide a default agent
//         panic!("NoSearchNeededTool requires an Agent instance");
//     }
// }
