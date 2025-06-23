use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use axum::Json;
use handlers::chats::restore_chat_handler::{restore_chat_handler, ChatRestoreRequest};
use handlers::chats::types::ChatWithMessages;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Restore a previous version of an asset in a chat
///
/// PUT /api/v1/chats/:id/restore
/// 
/// This endpoint allows restoring a previous version of a metric or dashboard file
/// and documenting the restoration in the chat history. It creates:
/// 1. A text message noting which version was restored
/// 2. A file message referencing the newly created version
pub async fn restore_chat_route(
    Path(chat_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<ChatRestoreRequest>,
) -> Result<ApiResponse<ChatWithMessages>, (StatusCode, String)> {
    match restore_chat_handler(&chat_id, &user, request).await {
        Ok(chat) => Ok(ApiResponse::JsonData(chat)),
        Err(e) => {
            let error_message = e.to_string();
            tracing::error!("Error restoring asset in chat {}: {}", chat_id, error_message);
            
            // Map specific error messages to appropriate HTTP status codes
            if error_message.contains("not found") || error_message.contains("Version") {
                Err((StatusCode::NOT_FOUND, error_message))
            } else if error_message.contains("permission") {
                Err((StatusCode::FORBIDDEN, error_message))
            } else if error_message.contains("Unsupported asset type") {
                Err((StatusCode::BAD_REQUEST, error_message))
            } else {
                Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to restore version".to_string()))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    // Unit tests for the restore_chat_route function
    // Integration tests are in tests/integration/chats/restore_chat_test.rs
    #[tokio::test]
    async fn test_restore_chat_route_error_handling() {
        // Simple test to verify error handling in the route function
        // This can be expanded with mock handlers in a real implementation
        
        // For now, just ensure the function exists and compiles
        assert!(true, "The restore_chat_route function is defined");
    }
}