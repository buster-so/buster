use anyhow::Result;
use database::models::Chat;
use database::pool::get_pg_pool;
use database::schema::chats;
use crate::chats::get_chat_handler;
use crate::chats::types::ChatWithMessages;
use crate::messages::types::ChatMessage;
use crate::messages::types::ChatUserMessage;
use chrono::Utc;
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use uuid::Uuid;

pub async fn initialize_chat(
    prompt: String,
    message_id: Option<Uuid>,
    chat_id: Option<Uuid>,
    user: &AuthenticatedUser,
    user_org_id: Uuid,
) -> Result<(Uuid, Uuid, ChatWithMessages)> {
    let message_id = message_id.unwrap_or_else(Uuid::new_v4);

    if let Some(existing_chat_id) = chat_id {
        // Get existing chat - no need to create new chat in DB
        let mut existing_chat = get_chat_handler(&existing_chat_id, &user.id).await?;

        // Create new message
        let message = ChatMessage::new_with_messages(
            message_id,
            ChatUserMessage {
                request: prompt.clone(),
                sender_id: user.id.clone(),
                sender_name: user.name.clone().unwrap_or_default(),
                sender_avatar: None,
            },
            Vec::new(),
            Vec::new(),
            None,
        );

        // Add message to existing chat
        existing_chat.add_message(message);

        Ok((existing_chat_id, message_id, existing_chat))
    } else {
        // Create new chat since we don't have an existing one
        let chat_id = Uuid::new_v4();
        let chat = Chat {
            id: chat_id,
            title: prompt.to_string(),
            organization_id: user_org_id,
            created_by: user.id.clone(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            updated_by: user.id.clone(),
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
        };

        // Create initial message
        let message = ChatMessage::new_with_messages(
            message_id,
            ChatUserMessage {
                request: prompt.clone(),
                sender_id: user.id.clone(),
                sender_name: user.name.clone().unwrap_or_default(),
                sender_avatar: None,
            },
            Vec::new(),
            Vec::new(),
            None,
        );

        let mut chat_with_messages = ChatWithMessages::new(
            prompt.to_string(),
            user.id.to_string(),
            user.name.clone().unwrap_or_default(),
            None,
        );
        chat_with_messages.id = chat_id;
        chat_with_messages.add_message(message);

        // Only create new chat in DB if this is a new chat
        let mut conn = get_pg_pool().get().await?;
        insert_into(chats::table)
            .values(&chat)
            .execute(&mut conn)
            .await?;

        Ok((chat_id, message_id, chat_with_messages))
    }
}
