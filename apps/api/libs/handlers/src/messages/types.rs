use std::collections::HashMap;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

pub mod message_feedback;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub id: Uuid,
    pub request_message: Option<ChatUserMessage>,
    pub response_message_ids: Vec<String>,
    #[serde(default)]
    pub response_messages: HashMap<String, Value>,
    pub reasoning_message_ids: Vec<String>,
    #[serde(default)]
    pub reasoning_messages: HashMap<String, Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub final_reasoning_message: Option<String>,
    pub feedback: Option<String>,
    pub is_completed: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatUserMessage {
    pub request: Option<String>,
    pub sender_id: Uuid,
    pub sender_name: String,
    pub sender_avatar: Option<String>,
}

impl ChatMessage {
    pub fn new(
        request: Option<String>,
        sender_id: Uuid,
        sender_name: String,
        sender_avatar: Option<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            request_message: Some(ChatUserMessage {
                request,
                sender_id,
                sender_name,
                sender_avatar,
            }),
            response_message_ids: Vec::new(),
            response_messages: HashMap::new(),
            reasoning_message_ids: Vec::new(),
            reasoning_messages: HashMap::new(),
            created_at: now,
            updated_at: now,
            final_reasoning_message: None,
            feedback: None,
            is_completed: false,
        }
    }

    pub fn new_with_messages(
        id: Uuid,
        request_message: Option<ChatUserMessage>,
        response_messages: Vec<Value>,
        reasoning_messages: Vec<Value>,
        final_reasoning_message: Option<String>,
        created_at: chrono::DateTime<chrono::Utc>,
        updated_at: chrono::DateTime<chrono::Utc>,
        feedback: Option<String>,
        is_completed: bool,
    ) -> Self {
        let response_message_ids: Vec<String> = response_messages
            .iter()
            .filter_map(|msg| msg.get("id").and_then(|id| id.as_str()).map(String::from))
            .collect();

        let reasoning_message_ids: Vec<String> = reasoning_messages
            .iter()
            .filter_map(|msg| msg.get("id").and_then(|id| id.as_str()).map(String::from))
            .collect();

        let response_messages_map: HashMap<String, Value> = response_messages
            .into_iter()
            .filter_map(|msg| {
                let id = msg.get("id").and_then(|id| id.as_str())?;
                Some((id.to_string(), msg))
            })
            .collect();

        let reasoning_messages_map: HashMap<String, Value> = reasoning_messages
            .into_iter()
            .filter_map(|msg| {
                let id = msg.get("id").and_then(|id| id.as_str())?;
                Some((id.to_string(), msg))
            })
            .collect();

        Self {
            id,
            request_message,
            response_message_ids,
            response_messages: response_messages_map,
            reasoning_message_ids,
            reasoning_messages: reasoning_messages_map,
            created_at,
            updated_at,
            final_reasoning_message,
            feedback,
            is_completed,
        }
    }
}
