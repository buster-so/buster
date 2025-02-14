mod api_keys;
mod assets;
mod data_sources;
mod dataset_groups;
mod datasets;
mod organizations;
mod permission_groups;
mod sql;
mod users;

use axum::{middleware, Router};

use crate::buster_middleware::auth::auth;

pub fn router() -> Router {
    Router::new()
        .nest("/api_keys", api_keys::router())
        .nest("/users", users::router())
        .merge(
            Router::new()
                .nest("/assets", assets::router())
                .nest("/datasets", datasets::router())
                .nest("/data_sources", data_sources::router())
                .nest("/permission_groups", permission_groups::router())
                .nest("/dataset_groups", dataset_groups::router())
                .nest("/sql", sql::router())
                .nest("/organizations", organizations::router())
                .route_layer(middleware::from_fn(auth)),
        )
}
