use axum::{
    routing::get,
    Router,
};

mod list_users;
mod list_dataset_groups;
mod list_datasets;
mod put_users;
mod put_dataset_groups;
mod put_datasets;

pub use list_users::list_users;
pub use list_dataset_groups::list_dataset_groups;
pub use list_datasets::list_datasets;
pub use put_users::put_users;
pub use put_dataset_groups::put_dataset_groups;
pub use put_datasets::put_datasets;

pub fn router() -> Router {
    Router::new()
        .route("/users", get(list_users).put(put_users))
        .route("/dataset_groups", get(list_dataset_groups).put(put_dataset_groups))
        .route("/datasets", get(list_datasets).put(put_datasets))
}
