mod list_data_sources;
mod get_data_source;
mod update_data_source;
mod create_data_source;
mod delete_data_source;

use axum::{
    routing::{get, post, put, delete},
    Router,
};

pub fn router() -> Router {
    Router::new()
        .route("/", post(create_data_source::create_data_source))
        .route("/", get(list_data_sources::list_data_sources))
        .route("/:id", get(get_data_source::get_data_source))
        .route("/:id", put(update_data_source::update_data_source))
        .route("/:id", delete(delete_data_source::delete_data_source))
}