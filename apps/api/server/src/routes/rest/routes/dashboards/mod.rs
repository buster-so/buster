use axum::{
    routing::delete,
    routing::{get, post, put},
    Router,
};

// Modules for dashboard endpoints
mod create_dashboard;
mod delete_dashboard;
mod get_dashboard;
mod list_dashboards;
mod sharing;
mod update_dashboard;

pub fn router() -> Router {
    Router::new()
        .route("/", post(create_dashboard::create_dashboard_rest_handler))
        .route("/:id", get(get_dashboard::get_dashboard_rest_handler))
        .route("/:id", put(update_dashboard::update_dashboard_rest_handler))
        .route(
            "/",
            delete(delete_dashboard::delete_dashboards_rest_handler),
        )
        .route("/", get(list_dashboards::list_dashboard_rest_handler))
        .route(
            "/:id/sharing",
            get(sharing::list_dashboard_sharing_rest_handler),
        )
        .route(
            "/:id/sharing",
            post(sharing::create_dashboard_sharing_rest_handler),
        )
        .route(
            "/:id/sharing",
            put(sharing::update_dashboard_sharing_rest_handler),
        )
        .route(
            "/:id/sharing",
            delete(sharing::delete_dashboard_sharing_rest_handler),
        )
}
