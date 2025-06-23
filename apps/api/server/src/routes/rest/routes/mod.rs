mod api_keys;
mod assets;
mod chats;
mod dashboards;
mod data_sources;
mod dataset_groups;
mod datasets;
mod helpers;
mod logs;
mod messages;
mod metrics;
mod organizations;
mod permission_groups;
mod search;
mod sql;
mod users;
mod collections;

use axum::{middleware as axum_middleware, Router};

use middleware::auth;

pub fn router() -> Router {
    Router::new().nest("/api_keys", api_keys::router()).merge(
        Router::new()
            .nest("/assets", assets::router())
            .nest("/datasets", datasets::router())
            .nest("/data_sources", data_sources::router())
            .nest("/permission_groups", permission_groups::router())
            .nest("/dataset_groups", dataset_groups::router())
            .nest("/sql", sql::router())
            .nest("/organizations", organizations::router())
            .nest("/chats", chats::router())
            .nest("/messages", messages::router())
            .nest("/metrics", metrics::router())
            .nest("/dashboards", dashboards::router())
            .nest("/users", users::router())
            .nest("/collections", collections::router())
            .nest("/logs", logs::router())
            .nest("/search", search::router())
            .nest("/helpers", helpers::router())
            .route_layer(axum_middleware::from_fn(auth)),
    )
}
