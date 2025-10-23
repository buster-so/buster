use axum::{
    extract::Query,
    http::StatusCode,
    Extension, Json,
};
use handlers::collections::{
    list_collections_handler, ListCollectionsRequest, ListCollectionsResponse,
};
use middleware::AuthenticatedUser;

/// List collections
///
/// This endpoint returns a paginated list of collections for the authenticated user.
pub async fn list_collections(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListCollectionsRequest>,
) -> Result<Json<ListCollectionsResponse>, (StatusCode, String)> {
    // Call the handler
    match list_collections_handler(&user, query).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => {
            tracing::error!("Error listing collections: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error listing collections: {}", e),
            ))
        }
    }
}
