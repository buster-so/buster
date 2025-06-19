use crate::routes::rest::ApiResponse;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use handlers::messages::delete_message_handler;
use uuid::Uuid;
use middleware::AuthenticatedUser;

/// Delete a message and all subsequent messages in the same chat
///
/// This endpoint deletes a message and all messages in the same chat that were created after it.
pub async fn delete_message_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(message_id): Path<Uuid>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match delete_message_handler(user, message_id).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error deleting message: {}", e);

            if e.to_string().contains("Message not found") {
                Err((StatusCode::NOT_FOUND, "Message not found"))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to delete message",
                ))
            }
        }
    }
}
