use axum::extract::Json;
use axum::http::StatusCode;
use axum::Extension;
use handlers::chats::duplicate_chat_handler;
use handlers::chats::types::ChatWithMessages;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Request to duplicate a chat
#[derive(Deserialize)]
pub struct DuplicateChatRequest {
    /// UUID of the source chat to duplicate
    pub id: Uuid,
    /// Optional UUID of the message to start duplication from
    pub message_id: Option<Uuid>,
}

/// Handler for POST /chats/duplicate endpoint
///
/// Duplicates an existing chat, including all messages and file references.
/// If message_id is provided, only messages from that point onward are duplicated.
/// Each file reference is duplicated with is_duplicate=true to track duplicated content.
pub async fn duplicate_chat_route(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<DuplicateChatRequest>,
) -> Result<ApiResponse<ChatWithMessages>, (StatusCode, String)> {
    // Call the handler function with the request parameters
    match duplicate_chat_handler(&request.id, request.message_id.as_ref(), &user).await {
        Ok(chat) => Ok(ApiResponse::JsonData(chat)),
        Err(e) => {
            tracing::error!("Error duplicating chat: {}", e);

            // Return different error codes based on the type of error
            let error_msg = e.to_string();
            if error_msg.contains("not found") {
                Err((StatusCode::NOT_FOUND, "Chat not found".to_string()))
            } else if error_msg.contains("permission") {
                Err((
                    StatusCode::FORBIDDEN,
                    "You don't have permission to view this chat".to_string(),
                ))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to duplicate chat".to_string(),
                ))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use axum::routing::post;
    use axum::Router;
    use chrono::Utc;
    use database::{
        enums::{AssetPermissionRole, AssetType, IdentityType, UserOrganizationRole},
        models::{AssetPermission, Chat, Message, MessageToFile, User},
        pool::get_pg_pool,
        schema::{asset_permissions, chats, messages, messages_to_files, users},
    };
    use diesel::insert_into;
    use diesel::prelude::*;
    use diesel_async::RunQueryDsl;
    use middleware::{types::OrganizationMembership, AuthenticatedUser};
    use serde_json::{json, Value};
    use std::collections::HashMap;
    use tower::ServiceExt;
    use uuid::Uuid;

    async fn setup_test_user() -> (AuthenticatedUser, User) {
        let user_id = Uuid::new_v4();
        let user = User {
            id: user_id,
            name: Some("Test User".to_string()),
            email: "test@example.com".to_string(),
            config: json!({}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: json!({}),
            avatar_url: None,
        };

        let mut conn = get_pg_pool().get().await.unwrap();
        insert_into(users::table)
            .values(&user)
            .execute(&mut conn)
            .await
            .unwrap();

        let org_id = Uuid::new_v4();
        let organizations = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::WorkspaceAdmin,
        }];

        let auth_user = AuthenticatedUser {
            id: user_id,
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            organizations,
            teams: Vec::new(),
            config: json!({}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: json!({}),
            avatar_url: None,
        };

        (auth_user, user)
    }

    async fn setup_test_chat(user: &User) -> (Uuid, Vec<Uuid>) {
        let chat_id = Uuid::new_v4();
        let now = Utc::now();

        // Create chat record
        let chat = Chat {
            id: chat_id,
            title: "Test Chat".to_string(),
            organization_id: Uuid::new_v4(), // Create a random org ID
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by: user.id,
            updated_by: user.id,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            most_recent_file_id: None,
            most_recent_file_type: None,
            most_recent_version_number: None,
        };

        let mut conn = get_pg_pool().get().await.unwrap();
        insert_into(chats::table)
            .values(&chat)
            .execute(&mut conn)
            .await
            .unwrap();

        // Create permission for user
        let permission = AssetPermission {
            identity_id: user.id,
            identity_type: IdentityType::User,
            asset_id: chat_id,
            asset_type: AssetType::Chat,
            role: AssetPermissionRole::Owner,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by: user.id,
            updated_by: user.id,
        };

        insert_into(asset_permissions::table)
            .values(&permission)
            .execute(&mut conn)
            .await
            .unwrap();

        // Create test messages
        let message_ids = vec![Uuid::new_v4(), Uuid::new_v4(), Uuid::new_v4()];

        for (i, message_id) in message_ids.iter().enumerate() {
            let message = Message {
                id: *message_id,
                request_message: Some(format!("Test message {}", i + 1)),
                response_messages: json!([{"id": format!("resp_{}", i), "type": "text", "message": format!("Response {}", i + 1)}]),
                reasoning: json!([{"id": format!("reason_{}", i), "type": "text", "message": format!("Reasoning {}", i + 1)}]),
                title: format!("Message {}", i + 1),
                raw_llm_messages: json!([]),
                final_reasoning_message: Some(format!("Final reasoning {}", i + 1)),
                chat_id,
                created_at: now + chrono::Duration::seconds(i as i64 * 10),
                updated_at: now + chrono::Duration::seconds(i as i64 * 10),
                deleted_at: None,
                created_by: user.id,
                feedback: None,
            };

            insert_into(messages::table)
                .values(&message)
                .execute(&mut conn)
                .await
                .unwrap();
        }

        (chat_id, message_ids)
    }

    async fn setup_test_file_reference(message_id: &Uuid, user_id: &Uuid) -> Uuid {
        let file_id = Uuid::new_v4();
        let now = Utc::now();

        let file_ref = MessageToFile {
            id: Uuid::new_v4(),
            message_id: *message_id,
            file_id,
            version_number: 1,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            is_duplicate: false,
        };

        let mut conn = get_pg_pool().get().await.unwrap();
        insert_into(messages_to_files::table)
            .values(&file_ref)
            .execute(&mut conn)
            .await
            .unwrap();

        file_id
    }

    fn create_test_app(auth_user: AuthenticatedUser) -> Router {
        Router::new()
            .route("/chats/duplicate", post(duplicate_chat_route))
            .layer(Extension(auth_user))
    }

    // Instead of unit tests that depend on a real database connection,
    // we should run the integration tests from the tests directory.
    // These unit tests might become outdated if the model structures change.
}
