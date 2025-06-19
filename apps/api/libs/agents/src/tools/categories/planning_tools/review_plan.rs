use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

use crate::{agent::Agent, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
pub struct ReviewPlanOutput {
    pub success: bool,
    pub todos: String,
}

#[derive(Debug, Deserialize)]
pub struct ReviewPlanInput {
    pub todo_items: Vec<usize>, // 1-based index
}

pub struct ReviewPlan {
    agent: Arc<Agent>,
}

impl ReviewPlan {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for ReviewPlan {
    type Output = ReviewPlanOutput;
    type Params = ReviewPlanInput;

    fn get_name(&self) -> String {
        "review_plan".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        // Get the current todos from state
        let mut todos = match self.agent.get_state_value("todos").await {
            Some(Value::Array(arr)) => arr,
            _ => {
                return Err(anyhow::anyhow!("Could not find 'todos' in agent state or it's not an array."));
            }
        };

        let total_todos = todos.len();

        for idx_one_based in &params.todo_items {
            // Convert 1-based index to 0-based index
            if *idx_one_based == 0 {
                return Err(anyhow::anyhow!("todo_item index cannot be 0, indexing starts from 1."));
            }
            let idx_zero_based = *idx_one_based - 1;

            if idx_zero_based >= total_todos {
                return Err(anyhow::anyhow!(
                    "todo_item index {} out of range ({} todos, 1-based)",
                    idx_one_based,
                    total_todos
                ));
            }

            // Mark the todo at the given index as complete
            if let Some(Value::Object(map)) = todos.get_mut(idx_zero_based) {
                map.insert("completed".to_string(), Value::Bool(true));
            } else {
                return Err(anyhow::anyhow!(
                    "Todo item at index {} (1-based) is not a valid object.",
                    idx_one_based
                ));
            }
        }

        // Save the updated todos back to state
        self.agent.set_state_value("todos".to_string(), Value::Array(todos.clone())).await; // Clone needed for iteration below

        // Format the output string
        let todos_string = todos.iter()
            .map(|todo_val| {
                if let Value::Object(map) = todo_val {
                    let completed = map.get("completed").and_then(Value::as_bool).unwrap_or(false);
                    let todo_text = map.get("todo").and_then(Value::as_str).unwrap_or("Invalid todo text");
                    format!("[{}] {}", if completed { "x" } else { " " }, todo_text)
                } else {
                    "Invalid todo item format".to_string()
                }
            })
            .collect::<Vec<_>>()
            .join("\n");

        // Set review_needed to false after review
        self.agent
            .set_state_value(String::from("review_needed"), Value::Bool(false))
            .await;

        Ok(ReviewPlanOutput { success: true, todos: todos_string })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Marks one or more tasks as complete by their 1-based indices in the to-do list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "todo_items": {
                        "type": "array",
                        "items": {
                            "type": "integer",
                            "minimum": 1
                        },
                        "description": "A list of 1-based indices of the tasks to mark as complete (1 is the first item)."
                    }
                },
                "required": ["todo_items"]
            }
        })
    }
}
