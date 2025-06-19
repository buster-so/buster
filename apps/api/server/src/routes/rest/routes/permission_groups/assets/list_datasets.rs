use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::schema::{dataset_permissions, datasets};
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

/// Represents dataset information with its assignment status to a permission group
#[derive(Debug, Serialize)]
pub struct DatasetInfo {
    pub id: Uuid,
    pub name: String,
    pub assigned: bool,
}

/// List datasets that can be associated with a permission group
/// Returns datasets with their current assignment status to the specified permission group
pub async fn list_datasets(
    Extension(user): Extension<AuthenticatedUser>,
    Path(permission_group_id): Path<Uuid>,
) -> Result<ApiResponse<Vec<DatasetInfo>>, (StatusCode, &'static str)> {
    let datasets = match list_datasets_handler(user, permission_group_id).await {
        Ok(datasets) => datasets,
        Err(e) => {
            tracing::error!("Error listing datasets for permission group: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing datasets for permission group",
            ));
        }
    };

    Ok(ApiResponse::JsonData(datasets))
}

async fn list_datasets_handler(user: AuthenticatedUser, permission_group_id: Uuid) -> Result<Vec<DatasetInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    if !is_user_workspace_admin_or_data_admin(&user, &organization_id).await? {
        return Err(anyhow::anyhow!(
            "User is not authorized to list datasets for permission group"
        ));
    }

    // Query datasets and their assignment status to the permission group
    let datasets = datasets::table
        .left_join(
            dataset_permissions::table.on(
                dataset_permissions::dataset_id
                    .eq(datasets::id)
                    .and(dataset_permissions::permission_type.eq("permission_group"))
                    .and(dataset_permissions::permission_id.eq(permission_group_id))
                    .and(dataset_permissions::deleted_at.is_null()),
            ),
        )
        .select((
            datasets::id,
            datasets::name,
            diesel::dsl::sql::<diesel::sql_types::Bool>("dataset_permissions.id IS NOT NULL"),
        ))
        .filter(datasets::organization_id.eq(organization_id))
        .filter(datasets::deleted_at.is_null())
        .order_by(datasets::created_at.desc())
        .load::<(Uuid, String, bool)>(&mut *conn)
        .await?;

    Ok(datasets
        .into_iter()
        .map(|(id, name, assigned)| DatasetInfo {
            id,
            name,
            assigned,
        })
        .collect())
} 