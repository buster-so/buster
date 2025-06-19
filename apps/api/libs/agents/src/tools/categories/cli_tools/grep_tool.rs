use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use regex::Regex;
use std::fs;
use std::path::PathBuf;
use glob::glob;
use crate::{
    agent::Agent,
    tools::ToolExecutor
};

#[derive(Serialize, Deserialize, Debug)]
pub struct GrepToolParams {
    pattern: String,
    path: Option<String>,
    include: Option<String>,
}

pub struct GrepTool {
    agent: Arc<Agent>,
}

impl GrepTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for GrepTool {
    type Output = String;
    type Params = GrepToolParams;

    fn get_name(&self) -> String {
        "GrepTool".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let base_path = match params.path {
            Some(dir) => PathBuf::from(dir),
            None => std::env::current_dir().map_err(|e| anyhow::anyhow!("Failed to get current directory: {}", e))?,
        };
        
        // Find all files that match the include pattern
        let include_pattern = params.include.unwrap_or_else(|| "*".to_string());
        let full_pattern = base_path.join(&include_pattern);
        let pattern_str = full_pattern.to_str().ok_or_else(|| anyhow::anyhow!("Invalid pattern path"))?;
        
        let mut file_paths = Vec::new();
        for entry in glob(pattern_str)? {
            if let Ok(path) = entry {
                if path.is_file() {
                    file_paths.push(path);
                }
            }
        }
        
        // Compile regex for search
        let regex = Regex::new(&params.pattern)
            .map_err(|e| anyhow::anyhow!("Invalid regex pattern '{}': {}", params.pattern, e))?;
        
        let mut matches = Vec::new();
        for file_path in file_paths {
            if let Ok(content) = fs::read_to_string(&file_path) {
                for (line_num, line) in content.lines().enumerate() {
                    if regex.is_match(line) {
                        matches.push((file_path.clone(), line_num + 1, line.to_string()));
                    }
                }
            }
        }
        
        // Sort results by modification time
        matches.sort_by(|(a_path, _, _), (b_path, _, _)| {
            let a_meta = std::fs::metadata(a_path).ok();
            let b_meta = std::fs::metadata(b_path).ok();
            
            match (a_meta, b_meta) {
                (Some(a_meta), Some(b_meta)) => {
                    let a_time = a_meta.modified().ok();
                    let b_time = b_meta.modified().ok();
                    match (a_time, b_time) {
                        (Some(a), Some(b)) => b.cmp(&a), // Most recent first
                        _ => std::cmp::Ordering::Equal,
                    }
                },
                _ => std::cmp::Ordering::Equal,
            }
        });
        
        // Format results
        let mut result = String::new();
        for (file_path, line_num, content) in matches {
            if let Some(path_str) = file_path.to_str() {
                result.push_str(&format!("{}: {}: {}\n", path_str, line_num, content));
            }
        }
        
        if result.is_empty() {
            result = "No matches found".to_string();
        }
        
        Ok(result)
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Fast content search tool that works with any codebase size. Searches file contents using regular expressions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {
                        "type": "string",
                        "description": "The regular expression pattern to search for in file contents"
                    },
                    "path": {
                        "type": "string",
                        "description": "The directory to search in. Defaults to the current working directory."
                    },
                    "include": {
                        "type": "string",
                        "description": "File pattern to include in the search (e.g. \"*.js\", \"*.{ts,tsx}\")"
                    }
                },
                "required": ["pattern"]
            }
        })
    }
} 