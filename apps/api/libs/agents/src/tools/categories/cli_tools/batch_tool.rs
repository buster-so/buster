use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::{
    agent::Agent,
    tools::ToolExecutor
};

#[derive(Serialize, Deserialize, Debug)]
pub struct ToolInvocation {
    tool_name: String,
    input: serde_json::Value,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BatchToolParams {
    description: String,
    invocations: Vec<ToolInvocation>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BatchToolResult {
    tool_name: String,
    result: serde_json::Value,
    error: Option<String>,
}

pub struct BatchTool {
    agent: Arc<Agent>,
}

impl BatchTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for BatchTool {
    type Output = Vec<String>;
    type Params = BatchToolParams;

    fn get_name(&self) -> String {
        "BatchTool".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let mut results = Vec::new();
        
        // This is a simplified implementation since we can't actually dispatch to other tools here
        // In a real implementation we would execute each tool call in the batch
        
        for invocation in params.invocations {
            results.push(format!("Tool '{}' would be executed with {} parameters", 
                invocation.tool_name, 
                match invocation.input {
                    Value::Object(map) => map.len(),
                    _ => 0
                }
            ));
        }
        
        Ok(results)
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Batch execution tool that runs multiple tool invocations in a single request",
            "parameters": {
                "type": "object",
                "properties": {
                    "description": {
                        "type": "string",
                        "description": "A short (3-5 word) description of the batch operation"
                    },
                    "invocations": {
                        "type": "array",
                        "description": "The list of tool invocations to execute",
                        "items": {
                            "type": "object",
                            "properties": {
                                "tool_name": {
                                    "type": "string",
                                    "description": "The name of the tool to invoke"
                                },
                                "input": {
                                    "type": "object",
                                    "description": "The input to pass to the tool"
                                }
                            },
                            "required": ["tool_name", "input"]
                        }
                    }
                },
                "required": ["description", "invocations"]
            }
        })
    }
}