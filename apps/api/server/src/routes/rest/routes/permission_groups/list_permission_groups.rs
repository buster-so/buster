use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::schema::{permission_groups, permission_groups_to_identities, dataset_permissions, dataset_groups_permissions};
use database::enums::IdentityType;
use crate::routes::rest::ApiResponse;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize)]
pub struct PermissionGroupInfo {
    pub id: Uuid,
    pub name: String,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_count: i64,
    pub dataset_count: i64,
    pub dataset_group_count: i64,
}

pub async fn list_permission_groups(
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<ApiResponse<Vec<PermissionGroupInfo>>, (StatusCode, &'static str)> {
    let permission_groups = match list_permission_groups_handler(user).await {
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

async fn list_permission_groups_handler(user: AuthenticatedUser) -> Result<Vec<PermissionGroupInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    let permission_groups = permission_groups::table
        .left_join(
            permission_groups_to_identities::table.on(
                permission_groups_to_identities::permission_group_id
                    .eq(permission_groups::id)
                    .and(permission_groups_to_identities::deleted_at.is_null())
                    .and(permission_groups_to_identities::identity_type.eq(IdentityType::User))
            ),
        )
        .left_join(
            dataset_permissions::table.on(
                dataset_permissions::permission_id
                    .eq(permission_groups::id)
                    .and(dataset_permissions::permission_type.eq("permission_group"))
                    .and(dataset_permissions::deleted_at.is_null())
            ),
        )
        .left_join(
            dataset_groups_permissions::table.on(
                dataset_groups_permissions::permission_id
                    .eq(permission_groups::id)
                    .and(dataset_groups_permissions::permission_type.eq("permission_group"))
                    .and(dataset_groups_permissions::deleted_at.is_null())
            ),
        )
        .group_by((
            permission_groups::id,
            permission_groups::name,
            permission_groups::organization_id,
            permission_groups::created_by,
            permission_groups::updated_by,
            permission_groups::created_at,
            permission_groups::updated_at,
        ))
        .select((
            permission_groups::id,
            permission_groups::name,
            permission_groups::organization_id,
            permission_groups::created_by,
            permission_groups::updated_by,
            permission_groups::created_at,
            permission_groups::updated_at,
            diesel::dsl::sql::<diesel::sql_types::BigInt>(
                "COUNT(DISTINCT permission_groups_to_identities.identity_id)",
            ),
            diesel::dsl::sql::<diesel::sql_types::BigInt>(
                "COUNT(DISTINCT dataset_permissions.dataset_id)",
            ),
            diesel::dsl::sql::<diesel::sql_types::BigInt>(
                "COUNT(DISTINCT dataset_groups_permissions.dataset_group_id)",
            ),
        ))
        .filter(permission_groups::organization_id.eq(organization_id))
        .filter(permission_groups::deleted_at.is_null())
        .order_by(permission_groups::created_at.desc())
        .load::<(Uuid, String, Uuid, Uuid, Uuid, DateTime<Utc>, DateTime<Utc>, i64, i64, i64)>(&mut *conn)
        .await?;

    Ok(permission_groups
        .into_iter()
        .map(|(id, name, organization_id, created_by, updated_by, created_at, updated_at, user_count, dataset_count, dataset_group_count)| {
            PermissionGroupInfo {
                id,
                name,
                organization_id,
                created_by,
                updated_by,
                created_at,
                updated_at,
                user_count,
                dataset_count,
                dataset_group_count,
            }
        })
        .collect())
}
