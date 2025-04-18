use axum::{extract::Query, http::StatusCode, Extension};
use handlers::logs::list_logs_handler::{list_logs_handler, ListLogsRequest, LogListItem};
use middleware::AuthenticatedUser;
use serde::Deserialize;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct ListLogsQuery {
    pub page: Option<i32>,
    #[serde(default = "default_page_size")]
    pub page_size: i32,
}

fn default_page_size() -> i32 {
    20 // Default to 20 items per page
}

pub async fn list_logs_route(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListLogsQuery>,
) -> Result<ApiResponse<Vec<LogListItem>>, (StatusCode, &'static str)> {
    let request = ListLogsRequest {
        page: query.page,
        page_size: query.page_size,
    };

    let organization_id = match user.organizations.get(0) {
        Some(organization) => organization.id,
        _ => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting organization id",
            ));
        }
    };

    match list_logs_handler(request, organization_id).await {
        Ok(response) => Ok(ApiResponse::JsonData(response.items)),
        Err(e) => {
            tracing::error!("Error listing logs: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to list logs"))
        }
    }
}
