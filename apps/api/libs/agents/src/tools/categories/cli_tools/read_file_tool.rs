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
pub struct ViewSingleParams {
    file_path: String,
    offset: Option<usize>,
    limit: Option<usize>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ViewParams {
    #[serde(flatten)]
    single: Option<ViewSingleParams>,
    #[serde(rename = "file_paths")]
    multiple: Option<Vec<String>>,
}

pub struct ViewTool {
    agent: Arc<Agent>,
}

impl ViewTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }

    async fn read_single_file(&self, file_path: &str, offset: Option<usize>, limit: Option<usize>) -> Result<String, anyhow::Error> {
        let path = Path::new(file_path);
        if !path.exists() {
            return Err(anyhow::anyhow!("File does not exist: {}", file_path));
        }
        if !path.is_file() {
            return Err(anyhow::anyhow!("Path is not a file: {}", file_path));
        }

        let content = fs::read_to_string(path)
            .map_err(|e| anyhow::anyhow!("Failed to read file '{}': {}", file_path, e))?;

        let lines: Vec<&str> = content.lines().collect();
        let total_lines = lines.len();

        let start_idx = offset.unwrap_or(0);
        let line_limit = limit.unwrap_or(2000);
        let end_idx = std::cmp::min(start_idx + line_limit, total_lines);

        // Format like cat -n with line numbers
        let mut result = String::new();
        
        // Add file header if reading multiple files
        if self.is_multi_file_view() {
            result.push_str(&format!("==> {} <==\n", file_path));
        }
        
        for i in start_idx..end_idx {
            if i < lines.len() {
                result.push_str(&format!("{:6} {}\n", i + 1, lines[i]));
            }
        }

        Ok(result)
    }
    
    fn is_multi_file_view(&self) -> bool {
        // This is a placeholder - in a real implementation this would track 
        // if we're handling multiple files in the current execution
        false
    }
}

#[async_trait]
impl ToolExecutor for ViewTool {
    type Output = String;
    type Params = ViewParams;

    fn get_name(&self) -> String {
        "View".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        // Handle array of file paths
        if let Some(file_paths) = params.multiple {
            if file_paths.is_empty() {
                return Err(anyhow::anyhow!("No file paths provided"));
            }
            
            let mut results = Vec::new();
            
            for file_path in &file_paths {
                match self.read_single_file(file_path, None, None).await {
                    Ok(content) => {
                        if file_paths.len() > 1 {
                            results.push(format!("==> {} <==\n{}", file_path, content));
                        } else {
                            results.push(content);
                        }
                    },
                    Err(e) => results.push(format!("Error reading {}: {}", file_path, e)),
                }
            }
            
            Ok(results.join("\n\n"))
        } 
        // Handle single file path
        else if let Some(single) = params.single {
            self.read_single_file(&single.file_path, single.offset, single.limit).await
        } 
        // Neither provided
        else {
            Err(anyhow::anyhow!("Must provide either file_path or file_paths"))
        }
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Reads a file from the local filesystem. You can access any file directly by using this tool.",
            "parameters": {
                "type": "object",
                "oneOf": [
                    {
                        "properties": {
                            "file_path": {
                                "type": "string",
                                "description": "The absolute path to the file to read"
                            },
                            "offset": {
                                "type": "number",
                                "description": "The line number to start reading from. Only provide if the file is too large to read at once"
                            },
                            "limit": {
                                "type": "number",
                                "description": "The number of lines to read. Only provide if the file is too large to read at once."
                            }
                        },
                        "required": ["file_path"]
                    },
                    {
                        "properties": {
                            "file_paths": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "description": "An array of absolute file paths to read in a single operation"
                            }
                        },
                        "required": ["file_paths"]
                    }
                ]
            }
        })
    }
} 