use axum::{
    extract::Query,
    http::StatusCode,
    Extension, Json,
};
use handlers::collections::{
    list_collections_handler, ListCollectionsCollection, ListCollectionsRequest,
};
use middleware::AuthenticatedUser;

/// List collections
///
/// This endpoint returns a list of collections for the authenticated user.
pub async fn list_collections(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListCollectionsRequest>,
) -> Result<Json<Vec<ListCollectionsCollection>>, (StatusCode, String)> {
    // Call the handler
    match list_collections_handler(&user, query).await {
        Ok(collections) => Ok(Json(collections)),
        Err(e) => {
            tracing::error!("Error listing collections: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error listing collections: {}", e),
            ))
        }
    }
}
