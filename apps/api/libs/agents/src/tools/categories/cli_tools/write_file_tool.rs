use crate::{agent::Agent, tools::ToolExecutor};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::Path;
use std::sync::Arc;

#[derive(Serialize, Deserialize, Debug)]
pub struct ReplaceParams {
    file_path: String,
    content: String,
}

pub struct ReplaceTool {
    agent: Arc<Agent>,
}

impl ReplaceTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for ReplaceTool {
    type Output = String;
    type Params = ReplaceParams;

    fn get_name(&self) -> String {
        "Replace".to_string()
    }

    async fn execute(
        &self,
        params: Self::Params,
        _tool_call_id: String,
    ) -> Result<Self::Output, anyhow::Error> {
        let file_path = Path::new(&params.file_path);

        // Ensure parent directory exists
        if let Some(parent_dir) = file_path.parent() {
            if !parent_dir.exists() {
                fs::create_dir_all(parent_dir)?
            }
        }

        // Write the file (always overwrite)
        fs::write(file_path, &params.content)?;

        Ok(format!(
            "Successfully wrote content to file: {}",
            params.file_path
        ))
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Write a file to the local filesystem. Overwrites the existing file if there is one.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "The absolute path to the file to write (must be absolute, not relative)"
                    },
                    "content": {
                        "type": "string",
                        "description": "The content to write to the file"
                    }
                },
                "required": ["file_path", "content"]
            }
        })
    }
}
