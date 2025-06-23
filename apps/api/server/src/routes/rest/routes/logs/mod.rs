use axum::{routing::get, Router};

mod list_logs;

pub fn router() -> Router {
    Router::new().route("/", get(list_logs::list_logs_route))
}
