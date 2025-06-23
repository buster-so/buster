use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use serde_json::Value;

/// The main output type for processors
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(untagged)]
pub enum ProcessedOutput {
    /// A text-based reasoning message
    Text(ReasoningText),
    /// A file-based reasoning message
    File(ReasoningFile),
    /// A pill-based reasoning message
    Pill(ReasoningPill),
}

/// Represents a text-based reasoning message
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct ReasoningText {
    pub id: String,
    #[serde(rename = "type")]
    pub reasoning_type: String,
    pub title: String,
    pub secondary_title: String,
    pub message: Option<String>,
    pub message_chunk: Option<String>,
    pub status: Option<String>,
}

/// Represents a file-based reasoning message
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct ReasoningFile {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: String,
    pub title: String,
    pub secondary_title: String,
    pub status: String,
    pub file_ids: Vec<String>,
    pub files: HashMap<String, File>,
}

/// Represents a reasoning pill message
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct ReasoningPill {
    pub id: String,
    #[serde(rename = "type")]
    pub thought_type: String,
    pub title: String,
    pub secondary_title: String,
    pub pill_containers: Option<Vec<ThoughtPillContainer>>,
    pub status: String,
}

/// Represents a container for thought pills
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct ThoughtPillContainer {
    pub title: String,
    pub pills: Vec<ThoughtPill>,
}

/// Represents an individual thought pill
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct ThoughtPill {
    pub id: String,
    pub text: String,
    #[serde(rename = "type")]
    pub thought_file_type: String,
}

/// Represents a file in the system
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct File {
    pub id: String,
    pub file_type: String,
    pub file_name: String,
    pub version_number: i32,
    pub status: String,
    pub file: FileContent,
    pub metadata: Option<Vec<FileMetadata>>,
}

/// Represents the content of a file
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct FileContent {
    pub text: Option<String>,
    pub text_chunk: Option<String>,
    pub modified: Option<Vec<(i32, i32)>>,
}

/// Represents metadata for a file
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct FileMetadata {
    pub key: String,
    pub value: String,
}

/// Represents the type of processor
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub enum ProcessorType {
    Plan,
    SearchDataCatalog,
    Metric,
    Dashboard,
    Custom(String),
}

impl ProcessorType {
    pub fn as_str(&self) -> &str {
        match self {
            ProcessorType::Plan => "plan",
            ProcessorType::SearchDataCatalog => "search_data_catalog",
            ProcessorType::Metric => "metric",
            ProcessorType::Dashboard => "dashboard",
            ProcessorType::Custom(s) => s,
        }
    }
}

impl From<&str> for ProcessorType {
    fn from(s: &str) -> Self {
        match s {
            "plan" => ProcessorType::Plan,
            "search_data_catalog" => ProcessorType::SearchDataCatalog,
            "metric" => ProcessorType::Metric,
            "dashboard" => ProcessorType::Dashboard,
            custom => ProcessorType::Custom(custom.to_string()),
        }
    }
}

/// Represents the different types of LiteLlmMessages that can be processed
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum MessageType {
    /// An Assistant message with tool calls (not null)
    AssistantToolCall,
    /// An Assistant message with content (text response)
    AssistantResponse,
    /// A Tool message (output from executed tool call)
    ToolOutput,
}

/// A tool call with its associated information
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct ToolCallInfo {
    /// The ID of the tool call
    pub id: String,
    /// The name of the tool
    pub name: String,
    /// The input parameters
    pub input: Value,
    /// The output content (if available)
    pub output: Option<Value>,
    /// The timestamp when the tool call was created
    pub timestamp: DateTime<Utc>,
    /// The current state of the tool call
    pub state: ToolCallState,
    /// The chunks received so far for this tool call
    pub chunks: Vec<String>,
}

/// The state of a tool call
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum ToolCallState {
    /// The tool call is in progress
    InProgress,
    /// The tool call is complete
    Complete,
    /// The tool call has an output
    HasOutput,
}

/// A processed message
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct ProcessedMessage {
    /// The ID of the message
    pub id: String,
    /// The type of the message
    pub message_type: MessageType,
    /// The processed content
    pub content: ProcessedOutput,
    /// The timestamp when the message was created
    pub timestamp: DateTime<Utc>,
}
