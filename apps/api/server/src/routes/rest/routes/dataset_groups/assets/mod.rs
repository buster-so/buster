use axum::{routing::get, Router};

mod list_datasets;
mod list_permission_groups;
mod list_users;
mod put_datasets;
mod put_permission_groups;
mod put_users;

pub use list_datasets::list_datasets;
pub use list_permission_groups::list_permission_groups;
pub use list_users::list_users;
pub use put_datasets::put_datasets;
pub use put_permission_groups::put_permission_groups;
pub use put_users::put_users;

pub fn router() -> Router {
    Router::new()
        .route("/datasets", get(list_datasets).put(put_datasets))
        .route(
            "/permission_groups",
            get(list_permission_groups).put(put_permission_groups),
        )
        .route("/users", get(list_users).put(put_users))
}
