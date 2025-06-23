mod get_dataset_overview;
mod list_dataset_assets;
mod put_dataset_assets;

use axum::{
    routing::get,
    Router,
};

pub fn router() -> Router {
    Router::new()
        .route(
            "/:permission_type",
            get(list_dataset_assets::list_assets).put(put_dataset_assets::put_permissions),
        )
        .route("/overview", get(get_dataset_overview::get_dataset_overview))
}
