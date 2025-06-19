use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

use crate::{agent::Agent, tools::ToolExecutor};

#[derive(Debug, Deserialize, Serialize)]
pub struct DoneInput {
    final_response: String,
}

// Define the new standard output struct
#[derive(Debug, Serialize, Deserialize)]
pub struct DoneOutput {
    pub success: bool,
    pub todos: String,
}

pub struct Done {
    agent: Arc<Agent>,
}

impl Done {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }

    pub fn get_name() -> String {
        "done".to_string()
    }
}

#[async_trait]
impl ToolExecutor for Done {
    type Output = DoneOutput;
    type Params = DoneInput;

    fn get_name(&self) -> String {
        "done".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        // Get the current todos from state
        let mut todos = match self.agent.get_state_value("todos").await {
            Some(Value::Array(arr)) => arr,
            _ => {
                // If no todos exist, just return success without a list
                return Ok(DoneOutput {
                    success: true,
                    todos: "No to-do list found.".to_string(),
                });
            }
        };

        let mut marked_by_done = vec![]; // Track items marked by this tool

        // Mark all remaining unfinished todos as complete
        for (idx, todo_val) in todos.iter_mut().enumerate() {
            if let Value::Object(map) = todo_val {
                let is_completed = map
                    .get("completed")
                    .and_then(Value::as_bool)
                    .unwrap_or(false);
                if !is_completed {
                    map.insert("completed".to_string(), Value::Bool(true));
                    marked_by_done.push(idx); // Track 0-based index
                }
            } else {
                // Handle invalid item format if necessary, maybe log a warning?
                eprintln!("Warning: Invalid todo item format at index {}", idx);
            }
        }

        // Save the updated todos back to state
        self.agent
            .set_state_value("todos".to_string(), Value::Array(todos.clone()))
            .await; // Clone needed for iteration below

        // Format the output string, potentially noting items marked by 'done'
        let todos_string = todos
            .iter()
            .enumerate()
            .map(|(idx, todo_val)| {
                if let Value::Object(map) = todo_val {
                    let completed = map
                        .get("completed")
                        .and_then(Value::as_bool)
                        .unwrap_or(false); // Should always be true now
                    let todo_text = map
                        .get("todo")
                        .and_then(Value::as_str)
                        .unwrap_or("Invalid todo text");
                    let annotation = if marked_by_done.contains(&idx) {
                        " *Marked complete by calling the done tool"
                    } else {
                        ""
                    };
                    format!("[x] {}{}", todo_text, annotation)
                } else {
                    "Invalid todo item format".to_string()
                }
            })
            .collect::<Vec<_>>()
            .join("\n");

        // This tool signals the end of the workflow and provides the final response.
        // The actual agent termination logic resides elsewhere.
        Ok(DoneOutput {
            success: true,
            todos: todos_string,
        }) // Include todos in output
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Marks all remaining unfinished tasks as complete, sends a final response to the user, and ends the workflow. Use this when the workflow is finished. This must be in markdown format and not use the '•' bullet character.",
            "parameters": {
                "type": "object",
                "required": [
                "final_response"
                ],
                "properties": {
                "final_response": {
                    "type": "string",
                    "description": "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
                }
                },
                "additionalProperties": false
            }
        })
    }
}
