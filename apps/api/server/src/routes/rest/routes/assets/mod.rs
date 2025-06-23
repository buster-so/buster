pub mod get_asset_access;

use axum::{routing::get, Router};

pub fn router() -> Router {
    Router::new().route(
        "/:asset_type/:asset_id",
        get(get_asset_access::get_asset_access),
    )
}
