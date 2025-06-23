use anyhow::Result;
use axum::http::StatusCode;
use axum::{Extension, Json};
use chrono::Utc;
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::models::DatasetGroup;
use database::schema::dataset_groups;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Deserialize)]
pub struct PostDatasetGroupRequest {
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct PostDatasetGroupResponse {
    pub id: Uuid,
    pub name: String,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

pub async fn post_dataset_group(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<PostDatasetGroupRequest>,
) -> Result<ApiResponse<PostDatasetGroupResponse>, (StatusCode, &'static str)> {
    // Check if user is workspace admin or data admin
    let organization_id = match get_user_organization_id(&user.id).await {
        Ok(Some(organization_id)) => organization_id,
        Ok(None) => return Err((StatusCode::FORBIDDEN, "User does not belong to any organization")),
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error getting user organization id"));
        }
    };

    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => return Err((StatusCode::FORBIDDEN, "Insufficient permissions")),
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error checking user permissions",
            ));
        }
    }

    let dataset_group = match post_dataset_group_handler(request, user).await {
        Ok(group) => group,
        Err(e) => {
            tracing::error!("Error creating dataset group: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error creating dataset group",
            ));
        }
    };

    Ok(ApiResponse::JsonData(PostDatasetGroupResponse {
        id: dataset_group.id,
        name: dataset_group.name,
        created_at: dataset_group.created_at,
        updated_at: dataset_group.updated_at,
    }))
}

async fn post_dataset_group_handler(
    request: PostDatasetGroupRequest,
    user: AuthenticatedUser,
) -> Result<DatasetGroup> {
    let mut conn = get_pg_pool().get().await?;

    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    let dataset_group = DatasetGroup {
        id: Uuid::new_v4(),
        organization_id,
        name: request.name,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    insert_into(dataset_groups::table)
        .values(&dataset_group)
        .execute(&mut *conn)
        .await?;

    Ok(dataset_group)
}
