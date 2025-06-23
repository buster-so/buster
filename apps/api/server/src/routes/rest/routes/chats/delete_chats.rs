use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use axum::Json;
use handlers::chats::delete_chats_handler::{ChatDeleteResult};
use handlers::chats::delete_chats_handler;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;

pub async fn delete_chats_route(
    Extension(user): Extension<AuthenticatedUser>,
    Json(chat_ids): Json<Vec<Uuid>>,
) -> Result<ApiResponse<Vec<ChatDeleteResult>>, (StatusCode, &'static str)> {
    match delete_chats_handler(chat_ids, &user).await {
        Ok(results) => Ok(ApiResponse::JsonData(results)),
        Err(e) => {
            tracing::error!("Error deleting chats: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to delete chats"))
        }
    }
} 