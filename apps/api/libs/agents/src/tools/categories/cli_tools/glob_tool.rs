use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use glob::glob;
use std::path::PathBuf;
use crate::{
    agent::Agent,
    tools::ToolExecutor
};

#[derive(Serialize, Deserialize, Debug)]
pub struct GlobToolParams {
    pattern: String,
    path: Option<String>,
}

pub struct GlobTool {
    agent: Arc<Agent>,
}

impl GlobTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for GlobTool {
    type Output = String;
    type Params = GlobToolParams;

    fn get_name(&self) -> String {
        "GlobTool".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let base_path = match params.path {
            Some(dir) => PathBuf::from(dir),
            None => std::env::current_dir().map_err(|e| anyhow::anyhow!("Failed to get current directory: {}", e))?,
        };

        let full_pattern = base_path.join(&params.pattern);
        let pattern_str = full_pattern.to_str().ok_or_else(|| anyhow::anyhow!("Invalid pattern path"))?;

        let mut matched_files = Vec::new();
        match glob(pattern_str) {
            Ok(paths) => {
                for entry in paths {
                    match entry {
                        Ok(path) => {
                            if let Some(s) = path.to_str() {
                                matched_files.push(s.to_string());
                            }
                        }
                        Err(e) => eprintln!("Error processing glob entry: {}", e), // Log error but continue
                    }
                }
                
                // Sort by modification time
                matched_files.sort_by(|a, b| {
                    let a_meta = std::fs::metadata(a).ok();
                    let b_meta = std::fs::metadata(b).ok();
                    
                    match (a_meta, b_meta) {
                        (Some(a_meta), Some(b_meta)) => {
                            let a_time = a_meta.modified().ok();
                            let b_time = b_meta.modified().ok();
                            match (a_time, b_time) {
                                (Some(a), Some(b)) => b.cmp(&a), // Most recent first
                                _ => std::cmp::Ordering::Equal,
                            }
                        }
                        _ => std::cmp::Ordering::Equal,
                    }
                });
                
                // Format results as a simple list
                let result = matched_files.join("\n");
                Ok(result)
            },
            Err(e) => Err(anyhow::anyhow!("Glob pattern error: {}", e)),
        }
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Fast file pattern matching tool that works with any codebase size. Returns matching file paths sorted by modification time.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {
                        "type": "string",
                        "description": "The glob pattern to match files against"
                    },
                    "path": {
                        "type": "string",
                        "description": "The directory to search in. If not specified, the current working directory will be used."
                    }
                },
                "required": ["pattern"]
            }
        })
    }
} 