use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use crate::{
    agent::Agent,
    tools::ToolExecutor
};
use glob::Pattern;

#[derive(Serialize, Deserialize, Debug)]
pub struct LSParams {
    path: String,
    ignore: Option<Vec<String>>,
}

pub struct LSTool {
    agent: Arc<Agent>,
}

impl LSTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for LSTool {
    type Output = String;
    type Params = LSParams;

    fn get_name(&self) -> String {
        "LS".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let path = PathBuf::from(&params.path);
        if !path.exists() {
            return Err(anyhow::anyhow!("Path does not exist: {}", params.path));
        }
        if !path.is_dir() {
             return Err(anyhow::anyhow!("Path is not a directory: {}", params.path));
        }

        // Get ignore patterns
        let ignore_patterns = params.ignore.unwrap_or_default();

        // Simplified listing output
        let mut results = String::new();
        for entry_result in fs::read_dir(path)? {
            if let Ok(entry) = entry_result {
                let file_name = entry.file_name().to_string_lossy().to_string();
                
                // Check if file matches any ignore pattern
                let should_ignore = ignore_patterns.iter().any(|pattern| {
                    Pattern::new(pattern).map(|p| p.matches(&file_name)).unwrap_or(false)
                });
                
                if !should_ignore {
                    let path = entry.path();
                    let file_type = if path.is_dir() { "dir" } else { "file" };
                    results.push_str(&format!("{} {}\n", file_type, file_name));
                }
            }
        }

        Ok(results)
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Lists files and directories in a given path. The path parameter must be an absolute path, not a relative path.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The absolute path to the directory to list (must be absolute, not relative)"
                    },
                    "ignore": {
                        "type": "array",
                        "description": "List of glob patterns to ignore",
                        "items": {
                            "type": "string"
                        }
                    }
                },
                "required": ["path"]
            }
        })
    }
} 