use axum::{
    extract::Path,
    http::StatusCode,
    Extension,
    Json,
};
use database::enums::AssetPermissionRole;
use handlers::chats::create_chat_sharing_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// POST /chats/:id/sharing - Create sharing permissions for a chat
///
/// # Arguments
/// * `user` - The authenticated user
/// * `id` - The chat ID
/// * `request` - Array of recipients to share with (email and role)
///
/// # Returns
/// * `ApiResponse<String>` - Success message
/// * `(StatusCode, String)` - Error message with appropriate status code
pub async fn create_chat_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<ShareRecipient>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!("Processing POST request for chat sharing with ID: {}, user_id: {}", id, user.id);

    // Convert request to a list of (email, role) pairs
    let emails_and_roles: Vec<(String, AssetPermissionRole)> = request
        .into_iter()
        .map(|recipient| (recipient.email, recipient.role))
        .collect();

    match create_chat_sharing_handler(&id, &user, emails_and_roles).await {
        Ok(_) => Ok(ApiResponse::JsonData("Sharing permissions created successfully".to_string())),
        Err(e) => {
            tracing::error!("Error creating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                Err((StatusCode::NOT_FOUND, format!("Chat not found: {}", e)))
            } else if error_message.contains("permission") {
                Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)))
            } else if error_message.contains("Invalid email") {
                Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)))
            } else {
                Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create sharing permissions: {}", e)))
            }
        }
    }
}