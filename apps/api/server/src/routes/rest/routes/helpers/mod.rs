mod search_data_catalog;

use axum::Router;

pub fn router() -> Router {
    Router::new()
        .nest("/search_data_catalog", search_data_catalog::router())
} 