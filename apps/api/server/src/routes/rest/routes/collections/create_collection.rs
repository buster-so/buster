use axum::{http::StatusCode, Extension, Json};
use handlers::collections::{create_collection_handler, CollectionState, CreateCollectionRequest};
use middleware::AuthenticatedUser;

/// Create a new collection
///
/// This endpoint creates a new collection with the provided details.
pub async fn create_collection(
    Extension(user): Extension<AuthenticatedUser>,
    Json(req): Json<CreateCollectionRequest>,
) -> Result<Json<CollectionState>, (StatusCode, String)> {
    // Call the handler with the authenticated user
    match create_collection_handler(&user, req).await {
        Ok(collection) => Ok(Json(collection)),
        Err(e) => {
            tracing::error!("Error creating collection: {}", e);

            // Return appropriate error response based on the error
            if e.to_string().contains("permission") {
                Err((StatusCode::FORBIDDEN, format!("Permission denied: {}", e)))
            } else if e.to_string().contains("active organization") {
                Err((StatusCode::BAD_REQUEST, format!("Organization error: {}", e)))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Error creating collection: {}", e),
                ))
            }
        }
    }
}
