use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::chats::get_chat_handler::get_chat_handler;
use crate::chats::types::ChatWithMessages;
use database::enums::{AssetPermissionRole, AssetType, IdentityType, WorkspaceSharing};
use database::helpers::chats::fetch_chat_with_permission;
use database::models::{AssetPermission, Chat, Message, MessageToFile};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, chats, messages, messages_to_files};
use sharing::check_permission_access;

/// Handler function to duplicate an existing chat
///
/// # Arguments
/// * `chat_id` - UUID of the source chat to duplicate
/// * `message_id` - Optional UUID of a message in the chat; if provided, only messages created at or after this message will be duplicated
/// * `user` - The authenticated user making the request
///
/// # Returns
/// * `Result<ChatWithMessages>` - The newly created chat with all duplicated messages
pub async fn duplicate_chat_handler(
    chat_id: &Uuid,
    message_id: Option<&Uuid>,
    user: &AuthenticatedUser,
) -> Result<ChatWithMessages> {
    // First check if the user has permission to view the source chat
    let chat_with_permission = fetch_chat_with_permission(chat_id, &user.id).await?;

    // If chat not found, return error
    let chat_with_permission = match chat_with_permission {
        Some(cwp) => cwp,
        None => return Err(anyhow!("Chat not found")),
    };

    // Check if user has permission to view the chat
    // Users need at least CanView permission or any higher permission
    let has_permission = check_permission_access(
        chat_with_permission.permission,
        &[
            AssetPermissionRole::CanView,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        chat_with_permission.chat.organization_id,
        &user.organizations,
        chat_with_permission.chat.workspace_sharing,
    );

    // If user is the creator, they automatically have access
    let is_creator = chat_with_permission.chat.created_by == user.id;

    if !has_permission && !is_creator {
        return Err(anyhow!("You don't have permission to view this chat"));
    }

    let mut conn = get_pg_pool().get().await?;

    // 1. Create a new chat record
    let source_chat = chat_with_permission.chat;
    let new_chat_id = Uuid::new_v4();
    let now = Utc::now();

    // Append (Copy) to the title
    let new_title = format!("{} (Copy)", source_chat.title);

    let new_chat = Chat {
        id: new_chat_id,
        title: new_title,
        organization_id: source_chat.organization_id,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
        publicly_accessible: false, // Start with private access
        publicly_enabled_by: None,
        public_expiry_date: None,
        most_recent_file_id: source_chat.most_recent_file_id,
        most_recent_file_type: source_chat.most_recent_file_type,
        most_recent_version_number: source_chat.most_recent_version_number,
        workspace_sharing: WorkspaceSharing::None,
        workspace_sharing_enabled_at: None,
        workspace_sharing_enabled_by: None,
    };

    // Insert the new chat record
    diesel::insert_into(chats::table)
        .values(&new_chat)
        .execute(&mut conn)
        .await?;

    // 2. Set permissions for the new chat (owner for the current user)
    let new_permission = AssetPermission {
        identity_id: user.id,
        identity_type: IdentityType::User,
        asset_id: new_chat_id,
        asset_type: AssetType::Chat,
        role: AssetPermissionRole::Owner,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
    };

    diesel::insert_into(asset_permissions::table)
        .values(&new_permission)
        .execute(&mut conn)
        .await?;

    // 3. Determine which messages to duplicate based on message_id parameter
    let messages_to_duplicate = match message_id {
        Some(msg_id) => {
            // Get the specific message and check if it belongs to the chat
            let message = messages::table
                .filter(messages::id.eq(msg_id))
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .first::<Message>(&mut conn)
                .await?;

            // Get this message and all older messages (messages created at or before this message)
            messages::table
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .filter(messages::created_at.le(message.created_at))
                .order_by(messages::created_at.asc())
                .load::<Message>(&mut conn)
                .await?
        }
        None => {
            // Get all non-deleted messages from the chat
            messages::table
                .filter(messages::chat_id.eq(chat_id))
                .filter(messages::deleted_at.is_null())
                .order_by(messages::created_at.asc())
                .load::<Message>(&mut conn)
                .await?
        }
    };

    // 4. Duplicate each message
    for source_message in messages_to_duplicate {
        let new_message_id = Uuid::new_v4();

        // Create a new message record
        let new_message = Message {
            id: new_message_id,
            request_message: source_message.request_message.clone(),
            response_messages: source_message.response_messages.clone(),
            reasoning: source_message.reasoning.clone(),
            title: source_message.title.clone(),
            raw_llm_messages: source_message.raw_llm_messages.clone(),
            final_reasoning_message: source_message.final_reasoning_message.clone(),
            chat_id: new_chat_id,
            created_at: source_message.created_at,
            updated_at: source_message.updated_at,
            deleted_at: None,
            created_by: user.id,
            feedback: source_message.feedback.clone(),
            is_completed: true,
            post_processing_message: source_message.post_processing_message.clone(),
        };

        // Insert the new message record
        diesel::insert_into(messages::table)
            .values(&new_message)
            .execute(&mut conn)
            .await?;

        // 5. Duplicate associated file references with is_duplicate flag
        let file_references = messages_to_files::table
            .filter(messages_to_files::message_id.eq(source_message.id))
            .filter(messages_to_files::deleted_at.is_null())
            .load::<MessageToFile>(&mut conn)
            .await?;

        for file_ref in file_references {
            let new_file_ref = MessageToFile {
                id: Uuid::new_v4(),
                message_id: new_message_id,
                file_id: file_ref.file_id,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                is_duplicate: true, // Mark as duplicate
                version_number: file_ref.version_number,
            };

            diesel::insert_into(messages_to_files::table)
                .values(&new_file_ref)
                .execute(&mut conn)
                .await?;
        }
    }

    // 6. Return the new chat with all messages
    get_chat_handler(&new_chat_id, user, false).await
}
