use axum::{
    routing::{get, post, delete, put},
    Router,
};

mod list_sharing;
mod delete_sharing;
mod create_sharing;
mod update_sharing;

pub use list_sharing::list_chat_sharing_rest_handler;
pub use delete_sharing::delete_chat_sharing_rest_handler;
pub use update_sharing::update_chat_sharing_rest_handler;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_chat_sharing_rest_handler))
        .route("/", delete(delete_chat_sharing_rest_handler))
        .route("/", post(create_sharing::create_chat_sharing_rest_handler))
        .route("/", put(update_chat_sharing_rest_handler))
}
