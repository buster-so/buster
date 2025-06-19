use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::schema::{dataset_groups, dataset_groups_permissions};
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

/// Represents dataset group information with its assignment status to a permission group
#[derive(Debug, Serialize)]
pub struct DatasetGroupInfo {
    pub id: Uuid,
    pub name: String,
    pub assigned: bool,
}

/// List dataset groups that can be associated with a permission group
/// Returns dataset groups with their current assignment status to the specified permission group
pub async fn list_dataset_groups(
    Extension(user): Extension<AuthenticatedUser>,
    Path(permission_group_id): Path<Uuid>,
) -> Result<ApiResponse<Vec<DatasetGroupInfo>>, (StatusCode, &'static str)> {
    let dataset_groups = match list_dataset_groups_handler(user, permission_group_id).await {
        Ok(groups) => groups,
        Err(e) => {
            tracing::error!("Error listing dataset groups for permission group: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing dataset groups for permission group",
            ));
        }
    };

    Ok(ApiResponse::JsonData(dataset_groups))
}

async fn list_dataset_groups_handler(
    user: AuthenticatedUser,
    permission_group_id: Uuid,
) -> Result<Vec<DatasetGroupInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    if !is_user_workspace_admin_or_data_admin(&user, &organization_id).await? {
        return Err(anyhow::anyhow!(
            "User is not authorized to list dataset groups for permission group"
        ));
    }

    // Query dataset groups and their assignment status to the permission group
    let groups = dataset_groups::table
        .left_join(
            dataset_groups_permissions::table.on(
                dataset_groups_permissions::dataset_group_id
                    .eq(dataset_groups::id)
                    .and(dataset_groups_permissions::permission_type.eq("permission_group"))
                    .and(dataset_groups_permissions::permission_id.eq(permission_group_id))
                    .and(dataset_groups_permissions::deleted_at.is_null()),
            ),
        )
        .select((
            dataset_groups::id,
            dataset_groups::name,
            diesel::dsl::sql::<diesel::sql_types::Bool>(
                "dataset_groups_permissions.id IS NOT NULL",
            ),
        ))
        .filter(dataset_groups::organization_id.eq(organization_id))
        .filter(dataset_groups::deleted_at.is_null())
        .order_by(dataset_groups::created_at.desc())
        .load::<(Uuid, String, bool)>(&mut *conn)
        .await?;

    Ok(groups
        .into_iter()
        .map(|(id, name, assigned)| DatasetGroupInfo {
            id,
            name,
            assigned,
        })
        .collect())
} 