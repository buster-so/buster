use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::{Extension, Json};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use tokio::spawn;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::models::DatasetGroupPermission;
use database::schema::dataset_groups_permissions;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize, Deserialize)]
pub struct PermissionGroupAssignment {
    pub id: Uuid,
    pub assigned: bool,
}

/// Update permission group assignments for a dataset group
/// Accepts a list of permission group assignments to add or remove from the dataset group
pub async fn put_permission_groups(
    Extension(user): Extension<AuthenticatedUser>,
    Path(dataset_group_id): Path<Uuid>,
    Json(assignments): Json<Vec<PermissionGroupAssignment>>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match put_permission_groups_handler(user, dataset_group_id, assignments).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error assigning permission groups to dataset group: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error assigning permission groups to dataset group",
            ));
        }
    }
}

async fn put_permission_groups_handler(
    user: AuthenticatedUser,
    dataset_group_id: Uuid,
    assignments: Vec<PermissionGroupAssignment>,
) -> Result<()> {
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    if !is_user_workspace_admin_or_data_admin(&user, &organization_id).await? {
        return Err(anyhow::anyhow!(
            "User is not authorized to assign permission groups to dataset group"
        ));
    }

    let (to_assign, to_unassign): (Vec<_>, Vec<_>) = assignments.into_iter().partition(|a| a.assigned);

    let assign_handle = {
        let dataset_group_id = dataset_group_id;
        spawn(async move {
            if !to_assign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                let values: Vec<_> = to_assign
                    .into_iter()
                    .map(|group| DatasetGroupPermission {
                        id: Uuid::new_v4(),
                        dataset_group_id,
                        permission_id: group.id,
                        permission_type: "permission_group".to_string(),
                        organization_id,
                        deleted_at: None,
                        created_at: chrono::Utc::now(),
                        updated_at: chrono::Utc::now(),
                    })
                    .collect();

                diesel::insert_into(dataset_groups_permissions::table)
                    .values(&values)
                    .on_conflict((
                        dataset_groups_permissions::dataset_group_id,
                        dataset_groups_permissions::permission_id,
                        dataset_groups_permissions::permission_type,
                    ))
                    .do_update()
                    .set(dataset_groups_permissions::deleted_at.eq(None::<chrono::DateTime<chrono::Utc>>))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let unassign_handle = {
        let dataset_group_id = dataset_group_id;
        spawn(async move {
            if !to_unassign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                diesel::update(dataset_groups_permissions::table)
                    .filter(
                        dataset_groups_permissions::dataset_group_id
                            .eq(dataset_group_id)
                            .and(dataset_groups_permissions::permission_id.eq_any(
                                to_unassign.iter().map(|a| a.id),
                            ))
                            .and(dataset_groups_permissions::permission_type.eq("permission_group")),
                    )
                    .set(dataset_groups_permissions::deleted_at.eq(chrono::Utc::now()))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let (assign_result, unassign_result) = tokio::try_join!(assign_handle, unassign_handle)?;
    assign_result?;
    unassign_result?;

    Ok(())
} 