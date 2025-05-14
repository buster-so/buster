use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<LiteLlmMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub store: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning_effort: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frequency_penalty: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logit_bias: Option<HashMap<String, i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logprobs: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_logprobs: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_completion_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub n: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modalities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prediction: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub presence_penalty: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_format: Option<ResponseFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub service_tier: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<Vec<Tool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_choice: Option<ToolChoice>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parallel_tool_calls: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,
    #[serde(skip_serializing_if = "should_skip_metadata")]
    pub metadata: Option<Metadata>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Metadata {
    pub generation_name: String,
    pub user_id: String,
    pub session_id: String,
    pub trace_id: String,
}

impl Default for ChatCompletionRequest {
    fn default() -> Self {
        Self {
            model: String::new(),
            messages: Vec::new(),
            store: None,
            reasoning_effort: None,
            frequency_penalty: None,
            logit_bias: None,
            logprobs: None,
            top_logprobs: None,
            max_completion_tokens: None,
            n: None,
            presence_penalty: None,
            response_format: None,
            seed: None,
            stop: None,
            stream: None,
            temperature: None,
            top_p: None,
            tools: None,
            tool_choice: None,
            user: None,
            parallel_tool_calls: None,
            service_tier: None,
            metadata: None,
            modalities: None,
            prediction: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Copy)]
pub enum MessageProgress {
    InProgress,
    Complete,
}

impl Default for MessageProgress {
    fn default() -> Self {
        Self::Complete
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "role")]
#[serde(rename_all = "lowercase")]
pub enum LiteLlmMessage {
    #[serde(alias = "system")]
    Developer {
        #[serde(skip)]
        id: Option<String>,
        content: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
    User {
        #[serde(skip)]
        id: Option<String>,
        content: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
    Assistant {
        #[serde(skip)]
        id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        content: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        tool_calls: Option<Vec<ToolCall>>,
        #[serde(skip)]
        progress: MessageProgress,
        #[serde(skip)]
        initial: bool,
    },
    Tool {
        #[serde(skip)]
        id: Option<String>,
        content: String,
        tool_call_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
        #[serde(skip)]
        progress: MessageProgress,
    },
    Done,
}

// Helper methods for Message
// Intentionally leaving out name for now.
impl LiteLlmMessage {
    pub fn developer(content: impl Into<String>) -> Self {
        Self::Developer {
            id: None,
            content: content.into(),
            name: None,
        }
    }

    pub fn user(content: impl Into<String>) -> Self {
        Self::User {
            id: None,
            content: content.into(),
            name: None,
        }
    }

    pub fn assistant(
        id: Option<String>,
        content: Option<String>,
        tool_calls: Option<Vec<ToolCall>>,
        progress: MessageProgress,
        initial: Option<bool>,
        name: Option<String>,
    ) -> Self {
        let initial = initial.unwrap_or(false);

        Self::Assistant {
            id,
            content,
            name,
            tool_calls,
            progress,
            initial,
        }
    }

    pub fn tool(
        id: Option<String>,
        content: impl Into<String>,
        tool_call_id: impl Into<String>,
        name: Option<String>,
        progress: MessageProgress,
    ) -> Self {
        Self::Tool {
            id,
            content: content.into(),
            tool_call_id: tool_call_id.into(),
            name,
            progress,
        }
    }

    /// Get the role of any message variant
    pub fn get_role(&self) -> String {
        match self {
            Self::Developer { .. } => "developer".to_string(),
            Self::User { .. } => "user".to_string(),
            Self::Assistant { .. } => "assistant".to_string(),
            Self::Tool { .. } => "tool".to_string(),
            Self::Done => "done".to_string(),
        }
    }

    /// Get the content from any message variant that has content
    pub fn get_content(&self) -> Option<String> {
        match self {
            Self::Developer { content, .. } => Some(content.clone()),
            Self::User { content, .. } => Some(content.clone()),
            Self::Assistant { content, .. } => content.clone(),
            Self::Tool { content, .. } => Some(content.clone()),
            Self::Done => None,
        }
    }

    /// Get the tool_call_id if this is a Tool message
    pub fn get_tool_call_id(&self) -> Option<String> {
        match self {
            Self::Tool { tool_call_id, .. } => Some(tool_call_id.clone()),
            _ => None,
        }
    }

    /// Get tool_calls if this is an Assistant message
    pub fn get_tool_calls(&self) -> Option<Vec<ToolCall>> {
        match self {
            Self::Assistant { tool_calls, .. } => tool_calls.clone(),
            _ => None,
        }
    }

    pub fn set_id(&mut self, new_id: String) {
        match self {
            Self::Assistant { id, .. } => *id = Some(new_id.clone()),
            Self::Tool { id, .. } => *id = Some(new_id.clone()),
            Self::Developer { id, .. } => *id = Some(new_id.clone()),
            Self::User { id, .. } => *id = Some(new_id),
            Self::Done => {}
        }
    }

    pub fn get_id(&self) -> Option<String> {
        match self {
            Self::Assistant { id, .. } => id.clone(),
            Self::Tool { id, .. } => id.clone(),
            Self::Developer { id, .. } => id.clone(),
            Self::User { id, .. } => id.clone(),
            Self::Done => None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResponseFormat {
    #[serde(rename = "type")]
    pub type_: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub json_schema: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tool {
    #[serde(rename = "type")]
    pub tool_type: String,
    pub function: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ToolChoice {
    None,
    Auto,
    Required,
    #[serde(untagged)]
    Function {
        #[serde(rename = "type")]
        type_: String,
        function: FunctionToolChoice,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FunctionToolChoice {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FunctionCall {
    pub name: String,
    pub arguments: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeltaFunctionCall {
    pub name: Option<String>,
    pub arguments: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ToolCall {
    pub id: String,
    #[serde(rename = "type")]
    pub call_type: String,
    pub function: FunctionCall,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code_interpreter: Option<CodeInterpreter>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retrieval: Option<Retrieval>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeltaToolCall {
    pub id: Option<String>,
    #[serde(rename = "type")]
    pub call_type: Option<String>,
    pub function: Option<DeltaFunctionCall>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code_interpreter: Option<CodeInterpreter>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retrieval: Option<Retrieval>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CodeInterpreter {
    pub input: String,
    pub outputs: Vec<CodeInterpreterOutput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CodeInterpreterOutput {
    #[serde(rename = "type")]
    pub output_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<ImageOutput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageOutput {
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Retrieval {
    pub id: String,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatCompletionResponse {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_fingerprint: Option<String>,
    pub choices: Vec<Choice>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub service_tier: Option<String>,
    pub usage: Usage,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Choice {
    pub index: i32,
    pub message: LiteLlmMessage,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delta: Option<Delta>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logprobs: Option<LogProbs>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogProbs {
    pub content: Option<Vec<ContentLogProb>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContentLogProb {
    pub token: String,
    pub logprob: f32,
    pub bytes: Vec<u8>,
    pub top_logprobs: Vec<TopLogProb>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TopLogProb {
    pub token: String,
    pub logprob: f32,
    pub bytes: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Usage {
    pub prompt_tokens: i32,
    pub completion_tokens: i32,
    pub total_tokens: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completion_tokens_details: Option<CompletionTokensDetails>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompletionTokensDetails {
    pub reasoning_tokens: i32,
    pub accepted_prediction_tokens: i32,
    pub rejected_prediction_tokens: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatCompletionChunk {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_fingerprint: Option<String>,
    pub choices: Vec<StreamChoice>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StreamChoice {
    pub index: i32,
    pub delta: Delta,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logprobs: Option<LogProbs>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Delta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub function_call: Option<DeltaFunctionCall>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<DeltaToolCall>>,
}

// --- Embedding Types Start ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmbeddingRequest {
    pub model: String,
    pub input: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encoding_format: Option<String>, // e.g., "float" or "base64"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dimensions: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,
    // Include any other provider-specific params if needed, potentially using a HashMap<String, Value>
    // #[serde(flatten)]
    // pub extra_params: Option<HashMap<String, Value>>,
}

impl Default for EmbeddingRequest {
    fn default() -> Self {
        Self {
            model: "text-embedding-3-small".to_string(),
            input: vec![],
            encoding_format: Some("float".to_string()),
            dimensions: Some(1536),
            user: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmbeddingResponse {
    pub object: String, // e.g., "list"
    pub data: Vec<EmbeddingData>,
    pub model: String,
    pub usage: EmbeddingUsage,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmbeddingData {
    pub object: String, // e.g., "embedding"
    pub index: usize,
    pub embedding: Vec<f32>, // Assuming float encoding
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmbeddingUsage {
    pub prompt_tokens: u32,
    pub total_tokens: u32,
}

// --- Embedding Types End ---

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn test_chat_completion_request_serialization() {
        // Create the request body matching the curl example
        let request = ChatCompletionRequest {
            model: "gpt-4o".to_string(),
            messages: vec![
                LiteLlmMessage::developer("You are a helpful assistant."),
                LiteLlmMessage::user("Hello!"),
            ],
            ..Default::default()
        };

        // Serialize to JSON string
        let json = serde_json::to_string(&request).unwrap();

        // Print for debugging
        println!("Serialized JSON: {}", json);

        // Deserialize back to struct
        let deserialized: ChatCompletionRequest = serde_json::from_str(&json).unwrap();

        // Verify model
        assert_eq!(deserialized.model, "gpt-4o");

        // Verify messages
        assert_eq!(deserialized.messages.len(), 2);

        // Check first message (developer)
        match &deserialized.messages[0] {
            LiteLlmMessage::Developer { content, .. } => {
                assert_eq!(content, "You are a helpful assistant.");
            }
            _ => panic!("First message should be developer role"),
        }

        // Check second message (user)
        match &deserialized.messages[1] {
            LiteLlmMessage::User { content, .. } => {
                assert_eq!(content, "Hello!");
            }
            _ => panic!("Second message should be user role"),
        }
    }

    #[tokio::test]
    async fn test_chat_completion_response_serialization() {
        let response = ChatCompletionResponse {
            id: "chatcmpl-123".to_string(),
            object: "chat.completion".to_string(),
            created: 1677652288,
            model: "gpt-4o-mini".to_string(),
            system_fingerprint: Some("fp_44709d6fcb".to_string()),
            choices: vec![Choice {
                index: 0,
                message: LiteLlmMessage::assistant(
                    None,
                    Some("\n\nHello there, how may I assist you today?".to_string()),
                    None,
                    MessageProgress::Complete,
                    None,
                    None,
                ),
                logprobs: None,
                finish_reason: Some("stop".to_string()),
                delta: None,
            }],
            service_tier: Some("default".to_string()),
            usage: Usage {
                prompt_tokens: 9,
                completion_tokens: 12,
                total_tokens: 21,
                completion_tokens_details: Some(CompletionTokensDetails {
                    reasoning_tokens: 0,
                    accepted_prediction_tokens: 0,
                    rejected_prediction_tokens: 0,
                }),
            },
        };

        // Serialize to JSON string
        let json = serde_json::to_string_pretty(&response).unwrap();
        println!("Serialized JSON:\n{}", json);

        // Deserialize back to struct
        let deserialized: ChatCompletionResponse = serde_json::from_str(&json).unwrap();

        // Verify fields
        assert_eq!(deserialized.id, "chatcmpl-123");
        assert_eq!(deserialized.object, "chat.completion");
        assert_eq!(deserialized.created, 1677652288);
        assert_eq!(deserialized.model, "gpt-4o-mini");
        assert_eq!(
            deserialized.system_fingerprint,
            Some("fp_44709d6fcb".to_string())
        );
        assert_eq!(deserialized.service_tier, Some("default".to_string()));

        // Verify choice
        let choice = &deserialized.choices[0];
        assert_eq!(choice.index, 0);
        assert_eq!(choice.finish_reason, Some("stop".to_string()));

        // Verify message
        match &choice.message {
            LiteLlmMessage::Assistant {
                content,
                tool_calls,
                ..
            } => {
                assert_eq!(
                    content,
                    &Some("\n\nHello there, how may I assist you today?".to_string())
                );
                // Verify tool_calls is None since no tools were used
                assert!(tool_calls.is_none(), "Expected tool_calls to be None");
            }
            _ => panic!("Message should be assistant role"),
        }

        // Verify usage
        assert_eq!(deserialized.usage.prompt_tokens, 9);
        assert_eq!(deserialized.usage.completion_tokens, 12);
        assert_eq!(deserialized.usage.total_tokens, 21);

        // Verify completion tokens details
        let details = deserialized.usage.completion_tokens_details.unwrap();
        assert_eq!(details.reasoning_tokens, 0);
        assert_eq!(details.accepted_prediction_tokens, 0);
        assert_eq!(details.rejected_prediction_tokens, 0);
    }

    #[tokio::test]
    async fn test_chat_completion_request_with_tools() {
        let request = ChatCompletionRequest {
            model: "o1".to_string(),
            messages: vec![LiteLlmMessage::user(
                "Hello whats the weather in vineyard ut!",
            )],
            max_completion_tokens: Some(100),
            tools: Some(vec![Tool {
                tool_type: "function".to_string(),
                function: json!({
                    "name": "get_weather",
                    "description": "Get current weather information for a specific location",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The city and state, e.g., San Francisco, CA"
                            },
                            "unit": {
                                "type": "string",
                                "enum": ["celsius", "fahrenheit"],
                                "description": "The temperature unit to use"
                            }
                        },
                        "required": ["location"]
                    }
                }),
            }]),
            ..Default::default()
        };

        // Serialize to JSON string
        let json = serde_json::to_string_pretty(&request).unwrap();
        println!("Request JSON:\n{}", json);

        // Deserialize back
        let deserialized: ChatCompletionRequest = serde_json::from_str(&json).unwrap();

        // Verify fields
        assert_eq!(deserialized.model, "o1");
        assert_eq!(deserialized.max_completion_tokens, Some(100));

        // Verify message
        assert_eq!(deserialized.messages.len(), 1);
        match &deserialized.messages[0] {
            LiteLlmMessage::User { content, .. } => {
                assert_eq!(content, "Hello whats the weather in vineyard ut!");
            }
            _ => panic!("Expected user message"),
        }

        // Verify tool
        let tool = &deserialized.tools.as_ref().unwrap()[0];
        assert_eq!(tool.tool_type, "function");
        assert_eq!(
            tool.function.get("name").and_then(|v| v.as_str()),
            Some("get_weather")
        );
    }

    #[tokio::test]
    async fn test_chat_completion_response_with_detailed_usage() {
        let response = ChatCompletionResponse {
            id: "chatcmpl-Aty6m8WYqaTYvjE0OUd0x80kflE2k".to_string(),
            created: 1737902460,
            model: "o1-2024-12-17".to_string(),
            object: "chat.completion".to_string(),
            system_fingerprint: Some("fp_6675b66d18".to_string()),
            choices: vec![Choice {
                finish_reason: Some("length".to_string()),
                index: 0,
                message: LiteLlmMessage::assistant(
                    None,
                    Some("".to_string()),
                    None,
                    MessageProgress::Complete,
                    None,
                    None,
                ),
                delta: None,
                logprobs: None,
            }],
            usage: Usage {
                completion_tokens: 100,
                prompt_tokens: 85,
                total_tokens: 185,
                completion_tokens_details: Some(CompletionTokensDetails {
                    accepted_prediction_tokens: 0,
                    rejected_prediction_tokens: 0,
                    reasoning_tokens: 100,
                }),
            },
            service_tier: Some("default".to_string()),
        };

        // Serialize to JSON string
        let json = serde_json::to_string_pretty(&response).unwrap();
        println!("Response JSON:\n{}", json);

        // Deserialize back
        let deserialized: ChatCompletionResponse = serde_json::from_str(&json).unwrap();

        // Verify fields
        assert_eq!(deserialized.id, "chatcmpl-Aty6m8WYqaTYvjE0OUd0x80kflE2k");
        assert_eq!(deserialized.created, 1737902460);
        assert_eq!(deserialized.model, "o1-2024-12-17");
        assert_eq!(
            deserialized.system_fingerprint,
            Some("fp_6675b66d18".to_string())
        );

        // Verify choice
        let choice = &deserialized.choices[0];
        assert_eq!(choice.index, 0);
        assert_eq!(choice.finish_reason, Some("length".to_string()));

        // Verify message is empty
        match &choice.message {
            LiteLlmMessage::Assistant {
                content,
                tool_calls,
                ..
            } => {
                assert_eq!(content, &Some("".to_string()));
                assert!(tool_calls.is_none());
            }
            _ => panic!("Expected assistant message"),
        }

        // Verify usage
        assert_eq!(deserialized.usage.completion_tokens, 100);
        assert_eq!(deserialized.usage.prompt_tokens, 85);
        assert_eq!(deserialized.usage.total_tokens, 185);

        // Verify completion tokens details
        let details = deserialized.usage.completion_tokens_details.unwrap();
        assert_eq!(details.accepted_prediction_tokens, 0);
        assert_eq!(details.rejected_prediction_tokens, 0);
        assert_eq!(details.reasoning_tokens, 100);
    }

    #[tokio::test]
    async fn test_streaming_chat_completion_request() {
        let request = ChatCompletionRequest {
            model: "o1".to_string(),
            messages: vec![
                LiteLlmMessage::developer("You are a helpful assistant."),
                LiteLlmMessage::user("Hello!"),
            ],
            stream: Some(true),
            ..Default::default()
        };

        // Serialize to JSON string
        let json = serde_json::to_string_pretty(&request).unwrap();
        println!("Streaming Request JSON:\n{}", json);

        // Deserialize back
        let deserialized: ChatCompletionRequest = serde_json::from_str(&json).unwrap();

        // Verify fields
        assert_eq!(deserialized.model, "o1");
        assert_eq!(deserialized.stream, Some(true));

        // Verify messages
        assert_eq!(deserialized.messages.len(), 2);
        match &deserialized.messages[0] {
            LiteLlmMessage::Developer { content, .. } => {
                assert_eq!(content, "You are a helpful assistant.");
            }
            _ => panic!("First message should be developer role"),
        }
        match &deserialized.messages[1] {
            LiteLlmMessage::User { content, .. } => {
                assert_eq!(content, "Hello!");
            }
            _ => panic!("Second message should be user role"),
        }
    }

    #[tokio::test]
    async fn test_chat_completion_chunks() {
        // Test initial chunk with role
        let initial_chunk = ChatCompletionChunk {
            id: "chatcmpl-123".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 1694268190,
            model: "gpt-4o-mini".to_string(),
            system_fingerprint: Some("fp_44709d6fcb".to_string()),
            choices: vec![StreamChoice {
                index: 0,
                delta: Delta {
                    role: Some("assistant".to_string()),
                    content: Some("".to_string()),
                    function_call: None,
                    tool_calls: None,
                },
                logprobs: None,
                finish_reason: None,
            }],
        };

        // Test content chunk
        let content_chunk = ChatCompletionChunk {
            id: "chatcmpl-123".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 1694268190,
            model: "gpt-4o-mini".to_string(),
            system_fingerprint: Some("fp_44709d6fcb".to_string()),
            choices: vec![StreamChoice {
                index: 0,
                delta: Delta {
                    role: None,
                    content: Some("Hello".to_string()),
                    function_call: None,
                    tool_calls: None,
                },
                logprobs: None,
                finish_reason: None,
            }],
        };

        // Test final chunk
        let final_chunk = ChatCompletionChunk {
            id: "chatcmpl-123".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 1694268190,
            model: "gpt-4o-mini".to_string(),
            system_fingerprint: Some("fp_44709d6fcb".to_string()),
            choices: vec![StreamChoice {
                index: 0,
                delta: Delta {
                    role: None,
                    content: None,
                    function_call: None,
                    tool_calls: None,
                },
                logprobs: None,
                finish_reason: Some("stop".to_string()),
            }],
        };

        // Test serialization/deserialization of all chunks
        for (i, chunk) in vec![initial_chunk, content_chunk, final_chunk]
            .into_iter()
            .enumerate()
        {
            let json = serde_json::to_string_pretty(&chunk).unwrap();
            println!("Chunk {} JSON:\n{}", i, json);

            let deserialized: ChatCompletionChunk = serde_json::from_str(&json).unwrap();

            // Verify common fields
            assert_eq!(deserialized.id, "chatcmpl-123");
            assert_eq!(deserialized.object, "chat.completion.chunk");
            assert_eq!(deserialized.created, 1694268190);
            assert_eq!(deserialized.model, "gpt-4o-mini");
            assert_eq!(
                deserialized.system_fingerprint,
                Some("fp_44709d6fcb".to_string())
            );

            // Verify choice
            let choice = &deserialized.choices[0];
            assert_eq!(choice.index, 0);
            assert!(choice.logprobs.is_none());

            // Verify specific delta fields based on chunk type
            match i {
                0 => {
                    // Initial chunk
                    assert_eq!(choice.delta.role, Some("assistant".to_string()));
                    assert_eq!(choice.delta.content, Some("".to_string()));
                    assert!(choice.finish_reason.is_none());
                }
                1 => {
                    // Content chunk
                    assert!(choice.delta.role.is_none());
                    assert_eq!(choice.delta.content, Some("Hello".to_string()));
                    assert!(choice.finish_reason.is_none());
                }
                2 => {
                    // Final chunk
                    assert!(choice.delta.role.is_none());
                    assert!(choice.delta.content.is_none());
                    assert_eq!(choice.finish_reason, Some("stop".to_string()));
                }
                _ => unreachable!(),
            }
        }
    }

    #[tokio::test]
    async fn test_chat_completion_function_calling() {
        let request_json = r#"
        {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather like in Boston today?"
                }
            ],
            "tools": [
                {
                    "type": "function",
                    "function": {
                        "name": "get_current_weather",
                        "description": "Get the current weather in a given location",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "location": {
                                    "type": "string",
                                    "description": "The city and state, e.g. San Francisco, CA"
                                },
                                "unit": {
                                    "type": "string",
                                    "enum": ["celsius", "fahrenheit"]
                                }
                            },
                            "required": ["location"]
                        }
                    }
                }
            ],
            "tool_choice": {
                "type": "function",
                "function": {
                    "name": "get_current_weather"
                }
            }
        }
        "#;

        let deserialized_req: ChatCompletionRequest = serde_json::from_str(request_json).unwrap();

        assert_eq!(deserialized_req.model, "gpt-3.5-turbo");
        assert_eq!(deserialized_req.messages.len(), 1);
        assert_eq!(deserialized_req.messages[0].get_role(), "user");
        assert_eq!(deserialized_req.messages[0].get_content(), Some("What's the weather like in Boston today?".to_string()));

        let tool = &deserialized_req.tools.as_ref().unwrap()[0];
        assert_eq!(tool.tool_type, "function");
        
        let function_def = tool.function.as_object().unwrap();
        assert_eq!(
            function_def.get("name").and_then(|v| v.as_str()),
            Some("get_current_weather")
        );
        assert_eq!(
            function_def.get("description").and_then(|v| v.as_str()),
            Some("Get the current weather in a given location")
        );

        let response_json = r#"
        {
            "id": "chatcmpl-abc123",
            "object": "chat.completion",
            "created": 1699896916,
            "model": "gpt-3.5-turbo",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "The weather in Boston today is 75 degrees Fahrenheit."
                    },
                    "finish_reason": "tool_calls"
                }
            ],
            "usage": {
                "prompt_tokens": 82,
                "completion_tokens": 17,
                "total_tokens": 99
            }
        }
        "#;

        let deserialized_resp: ChatCompletionResponse = serde_json::from_str(response_json).unwrap();

        assert_eq!(deserialized_resp.id, "chatcmpl-abc123");
        assert_eq!(deserialized_resp.choices.len(), 1);
        assert_eq!(deserialized_resp.choices[0].finish_reason, Some("tool_calls".to_string()));

        let choice = &deserialized_resp.choices[0].message;
        assert_eq!(choice.get_role(), "assistant");
        assert_eq!(choice.get_content(), Some("The weather in Boston today is 75 degrees Fahrenheit.".to_string()));
    }

    #[tokio::test]
    async fn test_litellm_message_developer_constructor() {
        let msg = LiteLlmMessage::developer("System prompt here");
        assert_eq!(msg.get_role(), "developer");
        assert_eq!(msg.get_content(), Some("System prompt here".to_string()));
        assert!(msg.get_id().is_none());

        match msg {
            LiteLlmMessage::Developer { id, content, name } => {
                assert_eq!(content, "System prompt here");
                assert!(id.is_none());
                assert!(name.is_none());
            }
            _ => panic!("Expected Developer message"),
        }
    }

    #[tokio::test]
    async fn test_litellm_message_user_constructor() {
        let msg = LiteLlmMessage::user("User query here");
        assert_eq!(msg.get_role(), "user");
        assert_eq!(msg.get_content(), Some("User query here".to_string()));
        assert!(msg.get_id().is_none());

        match msg {
            LiteLlmMessage::User { id, content, name } => {
                assert_eq!(content, "User query here");
                assert!(id.is_none());
                assert!(name.is_none());
            }
            _ => panic!("Expected User message"),
        }
    }

    #[tokio::test]
    async fn test_litellm_message_assistant_constructor_all_some() {
        let tool_call_id_str = "call_123";
        let tool_call = ToolCall {
            id: tool_call_id_str.to_string(),
            call_type: "function".to_string(),
            function: FunctionCall {
                name: "get_weather".to_string(),
                arguments: "{\"location\": \"Boston\"}".to_string(),
            },
            code_interpreter: None,
            retrieval: None,
        };
        let assistant_id_str = "asst_id_001";
        let assistant_content_str = "Assistant response.";
        let assistant_name_str = "AssistantName";

        let msg = LiteLlmMessage::assistant(
            Some(assistant_id_str.to_string()),
            Some(assistant_content_str.to_string()),
            Some(vec![tool_call.clone()]),
            MessageProgress::Complete,
            Some(true), // initial = true
            Some(assistant_name_str.to_string()),
        );

        assert_eq!(msg.get_role(), "assistant");
        assert_eq!(msg.get_content(), Some(assistant_content_str.to_string()));
        assert_eq!(msg.get_id(), Some(assistant_id_str.to_string()));
        assert!(msg.get_tool_calls().is_some());
        assert_eq!(msg.get_tool_calls().as_ref().unwrap().len(), 1);
        assert_eq!(msg.get_tool_calls().as_ref().unwrap()[0].id, tool_call_id_str);

        match msg {
            LiteLlmMessage::Assistant { id, content, name, tool_calls, progress, initial } => {
                assert_eq!(id.as_deref(), Some(assistant_id_str));
                assert_eq!(content.as_deref(), Some(assistant_content_str));
                assert_eq!(name.as_deref(), Some(assistant_name_str));
                assert!(tool_calls.is_some());
                let tc = tool_calls.unwrap();
                assert_eq!(tc.len(), 1);
                assert_eq!(tc[0].id, tool_call_id_str);
                assert_eq!(progress, MessageProgress::Complete);
                assert_eq!(initial, true);
            }
            _ => panic!("Expected Assistant message"),
        }
    }

    #[tokio::test]
    async fn test_litellm_message_assistant_constructor_minimal() {
        let msg = LiteLlmMessage::assistant(
            None, 
            None, 
            None, 
            MessageProgress::InProgress, 
            None, // initial will default to false
            None
        );
        
        assert_eq!(msg.get_role(), "assistant");
        assert!(msg.get_content().is_none());
        assert!(msg.get_id().is_none());
        assert!(msg.get_tool_calls().is_none());

        match msg {
            LiteLlmMessage::Assistant { id, content, name, tool_calls, progress, initial } => {
                assert!(id.is_none());
                assert!(content.is_none());
                assert!(name.is_none());
                assert!(tool_calls.is_none());
                assert_eq!(progress, MessageProgress::InProgress);
                assert_eq!(initial, false); // Default value
            }
            _ => panic!("Expected Assistant message"),
        }
    }

    #[tokio::test]
    async fn test_litellm_message_tool_constructor() {
        let tool_msg_id_str = "tool_id_002";
        let tool_content_str = "Tool execution result";
        let tool_call_id_str = "call_123";
        let tool_name_str = "MyToolName";

        let msg = LiteLlmMessage::tool(
            Some(tool_msg_id_str.to_string()),
            tool_content_str.to_string(),
            tool_call_id_str.to_string(),
            Some(tool_name_str.to_string()),
            MessageProgress::Complete,
        );

        assert_eq!(msg.get_role(), "tool");
        assert_eq!(msg.get_content(), Some(tool_content_str.to_string()));
        assert_eq!(msg.get_id(), Some(tool_msg_id_str.to_string()));
        assert_eq!(msg.get_tool_call_id(), Some(tool_call_id_str.to_string()));

        match msg {
            LiteLlmMessage::Tool { id, content, tool_call_id, name, progress } => {
                assert_eq!(id.as_deref(), Some(tool_msg_id_str));
                assert_eq!(content, tool_content_str);
                assert_eq!(tool_call_id, tool_call_id_str);
                assert_eq!(name.as_deref(), Some(tool_name_str));
                assert_eq!(progress, MessageProgress::Complete);
            }
            _ => panic!("Expected Tool message"),
        }
    }
    
    #[tokio::test]
    async fn test_litellm_message_done_getters() {
        let msg = LiteLlmMessage::Done;
        assert_eq!(msg.get_role(), "done");
        assert!(msg.get_content().is_none());
        assert!(msg.get_tool_call_id().is_none());
        assert!(msg.get_tool_calls().is_none());
        assert!(msg.get_id().is_none());
    }

    #[tokio::test]
    async fn test_litellm_message_set_and_get_id() {
        let mut msg_dev = LiteLlmMessage::developer("Hello");
        msg_dev.set_id("dev_1".to_string());
        assert_eq!(msg_dev.get_id(), Some("dev_1".to_string()));

        let mut msg_user = LiteLlmMessage::user("Hi");
        msg_user.set_id("user_1".to_string());
        assert_eq!(msg_user.get_id(), Some("user_1".to_string()));

        let mut msg_asst = LiteLlmMessage::assistant(None, None, None, MessageProgress::Complete, None, None);
        msg_asst.set_id("asst_1".to_string());
        assert_eq!(msg_asst.get_id(), Some("asst_1".to_string()));

        let mut msg_tool = LiteLlmMessage::tool(None, "content", "tc_id", None, MessageProgress::Complete);
        msg_tool.set_id("tool_1".to_string());
        assert_eq!(msg_tool.get_id(), Some("tool_1".to_string()));
        
        // LiteLlmMessage::Done does not have an ID field to set
        let mut msg_done = LiteLlmMessage::Done;
        msg_done.set_id("done_1".to_string()); // This will arm, but get_id() will be None
        assert_eq!(msg_done.get_id(), None);
    }

    #[tokio::test]
    async fn test_chat_completion_request_default() {
        let req = ChatCompletionRequest::default();
        assert!(req.model.is_empty());
        assert!(req.messages.is_empty());
        assert!(req.store.is_none());
        assert!(req.reasoning_effort.is_none());
        assert!(req.frequency_penalty.is_none());
        assert!(req.logit_bias.is_none());
        assert!(req.logprobs.is_none());
        assert!(req.top_logprobs.is_none());
        assert!(req.max_completion_tokens.is_none());
        assert!(req.n.is_none());
        assert!(req.modalities.is_none());
        assert!(req.prediction.is_none());
        assert!(req.presence_penalty.is_none());
        assert!(req.response_format.is_none());
        assert!(req.seed.is_none());
        assert!(req.service_tier.is_none());
        assert!(req.stop.is_none());
        assert!(req.stream.is_none());
        assert!(req.temperature.is_none());
        assert!(req.top_p.is_none());
        assert!(req.tools.is_none());
        assert!(req.tool_choice.is_none());
        assert!(req.user.is_none());
        assert!(req.parallel_tool_calls.is_none());
        assert!(req.metadata.is_none());
    }

    #[tokio::test]
    async fn test_embedding_request_default() {
        let req = EmbeddingRequest::default();
        assert_eq!(req.model, "text-embedding-3-small");
        assert!(req.input.is_empty());
        assert_eq!(req.encoding_format, Some("float".to_string()));
        assert_eq!(req.dimensions, Some(1536));
        assert!(req.user.is_none());
    }

    #[tokio::test]
    async fn test_message_progress_default_and_equality() {
        assert_eq!(MessageProgress::default(), MessageProgress::Complete);
        assert_ne!(MessageProgress::InProgress, MessageProgress::Complete);
        assert_eq!(MessageProgress::InProgress, MessageProgress::InProgress);
        let prog_complete = MessageProgress::Complete;
        let prog_inprogress = MessageProgress::InProgress;
        assert_eq!(prog_complete, MessageProgress::Complete);
        assert_eq!(prog_inprogress, MessageProgress::InProgress);
    }
}

fn should_skip_metadata(metadata: &Option<Metadata>) -> bool {
    let env_var_condition_met = match env::var("LLM_BASE_URL") {
        Ok(val) => val == "https://api.openai.com/v1",
        Err(_) => false, // If env var is not set or any error, condition is not met
    };

    if env_var_condition_met {
        return true; // If env var condition is met, always skip
    }

    // If env var condition is not met, then skip only if metadata is None
    metadata.is_none()
}
