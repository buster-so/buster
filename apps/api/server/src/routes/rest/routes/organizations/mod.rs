use axum::{
    routing::{get, post, put},
    Router,
};

pub mod post_organization;
mod update_organization;
mod users;

pub fn router() -> Router {
    Router::new()
        .route("/:id/users", get(users::list_organization_users))
        .route("/:id", put(update_organization::update_organization))
        .route("/", post(post_organization::post_organization))
}
