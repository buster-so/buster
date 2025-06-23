use anyhow::Result;
use axum::http::StatusCode;
use axum::{extract::Path, Extension};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use database::enums::IdentityType;
use database::schema::{
    dataset_groups, dataset_groups_permissions, dataset_permissions, datasets, permission_groups,
    permission_groups_to_identities,
};
use database::{
    enums::{UserOrganizationRole, UserOrganizationStatus},
    pool::get_pg_pool,
    schema::{users, users_to_organizations},
};
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct UserPermissionLineage {
    pub id: Option<Uuid>,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UserOverviewItem {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub can_query: bool,
    pub lineage: Vec<Vec<UserPermissionLineage>>,
}

#[derive(Debug, Serialize)]
pub struct DatasetOverview {
    pub dataset_id: Uuid,
    pub users: Vec<UserOverviewItem>,
}

pub async fn get_dataset_overview(
    Extension(user): Extension<AuthenticatedUser>,
    Path(dataset_id): Path<Uuid>,
) -> Result<ApiResponse<DatasetOverview>, (StatusCode, &'static str)> {
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

    // Get all active users in the organization
    let users = users_to_organizations::table
        .inner_join(users::table.on(users_to_organizations::user_id.eq(users::id)))
        .filter(users_to_organizations::status.eq(UserOrganizationStatus::Active))
        .filter(users_to_organizations::deleted_at.is_null())
        .filter(users_to_organizations::organization_id.eq(organization_id))
        .select((
            users::id,
            users::email,
            users_to_organizations::role,
            users::name.nullable(),
        ))
        .load::<(Uuid, String, UserOrganizationRole, Option<String>)>(&mut conn)
        .await
        .map_err(|e| {
            tracing::error!("Error getting users: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        })?;

    let user_ids = users.iter().map(|(id, _, _, _)| *id).collect::<Vec<_>>();

    // Direct dataset access
    let datasets_query: Vec<(Uuid, String, Uuid)> = dataset_permissions::table
        .inner_join(datasets::table.on(dataset_permissions::dataset_id.eq(datasets::id)))
        .filter(dataset_permissions::dataset_id.eq(dataset_id))
        .filter(dataset_permissions::permission_type.eq("user"))
        .filter(dataset_permissions::deleted_at.is_null())
        .filter(dataset_permissions::permission_id.eq_any(&user_ids))
        .select((
            datasets::id,
            datasets::name,
            dataset_permissions::permission_id,
        ))
        .load::<(Uuid, String, Uuid)>(&mut conn)
        .await
        .map_err(|e| {
            tracing::error!("Error getting datasets: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        })?;

    // Permission group access
    let permission_groups_query: Vec<(Uuid, String, Uuid)> = permission_groups_to_identities::table
        .inner_join(
            permission_groups::table
                .on(permission_groups_to_identities::permission_group_id.eq(permission_groups::id)),
        )
        .inner_join(
            dataset_permissions::table.on(permission_groups_to_identities::permission_group_id
                .eq(dataset_permissions::permission_id)
                .and(dataset_permissions::permission_type.eq("permission_group"))),
        )
        .filter(permission_groups_to_identities::identity_id.eq_any(&user_ids))
        .filter(permission_groups_to_identities::identity_type.eq(IdentityType::User))
        .filter(dataset_permissions::deleted_at.is_null())
        .filter(dataset_permissions::dataset_id.eq(dataset_id))
        .filter(permission_groups::deleted_at.is_null())
        .select((
            permission_groups::id,
            permission_groups::name,
            permission_groups_to_identities::identity_id,
        ))
        .load::<(Uuid, String, Uuid)>(&mut conn)
        .await
        .map_err(|e| {
            tracing::error!("Error getting permission groups: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        })?;

    // Dataset group access
    let dataset_groups_query: Vec<(Uuid, String, Uuid)> = dataset_groups_permissions::table
        .inner_join(dataset_groups::table.on(dataset_groups_permissions::dataset_group_id.eq(dataset_groups::id)))
        .inner_join(
            dataset_permissions::table.on(dataset_permissions::permission_id.eq(dataset_groups::id)
                .and(dataset_permissions::permission_type.eq("dataset_group"))),
        )
        .filter(dataset_permissions::dataset_id.eq(dataset_id))
        .filter(dataset_groups_permissions::permission_type.eq("user"))
        .filter(dataset_groups_permissions::deleted_at.is_null())
        .filter(dataset_groups_permissions::permission_id.eq_any(&user_ids))
        .select((
            dataset_groups::id,
            dataset_groups::name,
            dataset_groups_permissions::permission_id,
        ))
        .load::<(Uuid, String, Uuid)>(&mut conn)
        .await
        .map_err(|e| {
            tracing::error!("Error getting dataset groups: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        })?;

    // Permission group to dataset group access
    let permission_group_dataset_groups_query: Vec<(Uuid, String, Uuid, String, Uuid)> = permission_groups_to_identities::table
        .inner_join(
            permission_groups::table
                .on(permission_groups_to_identities::permission_group_id.eq(permission_groups::id)),
        )
        .inner_join(
            dataset_groups_permissions::table.on(permission_groups::id.eq(dataset_groups_permissions::permission_id)
                .and(dataset_groups_permissions::permission_type.eq("permission_group"))),
        )
        .inner_join(
            dataset_groups::table.on(dataset_groups_permissions::dataset_group_id.eq(dataset_groups::id)),
        )
        .inner_join(
            dataset_permissions::table.on(dataset_permissions::permission_id.eq(dataset_groups::id)
                .and(dataset_permissions::permission_type.eq("dataset_group"))),
        )
        .filter(dataset_permissions::dataset_id.eq(dataset_id))
        .filter(permission_groups_to_identities::identity_id.eq_any(&user_ids))
        .filter(permission_groups_to_identities::identity_type.eq(IdentityType::User))
        .filter(permission_groups_to_identities::deleted_at.is_null())
        .filter(dataset_groups_permissions::deleted_at.is_null())
        .filter(permission_groups::deleted_at.is_null())
        .filter(dataset_groups::deleted_at.is_null())
        .filter(dataset_permissions::deleted_at.is_null())
        .select((
            permission_groups::id,
            permission_groups::name,
            dataset_groups::id,
            dataset_groups::name,
            permission_groups_to_identities::identity_id,
        ))
        .load::<(Uuid, String, Uuid, String, Uuid)>(&mut conn)
        .await
        .map_err(|e| {
            tracing::error!("Error getting permission group dataset groups: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        })?;

    let users = users
        .into_iter()
        .map(|(id, email, role, name)| {
            let can_query = match role {
                UserOrganizationRole::WorkspaceAdmin | UserOrganizationRole::DataAdmin | UserOrganizationRole::Querier => true,
                UserOrganizationRole::RestrictedQuerier => {
                    // Check if user has any valid access path
                    let has_direct_access = datasets_query.iter().any(|(_, _, user_id)| *user_id == id);
                    let has_permission_group_access = permission_groups_query.iter().any(|(_, _, user_id)| *user_id == id);
                    let has_dataset_group_access = dataset_groups_query.iter().any(|(_, _, user_id)| *user_id == id);
                    let has_permission_group_dataset_group_access = permission_group_dataset_groups_query.iter().any(|(_, _, _, _, user_id)| *user_id == id);

                    has_direct_access || has_permission_group_access || has_dataset_group_access || has_permission_group_dataset_group_access
                },
                UserOrganizationRole::Viewer => false,
            };

            let mut lineage = vec![];

            // Only add default access lineage if they don't have other access paths or aren't a restricted querier
            let has_other_access = if matches!(role, UserOrganizationRole::RestrictedQuerier) {
                datasets_query.iter().any(|(_, _, user_id)| *user_id == id) ||
                permission_groups_query.iter().any(|(_, _, user_id)| *user_id == id) ||
                dataset_groups_query.iter().any(|(_, _, user_id)| *user_id == id) ||
                permission_group_dataset_groups_query.iter().any(|(_, _, _, _, user_id)| *user_id == id)
            } else {
                false
            };

            if !has_other_access {
                let mut default_lineage = vec![UserPermissionLineage {
                    id: Some(id),
                    type_: String::from("user"),
                    name: Some(String::from("Default Access")),
                }];

                match role {
                    UserOrganizationRole::WorkspaceAdmin => {
                        default_lineage.push(UserPermissionLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Workspace Admin")),
                        });
                    }
                    UserOrganizationRole::DataAdmin => {
                        default_lineage.push(UserPermissionLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Data Admin")),
                        });
                    }
                    UserOrganizationRole::Querier => {
                        default_lineage.push(UserPermissionLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Querier")),
                        });
                    }
                    UserOrganizationRole::RestrictedQuerier => {
                        default_lineage.push(UserPermissionLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Restricted Querier")),
                        });
                    }
                    UserOrganizationRole::Viewer => {
                        default_lineage.push(UserPermissionLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Viewer")),
                        });
                    }
                }

                lineage.push(default_lineage);
            }

            // Only add additional lineages for RestrictedQuerier if they have access
            if matches!(role, UserOrganizationRole::RestrictedQuerier) {
                // Add direct dataset access lineage
                if let Some((dataset_id, dataset_name, _)) =
                    datasets_query.iter().find(|(_, _, user_id)| *user_id == id)
                {
                    lineage.push(vec![
                        UserPermissionLineage {
                            id: Some(*dataset_id),
                            type_: String::from("datasets"),
                            name: Some(String::from("Direct Access")),
                        },
                        UserPermissionLineage {
                            id: Some(*dataset_id),
                            type_: String::from("datasets"),
                            name: Some(dataset_name.clone()),
                        },
                    ]);
                }

                // Add permission group lineage
                if let Some((group_id, group_name, _)) = permission_groups_query
                    .iter()
                    .find(|(_, _, user_id)| *user_id == id)
                {
                    lineage.push(vec![
                        UserPermissionLineage {
                            id: Some(*group_id),
                            type_: String::from("permissionGroups"),
                            name: Some(String::from("Permission Group")),
                        },
                        UserPermissionLineage {
                            id: Some(*group_id),
                            type_: String::from("permissionGroups"),
                            name: Some(group_name.clone()),
                        },
                    ]);
                }

                // Add dataset group lineage
                if let Some((group_id, group_name, _)) = dataset_groups_query
                    .iter()
                    .find(|(_, _, user_id)| *user_id == id)
                {
                    lineage.push(vec![
                        UserPermissionLineage {
                            id: Some(*group_id),
                            type_: String::from("datasetGroups"),
                            name: Some(String::from("Dataset Group")),
                        },
                        UserPermissionLineage {
                            id: Some(*group_id),
                            type_: String::from("datasetGroups"),
                            name: Some(group_name.clone()),
                        },
                    ]);
                }

                // Add permission group to dataset group lineage
                if let Some((perm_group_id, perm_group_name, dataset_group_id, dataset_group_name, _)) = 
                    permission_group_dataset_groups_query
                        .iter()
                        .find(|(_, _, _, _, user_id)| *user_id == id)
                {
                    lineage.push(vec![
                        UserPermissionLineage {
                            id: Some(*perm_group_id),
                            type_: String::from("permissionGroups"),
                            name: Some(String::from("Permission Group")),
                        },
                        UserPermissionLineage {
                            id: Some(*perm_group_id),
                            type_: String::from("permissionGroups"),
                            name: Some(perm_group_name.clone()),
                        },
                        UserPermissionLineage {
                            id: Some(*dataset_group_id),
                            type_: String::from("datasetGroups"),
                            name: Some(String::from("Dataset Group")),
                        },
                        UserPermissionLineage {
                            id: Some(*dataset_group_id),
                            type_: String::from("datasetGroups"),
                            name: Some(dataset_group_name.clone()),
                        },
                    ]);
                }
            }

            UserOverviewItem {
                id,
                name: name.unwrap_or(email.clone()),
                email,
                can_query,
                lineage,
            }
        })
        .collect();

    let overview = DatasetOverview { dataset_id, users };

    Ok(ApiResponse::JsonData(overview))
}
