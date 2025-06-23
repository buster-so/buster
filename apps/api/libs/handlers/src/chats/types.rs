use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use database::enums::AssetPermissionRole;
use chrono::{DateTime, Utc};

use crate::messages::types::ChatMessage;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterShareIndividual {
    pub email: String,
    pub role: AssetPermissionRole,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatWithMessages {
    pub id: Uuid,
    pub title: String,
    pub is_favorited: bool,
    pub message_ids: Vec<String>,
    pub messages: HashMap<String, ChatMessage>,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
    pub created_by_id: String,
    pub created_by_name: String,
    pub created_by_avatar: Option<String>,
    // Sharing fields
    pub individual_permissions: Option<Vec<BusterShareIndividual>>,
    pub publicly_accessible: bool,
    pub public_expiry_date: Option<DateTime<Utc>>,
    pub public_enabled_by: Option<String>,
    pub public_password: Option<String>,
    pub permission: Option<AssetPermissionRole>,
}

impl ChatWithMessages {
    pub fn new(
        title: String,
        created_by_id: String,
        created_by_name: String,
        created_by_avatar: Option<String>,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: uuid::Uuid::new_v4(),
            title,
            is_favorited: false,
            message_ids: Vec::new(),
            messages: HashMap::new(),
            created_at: now.clone(),
            updated_at: now,
            created_by: created_by_id.clone(),
            created_by_id,
            created_by_name,
            created_by_avatar,
            individual_permissions: None,
            publicly_accessible: false,
            public_expiry_date: None,
            public_enabled_by: None,
            public_password: None,
            permission: None,
        }
    }

    pub fn new_with_messages(
        id: uuid::Uuid,
        title: String,
        messages: Vec<ChatMessage>,
        is_favorited: bool,
        created_by_id: String,
        created_by_name: String,
        created_by_avatar: Option<String>,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        
        // Convert messages into a HashMap and collect their IDs
        let message_ids: Vec<String> = messages.iter()
            .map(|msg| msg.id.to_string())
            .collect();
            
        let messages_map: HashMap<String, ChatMessage> = messages.into_iter()
            .map(|msg| (msg.id.to_string(), msg))
            .collect();

        Self {
            id,
            title,
            is_favorited,
            message_ids,
            messages: messages_map,
            created_at: now.clone(),
            updated_at: now,
            created_by: created_by_id.clone(),
            created_by_id,
            created_by_name,
            created_by_avatar,
            // Default values for sharing fields
            individual_permissions: None,
            publicly_accessible: false,
            public_expiry_date: None,
            public_enabled_by: None,
            public_password: None,
            permission: None,
        }
    }
    
    pub fn with_permissions(
        mut self,
        individual_permissions: Option<Vec<BusterShareIndividual>>,
        publicly_accessible: bool,
        public_expiry_date: Option<DateTime<Utc>>,
        public_enabled_by: Option<String>,
    ) -> Self {
        self.individual_permissions = individual_permissions;
        self.publicly_accessible = publicly_accessible;
        self.public_expiry_date = public_expiry_date;
        self.public_enabled_by = public_enabled_by;
        self
    }
    
    pub fn with_permission(mut self, permission: Option<AssetPermissionRole>) -> Self {
        self.permission = permission;
        self
    }

    pub fn add_message(&mut self, message: ChatMessage) {
        let message_id = message.id.to_string();
        if !self.message_ids.contains(&message_id) {
            self.message_ids.push(message_id.clone());
        }
        self.messages.insert(message_id, message);
        self.updated_at = chrono::Utc::now().to_rfc3339();
    }

    pub fn update_message(&mut self, message: ChatMessage) {
        let message_id = message.id.to_string();
        if !self.message_ids.contains(&message_id) {
            self.message_ids.push(message_id.clone());
        }
        self.messages.insert(message_id, message);
        self.updated_at = chrono::Utc::now().to_rfc3339();
    }
}