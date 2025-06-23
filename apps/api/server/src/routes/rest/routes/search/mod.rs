use axum::{routing::post, Router};

mod search;

pub fn router() -> Router {
    Router::new().route("/", post(search::search))
}
