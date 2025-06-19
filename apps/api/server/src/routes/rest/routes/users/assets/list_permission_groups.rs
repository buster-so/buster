use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use database::enums::IdentityType;
use database::pool::get_pg_pool;
use database::schema::{
    dataset_permissions, permission_groups, permission_groups_to_identities,
};
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize)]
pub struct PermissionGroupInfo {
    pub id: Uuid,
    pub name: String,
    pub dataset_count: i64,
    pub assigned: bool,
}

pub async fn list_permission_groups(
    Extension(user): Extension<AuthenticatedUser>,
    Path(user_id): Path<Uuid>,
) -> Result<ApiResponse<Vec<PermissionGroupInfo>>, (StatusCode, &'static str)> {
    let permission_groups = match list_permission_groups_handler(user, user_id).await {
        Ok(groups) => groups,
        Err(e) => {
            tracing::error!("Error listing permission groups: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing permission groups",
            ));
        }
    };

    Ok(ApiResponse::JsonData(permission_groups))
}

async fn list_permission_groups_handler(user: AuthenticatedUser, user_id: Uuid) -> Result<Vec<PermissionGroupInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    if !is_user_workspace_admin_or_data_admin(&user, &organization_id).await? {
        return Err(anyhow::anyhow!(
            "User is not authorized to list permission groups"
        ));
    }

    let groups = permission_groups::table
        .left_join(
            permission_groups_to_identities::table.on(
                permission_groups_to_identities::permission_group_id
                    .eq(permission_groups::id)
                    .and(permission_groups_to_identities::deleted_at.is_null())
                    .and(permission_groups_to_identities::identity_id.eq(user_id))
                    .and(permission_groups_to_identities::identity_type.eq(IdentityType::User)),
            ),
        )
        .left_join(
            dataset_permissions::table.on(dataset_permissions::permission_id
                .eq(permission_groups::id)
                .and(dataset_permissions::permission_type.eq("permission_group"))
                .and(dataset_permissions::deleted_at.is_null())
                .and(dataset_permissions::organization_id.eq(organization_id))),
        )
        .select((
            permission_groups::id,
            permission_groups::name,
            diesel::dsl::sql::<diesel::sql_types::BigInt>(
                "COALESCE(count(DISTINCT dataset_permissions.id), 0)",
            ),
            diesel::dsl::sql::<diesel::sql_types::Bool>(
                "bool_or(permission_groups_to_identities.identity_id IS NOT NULL)",
            ),
        ))
        .group_by((
            permission_groups::id,
            permission_groups::name,
        ))
        .filter(permission_groups::organization_id.eq(organization_id))
        .filter(permission_groups::deleted_at.is_null())
        .order_by(permission_groups::created_at.desc())
        .load::<(Uuid, String, i64, bool)>(&mut *conn)
        .await?;

    Ok(groups
        .into_iter()
        .map(
            |(id, name, dataset_count, assigned)| PermissionGroupInfo {
                id,
                name,
                dataset_count,
                assigned,
            },
        )
        .collect())
}
