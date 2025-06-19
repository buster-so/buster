use axum::{extract::Json, http::StatusCode, Extension};
use handlers::favorites::{update_favorites, FavoriteObject};
use middleware::AuthenticatedUser;
use uuid::Uuid;

pub async fn update_favorites_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<Vec<Uuid>>,
) -> Result<Json<Vec<FavoriteObject>>, (StatusCode, String)> {

    match update_favorites(&user, &payload).await {
        Ok(_) => {
            // After updating, fetch the updated list to return
            match handlers::favorites::list_favorites(&user).await {
                Ok(favorites) => Ok(Json(favorites)),
                Err(e) => {
                    tracing::error!("Error listing favorites after update: {:?}", e);
                    Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Error listing favorites after update: {:?}", e),
                    ))
                }
            }
        }
        Err(e) => {
            tracing::error!("Error updating favorites: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error updating favorites: {:?}", e),
            ))
        }
    }
}
