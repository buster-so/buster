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
use database::models::DatasetPermission;
use database::schema::dataset_permissions;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize, Deserialize)]
pub struct DatasetAssignment {
    pub id: Uuid,
    pub assigned: bool,
}

/// Update dataset assignments for a permission group
/// Accepts a list of dataset assignments to add or remove from the permission group
pub async fn put_datasets(
    Extension(user): Extension<AuthenticatedUser>,
    Path(permission_group_id): Path<Uuid>,
    Json(assignments): Json<Vec<DatasetAssignment>>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match put_datasets_handler(user, permission_group_id, assignments).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error assigning datasets to permission group: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error assigning datasets to permission group",
            ));
        }
    }
}

async fn put_datasets_handler(
    user: AuthenticatedUser,
    permission_group_id: Uuid,
    assignments: Vec<DatasetAssignment>,
) -> Result<()> {
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    if !is_user_workspace_admin_or_data_admin(&user, &organization_id).await? {
        return Err(anyhow::anyhow!(
            "User is not authorized to assign datasets to permission group"
        ));
    }

    let (to_assign, to_unassign): (Vec<_>, Vec<_>) = assignments.into_iter().partition(|a| a.assigned);

    let assign_handle = {
        let permission_group_id = permission_group_id;
        spawn(async move {
            if !to_assign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                let values: Vec<_> = to_assign
                    .into_iter()
                    .map(|dataset| DatasetPermission {
                        id: Uuid::new_v4(),
                        dataset_id: dataset.id,
                        permission_id: permission_group_id,
                        permission_type: "permission_group".to_string(),
                        organization_id,
                        deleted_at: None,
                        created_at: chrono::Utc::now(),
                        updated_at: chrono::Utc::now(),
                    })
                    .collect();

                diesel::insert_into(dataset_permissions::table)
                    .values(&values)
                    .on_conflict((
                        dataset_permissions::dataset_id,
                        dataset_permissions::permission_id,
                        dataset_permissions::permission_type,
                    ))
                    .do_update()
                    .set(dataset_permissions::deleted_at.eq(None::<chrono::DateTime<chrono::Utc>>))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let unassign_handle = {
        let permission_group_id = permission_group_id;
        spawn(async move {
            if !to_unassign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                diesel::update(dataset_permissions::table)
                    .filter(
                        dataset_permissions::dataset_id
                            .eq_any(to_unassign.iter().map(|a| a.id))
                            .and(dataset_permissions::permission_id.eq(permission_group_id))
                            .and(dataset_permissions::permission_type.eq("permission_group")),
                    )
                    .set(dataset_permissions::deleted_at.eq(chrono::Utc::now()))
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