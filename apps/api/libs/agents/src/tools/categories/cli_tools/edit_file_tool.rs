use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::Path;
use crate::{
    agent::Agent,
    tools::ToolExecutor
};

#[derive(Serialize, Deserialize, Debug)]
pub struct EditParams {
    file_path: String,
    old_string: String,
    new_string: String,
    expected_replacements: Option<usize>,
}

pub struct EditTool {
    agent: Arc<Agent>,
}

impl EditTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for EditTool {
    type Output = String;
    type Params = EditParams;

    fn get_name(&self) -> String {
        "Edit".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let file_path = Path::new(&params.file_path);
        if !file_path.exists() && !params.old_string.is_empty() {
            return Err(anyhow::anyhow!("File does not exist: {}", params.file_path));
        }
        
        // If old_string is empty and file doesn't exist, create a new file
        if params.old_string.is_empty() {
            // Create parent directories if necessary
            if let Some(parent) = file_path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            std::fs::write(file_path, &params.new_string)?;
            return Ok(format!("Created new file: {}", params.file_path));
        }
        
        let content = std::fs::read_to_string(file_path)?;
        let expected = params.expected_replacements.unwrap_or(1);
        let matches = content.matches(&params.old_string).count();
        
        if matches == 0 {
            return Err(anyhow::anyhow!(
                "No matches found for replacement string in {}",
                params.file_path
            ));
        } else if matches != expected && expected == 1 {
            return Err(anyhow::anyhow!(
                "Found {} matches when exactly 1 was expected. Provide more context in old_string or use expected_replacements parameter.",
                matches
            ));
        } else if matches != expected {
            return Err(anyhow::anyhow!(
                "Found {} matches when {} were expected.",
                matches, expected
            ));
        }
        
        let new_content = content.replace(&params.old_string, &params.new_string);
        std::fs::write(file_path, new_content)?;
        
        Ok(format!("Successfully edited file: {}", params.file_path))
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "This is a tool for editing files by replacing specific text strings.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "The absolute path to the file to modify"
                    },
                    "old_string": {
                        "type": "string",
                        "description": "The text to replace"
                    },
                    "new_string": {
                        "type": "string",
                        "description": "The text to replace it with"
                    },
                    "expected_replacements": {
                        "type": "number",
                        "description": "The expected number of replacements to perform. Defaults to 1 if not specified."
                    }
                },
                "required": ["file_path", "old_string", "new_string"]
            }
        })
    }
} 