use axum::{routing::get, Router};

mod users;

pub fn router() -> Router {
    Router::new()
        .route("/:id/users", get(users::list_organization_users))
}
