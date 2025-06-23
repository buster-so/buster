use axum::{
    routing::{get, post, put, delete},
    Router,
};

// Import handlers
mod list_favorites;
mod create_favorite;
mod delete_favorite;
mod update_favorites;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_favorites::list_favorites_handler))
        .route("/", post(create_favorite::create_favorite_handler))
        .route("/:id", delete(delete_favorite::delete_favorite_handler))
        .route("/", delete(delete_favorite::delete_favorites_bulk_handler))
        .route("/", put(update_favorites::update_favorites_handler))
}
