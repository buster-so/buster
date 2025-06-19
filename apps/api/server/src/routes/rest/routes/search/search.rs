use axum::{http::StatusCode, Extension, Json};
use serde::Deserialize;

use handlers::search::search_handler;
use middleware::AuthenticatedUser;
use search::{SearchObject, SearchObjectType};

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub num_results: Option<i64>,
    pub asset_types: Option<Vec<SearchObjectType>>,
}

pub async fn search(
    Extension(user): Extension<AuthenticatedUser>,
    Json(params): Json<SearchQuery>,
) -> Result<ApiResponse<Vec<SearchObject>>, (StatusCode, &'static str)> {
    let results = match search_handler(
        &user,
        params.query,
        params.num_results,
        params.asset_types,
    )
    .await
    {
        Ok(results) => results,
        Err(e) => {
            tracing::error!("Error searching: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error during search"));
        }
    };

    Ok(ApiResponse::JsonData(results))
}
