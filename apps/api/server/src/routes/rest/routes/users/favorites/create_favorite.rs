use axum::{extract::Json, http::StatusCode, Extension};
use handlers::favorites::{create_favorites_bulk, CreateFavoriteReq, FavoriteObject};
use middleware::AuthenticatedUser;

pub async fn create_favorite_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Json(favorites): Json<Vec<CreateFavoriteReq>>,
) -> Result<Json<Vec<FavoriteObject>>, (StatusCode, String)> {
    match create_favorites_bulk(&user, &favorites).await {
        Ok(favorites) => Ok(Json(favorites)),
        Err(e) => {
            tracing::error!("Error creating favorites: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error creating favorites: {:?}", e),
            ))
        }
    }
}
