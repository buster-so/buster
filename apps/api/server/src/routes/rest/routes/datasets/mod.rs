mod assets;
mod delete_dataset;
mod deploy_datasets;
// mod generate_datasets;
mod get_dataset;
mod get_dataset_data_sample;
mod list_datasets;
mod post_dataset;

use axum::{
    routing::{get, post, delete},
    Router,
};

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_datasets::list_datasets))
        .route("/", post(post_dataset::post_dataset))
        .route("/deploy", post(deploy_datasets::deploy_datasets))
        // .route("/generate", post(generate_datasets::generate_datasets))
        .route("/:dataset_id", get(get_dataset::get_dataset))
        .route("/:dataset_id", delete(delete_dataset::delete_dataset))
        .route(
            "/:dataset_id/data/sample",
            get(get_dataset_data_sample::get_dataset_data_sample),
        )
        .nest("/:dataset_id", assets::router())
}
