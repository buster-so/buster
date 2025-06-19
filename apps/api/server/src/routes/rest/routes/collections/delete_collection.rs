use axum::{extract::Path, http::StatusCode, Extension, Json};
use handlers::collections::{
    delete_collection_handler, DeleteCollectionRequest, DeleteCollectionResponse,
};
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Delete a collection by ID
///
/// This endpoint deletes a single collection by its ID.
pub async fn delete_collection_by_id(
    Path(id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<DeleteCollectionResponse>, (StatusCode, String)> {
    // Call the handler with a single ID in a vector
    match delete_collection_handler(&user, vec![id]).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => handle_error(e)
    }
}

/// Delete multiple collections
///
/// This endpoint deletes one or more collections by their IDs provided in the request body.
pub async fn delete_collections(
    Extension(user): Extension<AuthenticatedUser>,
    Json(req): Json<DeleteCollectionRequest>,
) -> Result<Json<DeleteCollectionResponse>, (StatusCode, String)> {
    // Call the handler
    match delete_collection_handler(&user, req.ids).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => handle_error(e)
    }
}

// Helper function to handle errors
fn handle_error(e: anyhow::Error) -> Result<Json<DeleteCollectionResponse>, (StatusCode, String)> {
    tracing::error!("Error deleting collection: {}", e);

    // Return appropriate error response based on the error
    if e.to_string().contains("not found") {
        Err((
            StatusCode::NOT_FOUND,
            format!("Collection not found: {}", e),
        ))
    } else if e.to_string().contains("permission") {
        Err((StatusCode::FORBIDDEN, format!("Permission denied: {}", e)))
    } else {
        Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Error deleting collection: {}", e),
        ))
    }
}
