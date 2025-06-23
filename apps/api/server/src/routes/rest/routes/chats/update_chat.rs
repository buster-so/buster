use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use axum::Json;
use handlers::chats::update_chats_handler::{ChatUpdate, ChatUpdateResult};
use handlers::chats::update_chats_handler;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Update a single chat by ID
///
/// PUT /api/v1/chats/:id
pub async fn update_chat_route(
    Path(chat_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(update): Json<ChatUpdateRequest>,
) -> Result<ApiResponse<ChatUpdateResult>, (StatusCode, &'static str)> {
    let chat_update = ChatUpdate {
        id: chat_id,
        title: update.title,
    };
    
    match update_chats_handler(vec![chat_update], &user).await {
        Ok(results) => {
            if results.is_empty() {
                Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to update chat"))
            } else if !results[0].success {
                match &results[0].error {
                    Some(error) if error.contains("not found") => {
                        Err((StatusCode::NOT_FOUND, "Chat not found"))
                    }
                    Some(error) if error.contains("permission") => {
                        Err((StatusCode::FORBIDDEN, "You don't have permission to update this chat"))
                    }
                    _ => Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to update chat")),
                }
            } else {
                let result = ChatUpdateResult {
                    id: results[0].id,
                    success: results[0].success,
                    error: results[0].error.clone(),
                };
                Ok(ApiResponse::JsonData(result))
            }
        }
        Err(e) => {
            tracing::error!("Error updating chat {}: {}", chat_id, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to update chat"))
        }
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct ChatUpdateRequest {
    pub title: String,
}

#[cfg(test)]
mod tests {

}