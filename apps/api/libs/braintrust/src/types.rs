use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize, Serializer};
use std::collections::HashMap;
use uuid::Uuid;

/// Payload structure for the Braintrust API
#[derive(Serialize, Debug)]
pub struct EventPayload {
    pub events: Vec<Span>,
}

/// Span data structure with automatic timing
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Span {
    pub id: String,
    pub span_id: String,
    pub root_span_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub span_parents: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output: Option<serde_json::Value>,
    pub metrics: Metrics,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub span_attributes: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Metrics for tracking span performance
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Metrics {
    #[serde(serialize_with = "serialize_datetime_as_timestamp")]
    pub start: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none", serialize_with = "serialize_option_datetime_as_timestamp")]
    pub end: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<i64>, // Duration in milliseconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completion_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_tokens: Option<u32>,
}

impl Span {
    /// Create a new span with automatic start time
    pub fn new(name: &str, span_type: &str, root_span_id: &str, parent_span_id: Option<&str>) -> Self {
        let span_id = Uuid::new_v4().to_string();
        Self {
            id: Uuid::new_v4().to_string(),
            span_id: span_id.clone(),
            root_span_id: root_span_id.to_string(),
            span_parents: parent_span_id.map(|id| vec![id.to_string()]),
            input: None,
            output: None,
            metrics: Metrics {
                start: Utc::now(),
                end: None,
                duration_ms: None,
                prompt_tokens: None,
                completion_tokens: None,
                total_tokens: None,
            },
            span_attributes: Some(HashMap::from([
                ("name".to_string(), name.to_string()),
                ("type".to_string(), span_type.to_string()),
            ])),
            metadata: None,
        }
    }

    /// Update span with input
    pub fn set_input(mut self, input: serde_json::Value) -> Self {
        self.input = Some(input);
        self
    }

    /// Alias for set_input
    pub fn with_input(self, input: serde_json::Value) -> Self {
        self.set_input(input)
    }

    /// Update span with output and calculate duration
    pub fn set_output(mut self, output: serde_json::Value) -> Self {
        let end = Utc::now();
        self.output = Some(output);
        self.metrics.end = Some(end);
        self.metrics.duration_ms = Some((end - self.metrics.start).num_milliseconds());
        self
    }

    /// Alias for set_output
    pub fn with_output(self, output: serde_json::Value) -> Self {
        self.set_output(output)
    }

    /// Add token counts (e.g., for LLM spans)
    pub fn set_tokens(mut self, prompt_tokens: u32, completion_tokens: u32) -> Self {
        self.metrics.prompt_tokens = Some(prompt_tokens);
        self.metrics.completion_tokens = Some(completion_tokens);
        self.metrics.total_tokens = Some(prompt_tokens + completion_tokens);
        self
    }

    /// Add metadata as string value
    pub fn add_metadata(mut self, key: &str, value: &str) -> Self {
        let mut metadata = self.metadata.unwrap_or_default();
        metadata.insert(key.to_string(), serde_json::Value::String(value.to_string()));
        self.metadata = Some(metadata);
        self
    }

    /// Add structured JSON metadata
    pub fn add_json_metadata(mut self, key: &str, value: serde_json::Value) -> Self {
        let mut metadata = self.metadata.unwrap_or_default();
        metadata.insert(key.to_string(), value);
        self.metadata = Some(metadata);
        self
    }

    /// Alias for add_metadata that converts any displayable value to a string
    pub fn with_metadata<T: std::fmt::Display>(self, key: &str, value: T) -> Self {
        self.add_metadata(key, &value.to_string())
    }
    
    /// Alias for add_json_metadata that accepts a JSON value
    pub fn with_json_metadata(self, key: &str, value: serde_json::Value) -> Self {
        self.add_json_metadata(key, value)
    }

    /// Get the span ID
    pub fn span_id(&self) -> &str {
        &self.span_id
    }
}

/// Prompt data structure from Braintrust API
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Prompt {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub _xact_id: Option<String>,
    pub project_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub log_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub org_id: Option<String>,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_data: Option<PromptData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub function_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub function_data: Option<FunctionData>,
}

/// Function data containing type information
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FunctionData {
    #[serde(rename = "type")]
    pub function_type: String,
}

/// Prompt data containing the actual prompt content and configuration
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PromptData {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<PromptContent>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<PromptOptions>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parser: Option<PromptParser>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_functions: Option<Vec<ToolFunction>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub origin: Option<PromptOrigin>,
}

/// Content of the prompt - can be either completion or chat type
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PromptContent {
    #[serde(rename = "type")]
    pub content_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub messages: Option<Vec<ChatMessage>>,
}

/// Chat message for chat-type prompts
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Options for prompt execution
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PromptOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<PromptParams>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub position: Option<String>,
}

/// Parameters for prompt execution
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PromptParams {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_cache: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_completion_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frequency_penalty: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub presence_penalty: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_format: Option<ResponseFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_choice: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub function_call: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub n: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning_effort: Option<String>,
}

/// Response format specification
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ResponseFormat {
    #[serde(rename = "type")]
    pub format_type: String,
}

/// Parser configuration for prompt outputs
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PromptParser {
    #[serde(rename = "type")]
    pub parser_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_cot: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub choice_scores: Option<HashMap<String, f32>>,
}

/// Tool function definition
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ToolFunction {
    #[serde(rename = "type")]
    pub function_type: String,
    pub id: String,
}

/// Origin information for the prompt
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PromptOrigin {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_version: Option<String>,
}

// Custom serializer for DateTime<Utc> to convert to timestamp
fn serialize_datetime_as_timestamp<S>(date: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_i64(date.timestamp())
}

// Custom serializer for Option<DateTime<Utc>> to convert to timestamp
fn serialize_option_datetime_as_timestamp<S>(
    date: &Option<DateTime<Utc>>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    match date {
        Some(date) => serialize_datetime_as_timestamp(date, serializer),
        None => serializer.serialize_none(),
    }
}
