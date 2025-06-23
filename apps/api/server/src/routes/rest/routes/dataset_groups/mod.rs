mod assets;
mod delete_dataset_group;
mod get_dataset_group;
mod list_dataset_groups;
mod post_dataset_group;
mod put_dataset_group;

use axum::{
    routing::{delete, get, post, put},
    Router,
};


use self::{
    delete_dataset_group::delete_dataset_group, get_dataset_group::get_dataset_group,
    list_dataset_groups::list_dataset_groups, post_dataset_group::post_dataset_group,
    put_dataset_group::put_dataset_group,
};

pub fn router() -> Router {
    Router::new()
        .route("/", post(post_dataset_group))
        .route("/", get(list_dataset_groups))
        .route("/:dataset_group_id", get(get_dataset_group))
        .route("/:dataset_group_id", delete(delete_dataset_group))
        .route("/", put(put_dataset_group))
        .nest("/:dataset_group_id", assets::router())
}
