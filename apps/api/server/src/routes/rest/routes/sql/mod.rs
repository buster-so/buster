use axum::{routing::post, Router};

mod run_sql;

pub fn router() -> Router {
    Router::new().route("/run", post(run_sql::run_sql))
}
