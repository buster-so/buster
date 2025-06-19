use crate::routes::rest::ApiResponse;
use axum::extract::Query;
use axum::http::StatusCode;
use axum::Extension;
use handlers::dashboards::{list_dashboard_handler, DashboardsListRequest, BusterDashboardListItem};
use middleware::AuthenticatedUser;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct ListDashboardsQuery {
    page_token: Option<i64>,
    page_size: Option<i64>,
    shared_with_me: Option<bool>,
    only_my_dashboards: Option<bool>,
}

pub async fn list_dashboard_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListDashboardsQuery>,
) -> Result<ApiResponse<Vec<BusterDashboardListItem>>, (StatusCode, &'static str)> {
    let request = DashboardsListRequest {
        page_token: query.page_token.unwrap_or(0),
        page_size: query.page_size.unwrap_or(25),
        shared_with_me: query.shared_with_me,
        only_my_dashboards: query.only_my_dashboards,
    };

    let dashboards = match list_dashboard_handler(&user, request).await {
        Ok(dashboards) => dashboards,
        Err(e) => {
            tracing::error!("Error listing dashboards: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to list dashboards"));
        }
    };

    Ok(ApiResponse::JsonData(dashboards))
}
