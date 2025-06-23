use axum::{
    extract::{Json, Path},
    http::StatusCode,
    Extension,
};
use handlers::messages::update_message_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Request body for updating a message
#[derive(Debug, Deserialize)]
pub struct UpdateMessageRequest {
    /// Optional feedback for the message ("positive" or "negative")
    pub feedback: Option<String>,
}

/// Update a specific message
///
/// This endpoint allows updating properties of a message, such as adding feedback.
pub async fn update_message_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(message_id): Path<Uuid>,
    Json(request): Json<UpdateMessageRequest>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match update_message_handler(user, message_id, request.feedback).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error updating message: {}", e);

            let error_message = e.to_string();
            if error_message.contains("Message not found") {
                Err((StatusCode::NOT_FOUND, "Message not found"))
            } else if error_message.contains("don't have permission") {
                Err((StatusCode::FORBIDDEN, "You don't have permission to update this message"))
            } else if error_message.contains("must be either") {
                Err((StatusCode::BAD_REQUEST, "Feedback must be either 'positive' or 'negative'"))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to update message",
                ))
            }
        }
    }
}
