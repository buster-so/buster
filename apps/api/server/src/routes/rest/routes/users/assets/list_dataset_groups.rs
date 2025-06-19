use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::schema::{dataset_groups, dataset_groups_permissions, dataset_permissions};
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize)]
pub struct DatasetGroupInfo {
    pub id: Uuid,
    pub name: String,
    pub permission_count: i64,
    pub assigned: bool,
}

pub async fn list_dataset_groups(
    Extension(user): Extension<AuthenticatedUser>,
    Path(user_id): Path<Uuid>,
) -> Result<ApiResponse<Vec<DatasetGroupInfo>>, (StatusCode, &'static str)> {
    let dataset_groups = match list_dataset_groups_handler(user, user_id).await {
        Ok(groups) => groups,
        Err(e) => {
            tracing::error!("Error listing dataset groups: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing dataset groups",
            ));
        }
    };

    Ok(ApiResponse::JsonData(dataset_groups))
}

async fn list_dataset_groups_handler(user: AuthenticatedUser, user_id: Uuid) -> Result<Vec<DatasetGroupInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = match get_user_organization_id(&user_id).await {
        Ok(Some(organization_id)) => organization_id,
        Ok(None) => {
            return Err(anyhow::anyhow!("User does not belong to any organization"));
        }
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err(anyhow::anyhow!("Error getting user organization id"));
        }
    };

    if !is_user_workspace_admin_or_data_admin(&user, &organization_id).await? {
        return Err(anyhow::anyhow!("User is not authorized to list dataset groups"));
    }

    let groups = dataset_groups::table
        .left_join(
            dataset_groups_permissions::table.on(dataset_groups_permissions::dataset_group_id
                .eq(dataset_groups::id)
                .and(dataset_groups_permissions::permission_type.eq("user"))
                .and(dataset_groups_permissions::permission_id.eq(user_id))
                .and(dataset_groups_permissions::deleted_at.is_null())),
        )
        .left_join(
            dataset_permissions::table.on(dataset_permissions::permission_id
                .eq(dataset_groups::id)
                .and(dataset_permissions::permission_type.eq("dataset_group"))
                .and(dataset_permissions::deleted_at.is_null())
                .and(dataset_permissions::organization_id.eq(organization_id))),
        )
        .select((
            dataset_groups::id,
            dataset_groups::name,
            diesel::dsl::sql::<diesel::sql_types::BigInt>(
                "COALESCE(count(dataset_permissions.id), 0)",
            ),
            diesel::dsl::sql::<diesel::sql_types::Bool>("dataset_groups_permissions.id IS NOT NULL"),
        ))
        .group_by((
            dataset_groups::id,
            dataset_groups::name,
            dataset_groups_permissions::id,
        ))
        .filter(dataset_groups::organization_id.eq(organization_id))
        .filter(dataset_groups::deleted_at.is_null())
        .order_by(dataset_groups::created_at.desc())
        .load::<(Uuid, String, i64, bool)>(&mut *conn)
        .await?;

    Ok(groups
        .into_iter()
        .map(|(id, name, permission_count, assigned)| DatasetGroupInfo {
            id,
            name,
            permission_count,
            assigned,
        })
        .collect())
}
