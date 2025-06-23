use axum::{
    extract::Path,
    http::StatusCode,
    Extension, Json,
};
use handlers::collections::{update_collection_handler, UpdateCollectionRequest, CollectionState};
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Update a collection
///
/// This endpoint updates a collection with the provided details.
pub async fn update_collection(
    Path(collection_id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(req): Json<UpdateCollectionRequest>,
) -> Result<Json<CollectionState>, (StatusCode, String)> {
    // Call the handler
    match update_collection_handler(&user, collection_id, req).await {
        Ok(collection) => Ok(Json(collection)),
        Err(e) => {
            tracing::error!("Error updating collection: {}", e);
            
            // Return appropriate error response based on the error
            if e.to_string().contains("not found") {
                Err((
                    StatusCode::NOT_FOUND,
                    format!("Collection not found: {}", e),
                ))
            } else if e.to_string().contains("permission") {
                Err((
                    StatusCode::FORBIDDEN,
                    format!("Permission denied: {}", e),
                ))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Error updating collection: {}", e),
                ))
            }
        }
    }
}
