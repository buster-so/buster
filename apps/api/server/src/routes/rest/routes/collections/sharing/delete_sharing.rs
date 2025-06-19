use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::collections::sharing::delete_collection_sharing_handler;
use middleware::AuthenticatedUser;
use tracing;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// REST handler for deleting sharing permissions for a collection
///
/// # Arguments
/// * `Extension(user)` - The authenticated user making the request
/// * `Path(id)` - The collection ID
/// * `Json(request)` - Array of email addresses to remove sharing permissions for
///
/// # Returns
/// * Success response with message if successful
/// * Error response with appropriate status code if unsuccessful
pub async fn delete_collection_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<String>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    tracing::info!("Processing DELETE request for collection sharing with ID: {}, user_id: {}", id, user.id);

    match delete_collection_sharing_handler(&id, &user, request).await {
        Ok(_) => Ok(ApiResponse::JsonData("Sharing permissions deleted successfully".to_string())),
        Err(e) => {
            tracing::error!("Error deleting sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete sharing permissions: {}", e)))
        }
    }
}