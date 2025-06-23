use anyhow::Result;
use axum::http::StatusCode;
use axum::{extract::Path, Extension};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use database::schema::users_to_organizations;
use database::{
    pool::get_pg_pool,
    models::{DatasetGroup, PermissionGroup, User},
    schema::{dataset_groups, dataset_permissions, permission_groups, users},
};
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct AssetWithAssignment {
    pub id: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_count: Option<i64>,
    pub name: String,
    pub assigned: bool,
}

// TODO: When we introduce the dataset groups, this list should look for where they are included, not related to permissions.

pub async fn list_assets(
    Extension(user): Extension<AuthenticatedUser>,
    Path((dataset_id, permission_type)): Path<(Uuid, String)>,
) -> Result<ApiResponse<Vec<AssetWithAssignment>>, (StatusCode, &'static str)> {
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

    let mut conn = get_pg_pool().get().await.map_err(|e| {
        tracing::error!("Error getting database connection: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
    })?;

    match permission_type.as_str() {
        "users" => {
            let users_with_assignment = users::table
                .left_join(
                    dataset_permissions::table.on(dataset_permissions::permission_id
                        .eq(users::id)
                        .and(dataset_permissions::dataset_id.eq(dataset_id))
                        .and(dataset_permissions::permission_type.eq("user"))
                        .and(dataset_permissions::deleted_at.is_null())
                        .and(dataset_permissions::organization_id.eq(organization_id))),
                )
                .inner_join(
                    users_to_organizations::table.on(users_to_organizations::user_id.eq(users::id)),
                )
                .select((
                    users::all_columns,
                    diesel::dsl::sql::<diesel::sql_types::Bool>(
                        "dataset_permissions.id IS NOT NULL",
                    ),
                ))
                .filter(users_to_organizations::organization_id.eq(organization_id))
                .load::<(User, bool)>(&mut *conn)
                .await
                .map_err(|e| {
                    tracing::error!("Error loading users: {:?}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
                })?;

            Ok(ApiResponse::JsonData(
                users_with_assignment
                    .into_iter()
                    .map(|(user, assigned)| AssetWithAssignment {
                        id: user.id,
                        email: Some(user.email.clone()),
                        name: user.name.unwrap_or(user.email),
                        assigned,
                        user_count: None,
                    })
                    .collect(),
            ))
        }
        "permission_groups" => {
            let permission_groups_with_assignment = permission_groups::table
                .left_join(
                    dataset_permissions::table.on(dataset_permissions::permission_id
                        .eq(permission_groups::id)
                        .and(dataset_permissions::dataset_id.eq(dataset_id))
                        .and(dataset_permissions::permission_type.eq("permission_group"))
                        .and(dataset_permissions::deleted_at.is_null())
                        .and(dataset_permissions::organization_id.eq(organization_id))),
                )
                .select((
                    permission_groups::all_columns,
                    diesel::dsl::sql::<diesel::sql_types::Bool>(
                        "dataset_permissions.id IS NOT NULL",
                    ),
                ))
                .filter(permission_groups::deleted_at.is_null())
                .filter(permission_groups::organization_id.eq(organization_id))
                .load::<(PermissionGroup, bool)>(&mut *conn)
                .await
                .map_err(|e| {
                    tracing::error!("Error loading permission groups: {:?}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
                })?;

            Ok(ApiResponse::JsonData(
                permission_groups_with_assignment
                    .into_iter()
                    .map(|(group, assigned)| AssetWithAssignment {
                        id: group.id,
                        name: group.name,
                        assigned,
                        email: None,
                        user_count: None,
                    })
                    .collect(),
            ))
        }
        "dataset_groups" => {
            let dataset_groups_with_assignment = dataset_groups::table
                .left_join(
                    dataset_permissions::table.on(dataset_permissions::permission_id
                        .eq(dataset_groups::id)
                        .and(dataset_permissions::dataset_id.eq(dataset_id))
                        .and(dataset_permissions::permission_type.eq("dataset_group"))
                        .and(dataset_permissions::deleted_at.is_null())
                        .and(dataset_permissions::organization_id.eq(organization_id))),
                )
                .select((
                    dataset_groups::all_columns,
                    diesel::dsl::sql::<diesel::sql_types::Bool>(
                        "dataset_permissions.id IS NOT NULL",
                    ),
                ))
                .filter(dataset_groups::organization_id.eq(organization_id))
                .filter(dataset_groups::deleted_at.is_null())
                .load::<(DatasetGroup, bool)>(&mut *conn)
                .await
                .map_err(|e| {
                    tracing::error!("Error loading dataset groups: {:?}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
                })?;

            Ok(ApiResponse::JsonData(
                dataset_groups_with_assignment
                    .into_iter()
                    .map(|(group, assigned)| AssetWithAssignment {
                        id: group.id,
                        name: group.name,
                        assigned,
                        email: None,
                        user_count: None,
                    })
                    .collect(),
            ))
        }
        _ => Err((StatusCode::BAD_REQUEST, "Invalid permission type")),
    }
}
