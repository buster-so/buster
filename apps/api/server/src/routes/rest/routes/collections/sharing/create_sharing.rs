use axum::{
    extract::Path,
    http::StatusCode,
    Extension,
    Json,
};
use handlers::collections::sharing::{create_collection_sharing_handler, ShareRecipient};
use middleware::AuthenticatedUser;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// REST handler for creating sharing permissions for a collection
pub async fn create_collection_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<ShareRecipient>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!("Processing POST request for collection sharing with ID: {}, user_id: {}", id, user.id);

    match create_collection_sharing_handler(&id, &user, request).await {
        Ok(_) => Ok(ApiResponse::JsonData("Sharing permissions created successfully".to_string())),
        Err(e) => {
            tracing::error!("Error creating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create sharing permissions: {}", e)))
        }
    }
}