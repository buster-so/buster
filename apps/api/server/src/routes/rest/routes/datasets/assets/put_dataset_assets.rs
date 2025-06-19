use anyhow::Result;
use axum::http::StatusCode;
use axum::{extract::Path, Extension, Json};
use chrono::{DateTime, Utc};
use diesel::{prelude::*, update};
use diesel_async::RunQueryDsl;
use serde::Deserialize;
use tokio::spawn;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use database::{
    pool::get_pg_pool,
    models::DatasetPermission,
    schema::dataset_permissions,
};
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;

#[derive(Debug, Deserialize)]
pub struct AssetAssignment {
    pub id: Uuid,
    pub assigned: bool,
}

// TODO: When we introduce the dataset groups, this list should update the datasets_to_dataset_groups table, not related to permissions.

pub async fn put_permissions(
    Extension(user): Extension<AuthenticatedUser>,
    Path((dataset_id, permission_type)): Path<(Uuid, String)>,
    Json(assignments): Json<Vec<AssetAssignment>>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match put_permissions_handler(user, (dataset_id, permission_type), assignments).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error updating dataset permissions: {:?}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"))
        }
    }
}

pub async fn put_permissions_handler(
    user: AuthenticatedUser,
    (dataset_id, permission_type): (Uuid, String),
    assignments: Vec<AssetAssignment>,
) -> Result<()> {
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => anyhow::bail!("Insufficient permissions"),
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            anyhow::bail!("Error checking user permissions");
        }
    }

    let (to_assign, to_unassign): (Vec<_>, Vec<_>) =
        assignments.into_iter().partition(|a| a.assigned);

    let pool = get_pg_pool();

    let unassign_handle = {
        let permission_type = match permission_type.as_str() {
            "users" => "user",
            "dataset_groups" => "dataset_group",
            "permission_groups" => "permission_group",
            _ => anyhow::bail!("Invalid permission type"),
        };

        spawn(async move {
            let mut conn = pool.get().await?;
            if !to_unassign.is_empty() {
                let unassign_ids: Vec<Uuid> = to_unassign.iter().map(|a| a.id).collect();
                let rows_affected = update(dataset_permissions::table)
                    .filter(dataset_permissions::permission_id.eq_any(unassign_ids))
                    .filter(dataset_permissions::permission_type.eq(permission_type))
                    .filter(dataset_permissions::dataset_id.eq(dataset_id))
                    .filter(dataset_permissions::deleted_at.is_null())
                    .set(dataset_permissions::deleted_at.eq(Utc::now()))
                    .execute(&mut *conn)
                    .await?;

                tracing::debug!("Unassigned {} rows", rows_affected);
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let assign_handle = spawn(async move {
        let permission_type = match permission_type.as_str() {
            "users" => "user",
            "dataset_groups" => "dataset_group",
            "permission_groups" => "permission_group",
            _ => anyhow::bail!("Invalid permission type"),
        };

        let mut conn = pool.get().await?;
        if !to_assign.is_empty() {
            let assign_values: Vec<DatasetPermission> = to_assign
                .iter()
                .map(|a| DatasetPermission {
                    id: Uuid::new_v4(),
                    permission_id: a.id,
                    dataset_id,
                    permission_type: permission_type.to_string(),
                    deleted_at: None,
                    organization_id,
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                })
                .collect();

            diesel::insert_into(dataset_permissions::table)
                .values(&assign_values)
                .on_conflict((
                    dataset_permissions::permission_id,
                    dataset_permissions::dataset_id,
                    dataset_permissions::permission_type,
                ))
                .do_update()
                .set(dataset_permissions::deleted_at.eq(None::<DateTime<Utc>>))
                .execute(&mut *conn)
                .await?;
        }
        Ok::<_, anyhow::Error>(())
    });

    let (unassign_result, assign_result) = tokio::join!(unassign_handle, assign_handle);
    unassign_result??;
    assign_result??;

    Ok(())
}
