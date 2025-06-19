use anyhow::Result;
use axum::{http::StatusCode, Extension, Json};
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Deserialize;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::schema::permission_groups;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Deserialize, Clone)]
pub struct PermissionGroupUpdate {
    pub id: Uuid,
    pub name: String,
}

pub async fn put_permission_group(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<Vec<PermissionGroupUpdate>>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match put_permission_group_handler(user, request).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error updating permission groups: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error updating permission groups",
            ))
        }
    }
}

async fn put_permission_group_handler(
    user: AuthenticatedUser,
    request: Vec<PermissionGroupUpdate>,
) -> Result<()> {
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };
    let now = Utc::now();

    // Check if user is workspace admin or data admin
    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => return Err(anyhow::anyhow!("Insufficient permissions")),
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err(anyhow::anyhow!("Error checking user permissions"));
        }
    }

    // Process in chunks of 10
    let mut handles = vec![];
    for chunk in request.chunks(25) {
        let updates = chunk.to_vec();
        let user_id = user.id;
        let org_id = organization_id;
        let timestamp = now;

        let handle = tokio::spawn(async move {
            let mut conn = get_pg_pool().get().await?;

            for update in updates {
                diesel::update(permission_groups::table)
                    .filter(permission_groups::id.eq(update.id))
                    .filter(permission_groups::organization_id.eq(org_id))
                    .filter(permission_groups::deleted_at.is_null())
                    .set((
                        permission_groups::name.eq(update.name),
                        permission_groups::updated_by.eq(user_id),
                        permission_groups::updated_at.eq(timestamp),
                    ))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        });
        handles.push(handle);
    }

    // Wait for all tasks to complete
    for handle in handles {
        handle.await??;
    }

    Ok(())
}
