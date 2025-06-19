use axum::{
    routing::{delete, get, post, put},
    Router,
};

mod add_assets_to_collection;
mod create_collection;
mod delete_collection;
mod get_collection;
mod list_collections;
mod remove_assets_from_collection;
mod sharing;
mod update_collection;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_collections::list_collections))
        .route("/", post(create_collection::create_collection))
        .route("/", delete(delete_collection::delete_collections))
        .route("/:id", get(get_collection::get_collection))
        .route("/:id", put(update_collection::update_collection))
        .route("/:id", delete(delete_collection::delete_collection_by_id))
        .route(
            "/:id/assets",
            post(add_assets_to_collection::add_assets_to_collection),
        )
        .route(
            "/:id/assets",
            delete(remove_assets_from_collection::remove_assets_from_collection),
        )
        .nest("/:id/sharing", sharing::router())
}
