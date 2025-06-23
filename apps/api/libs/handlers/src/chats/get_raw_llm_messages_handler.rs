use anyhow::Result;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use database::{
    pool::get_pg_pool,
    schema::{chats, messages},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct GetRawLlmMessagesRequest {
    pub chat_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetRawLlmMessagesResponse {
    pub chat_id: Uuid,
    pub raw_llm_messages: Value,
}

pub async fn get_raw_llm_messages_handler(
    chat_id: Uuid,
    organization_id: Uuid,
) -> Result<GetRawLlmMessagesResponse> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    // Get messages for the chat, ordered by creation time
    let raw_llm_messages: Value = messages::table
        .inner_join(chats::table.on(messages::chat_id.eq(chats::id)))
        .filter(messages::chat_id.eq(chat_id))
        .filter(chats::organization_id.eq(organization_id))
        .filter(messages::deleted_at.is_null())
        .order_by(messages::created_at.desc())
        .select(messages::raw_llm_messages)
        .order_by(messages::created_at.desc())
        .first::<Value>(&mut conn)
        .await?;

    Ok(GetRawLlmMessagesResponse {
        chat_id,
        raw_llm_messages,
    })
}
