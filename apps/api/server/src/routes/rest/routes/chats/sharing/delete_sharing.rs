use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::chats::delete_chat_sharing_handler;
use middleware::AuthenticatedUser;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// REST handler for deleting sharing permissions for a chat
pub async fn delete_chat_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(emails): Json<Vec<String>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        chat_id = %id,
        user_id = %user.id,
        email_count = emails.len(),
        "Processing DELETE request for chat sharing permissions"
    );

    match delete_chat_sharing_handler(&id, &user, emails).await {
        Ok(_) => {
            info!(chat_id = %id, user_id = %user.id, "Successfully deleted chat sharing permissions");
            Ok(ApiResponse::JsonData("Sharing permissions deleted successfully".to_string()))
        }
        Err(e) => {
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Chat not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete sharing permissions: {}", e)))
        }
    }
}

#[cfg(test)]
mod tests {

}