use crate::routes::rest::ApiResponse;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use handlers::chats::get_chat_handler;
use handlers::chats::types::ChatWithMessages;
use uuid::Uuid;
use middleware::AuthenticatedUser;

pub async fn get_chat_route(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<ChatWithMessages>, (StatusCode, &'static str)> {
    let thread_with_messages = match get_chat_handler(&id, &user, false).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting chat: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get chat"));
        }
    };

    Ok(ApiResponse::JsonData(thread_with_messages))
}
