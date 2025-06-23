use axum::{
    extract::Path,
    http::StatusCode,
    Extension, Json,
};
use handlers::collections::sharing::UpdateCollectionSharingRequest;
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Update sharing permissions for a collection
///
/// This endpoint updates sharing permissions for a collection with the provided details.
/// Requires Owner or FullAccess permission.
///
/// Request body format:
/// ```json
/// {
///     "users": [
///         {
///             "email": "user@example.com",
///             "role": "CanView"
///         }
///     ],
///     "publicly_accessible": true,
///     "public_password": {"update": "password"},
///     "public_expiry_date": {"update": "2023-12-31T23:59:59Z"}
/// }
/// ```
/// All fields are optional. If a field is not provided, it won't be updated.
/// Note: Collections are not publicly accessible, so the publicly_* fields are ignored.
pub async fn update_collection_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateCollectionSharingRequest>,
) -> Result<Json<String>, (StatusCode, String)> {
    tracing::info!("Processing PUT request for collection sharing with ID: {}, user_id: {}", id, user.id);

    match handlers::collections::sharing::update_collection_sharing_handler(&id, &user, request).await {
        Ok(_) => Ok(Json("Sharing permissions updated successfully".to_string())),
        Err(e) => {
            tracing::error!("Error updating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update sharing permissions: {}", e)))
        }
    }
}