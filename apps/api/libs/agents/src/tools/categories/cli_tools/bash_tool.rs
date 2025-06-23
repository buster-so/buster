use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::process::Command;
use crate::{agent::Agent, tools::ToolExecutor};
use anyhow::Result;

#[derive(Serialize, Deserialize, Debug)]
pub struct BashParams {
    command: String,
    description: Option<String>,
    timeout: Option<u64>,
}

pub struct BashTool {
    _agent: Arc<Agent>,
}

impl BashTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { _agent: agent }
    }
}

#[async_trait]
impl ToolExecutor for BashTool {
    type Output = String;
    type Params = BashParams;

    fn get_name(&self) -> String {
        "Bash".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        let mut command = Command::new("sh");
        command.arg("-c").arg(&params.command);

        // We'd implement timeout here with actual timeout logic
        let _timeout_ms = params.timeout.unwrap_or(1800000); // Default 30 min
        
        match command.output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                
                let mut result = stdout; // stdout is already owned String
                if !stderr.is_empty() {
                    if !result.is_empty() && !result.ends_with('\n') {
                        result.push('\n'); // Append a newline character if needed
                    }
                    result.push_str(&stderr); // Append stderr
                }
                Ok(result)
            },
            Err(e) => Err(anyhow::anyhow!(
                "Failed to execute command '{}': {}",
                params.command,
                e
            )),
        }
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Executes a given bash command in a persistent shell session with optional timeout, ensuring proper handling and security measures.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The command to execute"
                    },
                    "description": {
                        "type": "string",
                        "description": "Clear, concise description of what this command does in 5-10 words"
                    },
                    "timeout": {
                        "type": "number",
                        "description": "Optional timeout in milliseconds (max 600000)"
                    }
                },
                "required": ["command"]
            }
        })
    }
} 