use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::tools::ToolExecutor;

#[derive(Debug, Deserialize, Serialize)]
pub struct MessageUserClarifyingQuestionInput {
    text: String,
}

// Define the new standard output struct
#[derive(Debug, Serialize, Deserialize)]
pub struct MessageUserClarifyingQuestionOutput {
    pub success: bool,
}

pub struct MessageUserClarifyingQuestion;

impl MessageUserClarifyingQuestion {
    pub fn new() -> Self {
        Self
    }

    pub fn get_name() -> String {
        "message_user_clarifying_question".to_string()
    }
}

#[async_trait]
impl ToolExecutor for MessageUserClarifyingQuestion {
    type Output = MessageUserClarifyingQuestionOutput;
    type Params = MessageUserClarifyingQuestionInput;

    fn get_name(&self) -> String {
        "message_user_clarifying_question".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        // Similar to message_notify_user, this tool validates the schema and confirms
        // the question text. The actual interaction logic resides elsewhere.
        Ok(MessageUserClarifyingQuestionOutput { success: true })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Use if you need to send a clarifying question to the user. You should only use this if the user request is so vague or ambiguous that you cannot determine what data to search for.",
            "parameters": {
                "type": "object",
                "required": [
                "text"
                ],
                "properties": {
                "text": {
                    "type": "string",
                    "description": "Message text to display to user. **Supports markdown formatting**."
                }
                },
                "additionalProperties": false
            }
        })
    }
} 