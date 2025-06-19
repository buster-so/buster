use anyhow::Result;
use axum::{extract::Query, Extension};
use middleware::types::AuthenticatedUser;
use serde::Deserialize;

use handlers::data_sources::{list_data_sources_handler, DataSourceListItem};

use crate::routes::rest::ApiResponse;

#[derive(Deserialize)]
pub struct ListDataSourcesQuery {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

pub async fn list_data_sources(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListDataSourcesQuery>,
) -> Result<ApiResponse<Vec<DataSourceListItem>>, (axum::http::StatusCode, &'static str)> {
    match list_data_sources_handler(&user, query.page, query.page_size).await {
        Ok(data_sources) => Ok(ApiResponse::JsonData(data_sources)),
        Err(e) => {
            tracing::error!("Error listing data sources: {:?}", e);
            if e.to_string().contains("permissions") {
                Err((axum::http::StatusCode::FORBIDDEN, "Not authorized to access data sources"))
            } else if e.to_string().contains("not a member of any organization") {
                Err((axum::http::StatusCode::BAD_REQUEST, "User is not a member of any organization"))
            } else {
                Err((
                    axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to list data sources",
                ))
            }
        }
    }
}