use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::favorites::{delete_favorite, delete_favorites_bulk, FavoriteObject};
use middleware::AuthenticatedUser;
use uuid::Uuid;

// Handler for DELETE /:id path parameter
pub async fn delete_favorite_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<FavoriteObject>>, (StatusCode, String)> {
    match delete_favorite(&user, &id).await {
        Ok(favorites) => Ok(Json(favorites)),
        Err(e) => {
            tracing::error!("Error deleting favorite: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error deleting favorite: {:?}", e),
            ))
        }
    }
}

// Handler for DELETE / with request body
pub async fn delete_favorites_bulk_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Json(ids): Json<Vec<Uuid>>,
) -> Result<Json<Vec<FavoriteObject>>, (StatusCode, String)> {
    match delete_favorites_bulk(&user, &ids).await {
        Ok(favorites) => Ok(Json(favorites)),
        Err(e) => {
            tracing::error!("Error deleting favorites: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error deleting favorites: {:?}", e),
            ))
        }
    }
}
