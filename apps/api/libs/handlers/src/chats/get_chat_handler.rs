use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::enums::MessageFeedback;
use diesel::prelude::Queryable;
use diesel::{ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde_json::Value;
use tokio;
use uuid::Uuid;

use crate::chats::types::{BusterShareIndividual, ChatWithMessages};
use crate::messages::types::{ChatMessage, ChatUserMessage};
use database::schema::{asset_permissions, chats, messages, users};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::chats::fetch_chat_with_permission,
    pool::get_pg_pool,
};
use sharing::check_permission_access;

#[derive(Queryable)]
pub struct ChatWithUser {
    pub id: Uuid,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_id: Uuid,
    pub user_name: Option<String>,
    pub user_email: String,
    pub user_attributes: Value,
}

#[derive(Queryable)]
pub struct MessageWithUser {
    pub id: Uuid,
    pub request_message: Option<String>,
    pub response_messages: Value,
    pub reasoning: Value,
    pub final_reasoning_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_id: Uuid,
    pub user_name: Option<String>,
    pub user_attributes: Value,
    pub feedback: Option<String>,
    pub is_completed: bool,
}

#[derive(Queryable)]
struct AssetPermissionInfo {
    role: AssetPermissionRole,
    email: String,
    name: Option<String>,
}

pub async fn get_chat_handler(
    chat_id: &Uuid,
    user: &AuthenticatedUser,
    follow_up: bool,
) -> Result<ChatWithMessages> {
    // First check if the user has permission to view this chat
    let chat_with_permission = fetch_chat_with_permission(chat_id, &user.id).await?;

    // If chat not found, return error
    let chat_with_permission = match chat_with_permission {
        Some(cwp) => cwp,
        None => return Err(anyhow!("Chat not found")),
    };

    // A small exception for where we use get chat handler in the post_chat_handler.rs
    // if a follow up, user needs to have write access.
    let access_requirement = if follow_up {
        vec![
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ]
    } else {
        vec![
            AssetPermissionRole::CanView,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
            AssetPermissionRole::CanEdit,
        ]
    };

    // Check if user has permission to view the chat
    // Users need at least CanView permission, or any higher permission
    let has_permission = check_permission_access(
        chat_with_permission.permission,
        &access_requirement,
        chat_with_permission.chat.organization_id,
        &user.organizations,
    );

    // If user is the creator, they automatically have access
    let is_creator = chat_with_permission.chat.created_by == user.id;

    if !has_permission && !is_creator {
        return Err(anyhow!("You don't have permission to view this chat"));
    }

    // Run messages query
    let messages_future = {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
        };

        let chat_id = *chat_id;

        tokio::spawn(async move {
            messages::table
                .inner_join(users::table.on(messages::created_by.eq(users::id)))
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .order_by(messages::created_at.asc())
                .select((
                    messages::id,
                    messages::request_message,
                    messages::response_messages,
                    messages::reasoning,
                    messages::final_reasoning_message,
                    messages::created_at,
                    messages::updated_at,
                    users::id,
                    users::name.nullable(),
                    users::attributes,
                    messages::feedback.nullable(),
                    messages::is_completed,
                ))
                .load::<MessageWithUser>(&mut conn)
                .await
        })
    };

    // Run permission query concurrently as well
    let permissions_future = {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
        };

        let chat_id = *chat_id;

        tokio::spawn(async move {
            // Query individual permissions for this chat
            let permissions = asset_permissions::table
                .inner_join(users::table.on(users::id.eq(asset_permissions::identity_id)))
                .filter(asset_permissions::asset_id.eq(chat_id))
                .filter(asset_permissions::asset_type.eq(AssetType::Chat))
                .filter(asset_permissions::identity_type.eq(IdentityType::User))
                .filter(asset_permissions::deleted_at.is_null())
                .select((asset_permissions::role, users::email, users::name))
                .load::<AssetPermissionInfo>(&mut conn)
                .await;

            // Query publicly_accessible and related fields
            let public_info = chats::table
                .filter(chats::id.eq(chat_id))
                .select((
                    chats::publicly_accessible,
                    chats::publicly_enabled_by,
                    chats::public_expiry_date,
                ))
                .first::<(bool, Option<Uuid>, Option<DateTime<Utc>>)>(&mut conn)
                .await;

            // Return both results
            (permissions, public_info)
        })
    };

    // Get thread information from the chat we already fetched
    let thread = ChatWithUser {
        id: chat_with_permission.chat.id,
        title: chat_with_permission.chat.title,
        created_at: chat_with_permission.chat.created_at,
        updated_at: chat_with_permission.chat.updated_at,
        user_id: chat_with_permission.chat.created_by,
        user_name: None,              // We'll need to fetch this
        user_email: String::new(),    // We'll need to fetch this
        user_attributes: Value::Null, // We'll need to fetch this
    };

    // Fetch the creator's information
    let creator_future = {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
        };

        let creator_id = chat_with_permission.chat.created_by;

        tokio::spawn(async move {
            users::table
                .filter(users::id.eq(creator_id))
                .select((users::name.nullable(), users::email, users::attributes))
                .first::<(Option<String>, String, Value)>(&mut conn)
                .await
        })
    };

    // Wait for all queries and handle errors
    let (messages, permissions_and_public_info, creator_info) = tokio::try_join!(
        async move {
            messages_future
                .await
                .map_err(|e| anyhow!("Messages task failed: {}", e))?
                .map_err(|e| anyhow!("Failed to load messages: {}", e))
        },
        async move {
            permissions_future
                .await
                .map_err(|e| anyhow!("Permissions task failed: {}", e))
        },
        async move {
            creator_future
                .await
                .map_err(|e| anyhow!("Creator info task failed: {}", e))?
                .map_err(|e| anyhow!("Failed to load creator info: {}", e))
        }
    )?;

    // Unpack the permissions and public info results
    let (permissions_result, public_info_result) = permissions_and_public_info;

    // Unpack creator info
    let (creator_name, creator_email, creator_attributes) = creator_info;

    // Complete the thread with creator info
    let thread = ChatWithUser {
        id: thread.id,
        title: thread.title,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        user_id: thread.user_id,
        user_name: creator_name,
        user_email: creator_email,
        user_attributes: creator_attributes,
    };

    // Transform messages into ThreadMessage format
    let thread_messages: Vec<ChatMessage> = messages
        .into_iter()
        .map(|msg| {
            let sender_avatar = msg
                .user_attributes
                .get("avatar")
                .and_then(|v| v.as_str())
                .map(String::from);

            // Convert response_messages and reasoning to Vec<Value>
            let response_messages = msg
                .response_messages
                .as_array()
                .map(|arr| arr.to_vec())
                .unwrap_or_default();

            let reasoning = msg
                .reasoning
                .as_array()
                .map(|arr| arr.to_vec())
                .unwrap_or_default();

            let request_message = if let Some(request_message) = msg.request_message {
                Some(ChatUserMessage {
                    request: Some(request_message),
                    sender_id: msg.user_id,
                    sender_name: msg.user_name.unwrap_or_else(|| "Unknown".to_string()),
                    sender_avatar,
                })
            } else {
                None
            };

            ChatMessage::new_with_messages(
                msg.id,
                request_message,
                response_messages,
                reasoning,
                msg.final_reasoning_message,
                msg.created_at,
                msg.updated_at,
                msg.feedback,
                msg.is_completed,
            )
        })
        .collect();

    // Get avatar from creator attributes
    let created_by_avatar = thread
        .user_attributes
        .get("avatar")
        .and_then(|v| v.as_str())
        .map(String::from);

    // Process permissions data
    let individual_permissions = match permissions_result {
        Ok(permissions) => {
            if permissions.is_empty() {
                None
            } else {
                Some(
                    permissions
                        .into_iter()
                        .map(|p| BusterShareIndividual {
                            email: p.email,
                            role: p.role,
                            name: p.name,
                        })
                        .collect::<Vec<BusterShareIndividual>>(),
                )
            }
        }
        Err(_) => None,
    };

    // Get public access info
    let (publicly_accessible, publicly_enabled_by, public_expiry_date) = match public_info_result {
        Ok((accessible, enabled_by_id, expiry)) => {
            // Get the user info for publicly_enabled_by if it exists
            let enabled_by_email = if let Some(enabled_by_id) = enabled_by_id {
                let mut conn = match get_pg_pool().get().await {
                    Ok(conn) => conn,
                    Err(_) => return Err(anyhow!("Failed to get database connection")),
                };

                users::table
                    .filter(users::id.eq(enabled_by_id))
                    .select(users::email)
                    .first::<String>(&mut conn)
                    .await
                    .ok()
            } else {
                None
            };

            (accessible, enabled_by_email, expiry)
        }
        Err(_) => (false, None, None),
    };

    // Construct and return the ChatWithMessages with permissions
    let chat = ChatWithMessages::new_with_messages(
        thread.id,
        thread.title,
        thread_messages,
        false, // is_favorited not implemented in current schema
        thread.user_id.to_string(),
        thread.user_name.unwrap_or_else(|| "Unknown".to_string()),
        created_by_avatar,
    );

    // Get the user's permission
    let user_permission = chat_with_permission.permission;

    // Add permissions
    Ok(chat
        .with_permissions(
            individual_permissions,
            publicly_accessible,
            public_expiry_date,
            publicly_enabled_by,
        )
        .with_permission(user_permission))
}
