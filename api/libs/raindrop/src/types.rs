use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Represents a single event to be tracked.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Event {
    pub user_id: String,
    pub event: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<HashMap<String, Value>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub attachments: Option<Vec<Attachment>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_data: Option<AiData>,

    // Optional fields provided by Raindrop API
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event_id: Option<String>, // Returned by Raindrop, optional on send

    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<DateTime<Utc>>,
}

/// Represents an attachment associated with an event.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Attachment {
    #[serde(rename = "type")] // Use `type` keyword in JSON
    pub attachment_type: String, // e.g., "image", "text", "json"
    pub value: String, // URL or content

    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>, // e.g., "input", "output"
}

/// Represents AI-specific data for an event.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AiData {
    pub model: String,
    pub input: String,
    pub output: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub convo_id: Option<String>,
}

/// Represents a single signal to be tracked.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Signal {
    pub event_id: String, // The ID of the event this signal relates to
    pub signal_name: String, // e.g., "thumbs_down", "corrected_answer"
    pub signal_type: String, // e.g., "feedback", "correction"

    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<HashMap<String, Value>>,

    // Optional fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<DateTime<Utc>>,
} 