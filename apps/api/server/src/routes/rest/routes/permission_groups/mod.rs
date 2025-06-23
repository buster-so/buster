mod assets;
mod delete_permission_group;
mod get_permission_group;
mod list_permission_groups;
mod post_permission_group;
mod put_permission_group;

use axum::{
    routing::{delete, get, post, put},
    Router,
};


use self::{
    delete_permission_group::delete_permission_group, get_permission_group::get_permission_group,
    list_permission_groups::list_permission_groups, post_permission_group::post_permission_group,
    put_permission_group::put_permission_group,
};

pub fn router() -> Router {
    Router::new()
        .route("/", post(post_permission_group))
        .route("/", get(list_permission_groups))
        .route("/:permission_group_id", get(get_permission_group))
        .route("/:permission_group_id", delete(delete_permission_group))
        .route("/", put(put_permission_group))
        .nest("/:permission_group_id", assets::router())
}
