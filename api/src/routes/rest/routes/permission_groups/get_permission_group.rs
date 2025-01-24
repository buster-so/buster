use anyhow::Result;
use axum::{extract::Path, http::StatusCode, Extension};
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::database::lib::get_pg_pool;
use crate::database::models::{PermissionGroup, User};
use crate::database::schema::permission_groups;
use crate::routes::rest::ApiResponse;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct PermissionGroupInfo {
    pub id: Uuid,
    pub name: String,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_permission_group(
    Extension(user): Extension<User>,
    Path(permission_group_id): Path<Uuid>,
) -> Result<ApiResponse<PermissionGroupInfo>, (StatusCode, &'static str)> {
    let permission_group = match get_permission_group_handler(user, permission_group_id).await {
        Ok(group) => group,
        Err(e) => {
            tracing::error!("Error getting permission group: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting permission group",
            ));
        }
    };

    Ok(ApiResponse::JsonData(permission_group))
}

async fn get_permission_group_handler(
    user: User,
    permission_group_id: Uuid,
) -> Result<PermissionGroupInfo> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = get_user_organization_id(&user.id).await?;

    let permission_group = permission_groups::table
        .filter(permission_groups::id.eq(permission_group_id))
        .filter(permission_groups::organization_id.eq(organization_id))
        .filter(permission_groups::deleted_at.is_null())
        .first::<PermissionGroup>(&mut *conn)
        .await
        .map_err(|_| anyhow::anyhow!("Permission group not found"))?;

    Ok(PermissionGroupInfo {
        id: permission_group.id,
        name: permission_group.name,
        organization_id: permission_group.organization_id,
        created_by: permission_group.created_by,
        updated_by: permission_group.updated_by,
        created_at: permission_group.created_at,
        updated_at: permission_group.updated_at,
    })
}
