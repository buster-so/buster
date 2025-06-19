use serde::{Deserialize, Serialize};
use uuid::Uuid;

use litellm::AgentMessage;

/// A Thread represents a conversation between a user and the AI agent.
/// It contains a sequence of messages in chronological order.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentThread {
    /// Unique identifier for the thread
    pub id: Uuid,
    pub user_id: Uuid,
    /// Ordered sequence of messages in the conversation
    pub messages: Vec<AgentMessage>,
}

impl AgentThread {
    pub fn new(id: Option<Uuid>, user_id: Uuid, messages: Vec<AgentMessage>) -> Self {
        Self {
            id: id.unwrap_or(Uuid::new_v4()),
            user_id,
            messages,
        }
    }

    /// Set the developer message in the thread
    pub fn set_developer_message(&mut self, message: String) {
        // Look for an existing developer message
        if let Some(pos) = self
            .messages
            .iter()
            .position(|msg| matches!(msg, AgentMessage::Developer { .. }))
        {
            // Update existing developer message
            self.messages[pos] = AgentMessage::developer(message);
        } else {
            // Insert new developer message at the start
            self.messages.insert(0, AgentMessage::developer(message));
        }
    }

    /// Remove the most recent assistant message from the thread
    pub fn remove_last_assistant_message(&mut self) {
        if let Some(pos) = self
            .messages
            .iter()
            .rposition(|msg| matches!(msg, AgentMessage::Assistant { .. }))
        {
            self.messages.remove(pos);
        }
    }

    /// Add a user message to the thread
    pub fn add_user_message(&mut self, content: String) {
        self.messages.push(AgentMessage::user(content));
    }
} 