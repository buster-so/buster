use anyhow::Result;
use axum::{extract::Path, http::StatusCode, Extension};
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::schema::permission_groups;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

pub async fn delete_permission_group(
    Extension(user): Extension<AuthenticatedUser>,
    Path(permission_group_id): Path<Uuid>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
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

    match delete_permission_group_handler(user, permission_group_id).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error deleting permission group: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error deleting permission group",
            ))
        }
    }
}

async fn delete_permission_group_handler(user: AuthenticatedUser, permission_group_id: Uuid) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    let rows_affected = diesel::update(
        permission_groups::table
            .filter(permission_groups::id.eq(permission_group_id))
            .filter(permission_groups::organization_id.eq(organization_id))
            .filter(permission_groups::deleted_at.is_null()),
    )
    .set((
        permission_groups::deleted_at.eq(Some(Utc::now())),
        permission_groups::updated_by.eq(user.id),
        permission_groups::updated_at.eq(Utc::now()),
    ))
    .execute(&mut *conn)
    .await?;

    if rows_affected == 0 {
        return Err(anyhow::anyhow!("Permission group not found"));
    }

    Ok(())
}
