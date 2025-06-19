use anyhow::Result;
use axum::{extract::Path, http::StatusCode, Extension, Json};
use uuid::Uuid;

use handlers::organizations::{
    types::{OrganizationResponse, UpdateOrganizationRequest},
    update_organization_handler,
};

use crate::routes::rest::ApiResponse;
use middleware::AuthenticatedUser;

pub async fn update_organization(
    Extension(user): Extension<AuthenticatedUser>,
    Path(organization_id): Path<Uuid>,
    Json(payload): Json<UpdateOrganizationRequest>,
) -> Result<ApiResponse<OrganizationResponse>, (StatusCode, &'static str)> {
    // Check if there's anything to update
    if payload.name.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            "No fields to update",
        ));
    }

    let organization = match update_organization_handler(&user, organization_id, payload).await {
        Ok(organization) => organization,
        Err(e) => {
            tracing::error!("Error updating organization: {:?}", e);
            
            if e.to_string().contains("not a workspace admin") {
                return Err((StatusCode::FORBIDDEN, "User is not a workspace admin"));
            }
            
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error updating organization",
            ));
        }
    };

    Ok(ApiResponse::JsonData(organization))
}