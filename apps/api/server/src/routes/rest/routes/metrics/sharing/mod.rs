use axum::{
    routing::{get, post, delete, put},
    Router,
};

mod list_sharing;
mod create_sharing;
mod delete_sharing;
mod update_sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_sharing::list_metric_sharing_rest_handler))
        .route("/", post(create_sharing::create_metric_sharing_rest_handler))
        .route("/", put(update_sharing::update_metric_sharing_rest_handler))
        .route("/", delete(delete_sharing::delete_metric_sharing_rest_handler))
}