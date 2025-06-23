use anyhow::Result;
use axum::{extract::Path, Extension};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{
    enums::{IdentityType, UserOrganizationRole, UserOrganizationStatus},
    pool::get_pg_pool,
    schema::{
        dataset_groups, dataset_groups_permissions, dataset_permissions, datasets,
        permission_groups, permission_groups_to_identities, users, users_to_organizations,
    },
};

use crate::routes::rest::ApiResponse;
use axum::http::StatusCode;
use diesel::{
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl,
};
use middleware::AuthenticatedUser;

#[derive(Serialize, Deserialize, Clone)]
pub struct DatasetLineage {
    pub id: Option<Uuid>,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DatasetInfo {
    pub id: Uuid,
    pub name: String,
    pub can_query: bool,
    pub lineage: Vec<Vec<DatasetLineage>>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserResponse {
    pub id: Uuid,
    pub name: Option<String>,
    pub email: String,
    pub role: UserOrganizationRole,
    pub status: UserOrganizationStatus,
    pub datasets: Vec<DatasetInfo>,
}

pub async fn get_user_by_id(
    Extension(user): Extension<AuthenticatedUser>,
    Path(user_id): Path<Uuid>,
) -> Result<ApiResponse<UserResponse>, (StatusCode, &'static str)> {
    let user_info = match get_user_information(&user_id).await {
        Ok(user_info) => user_info,
        Err(e) => {
            tracing::error!("Error getting user information: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting user information",
            ));
        }
    };

    Ok(ApiResponse::JsonData(user_info))
}

pub async fn get_user_information(user_id: &Uuid) -> Result<UserResponse> {
    let user_id = *user_id;

    // Spawn user info query
    let user_info_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let user_info = match users::table
                .inner_join(
                    users_to_organizations::table.on(users::id.eq(users_to_organizations::user_id)),
                )
                .select((
                    (users::id, users::email, users::name.nullable()),
                    (users_to_organizations::role, users_to_organizations::status),
                    users_to_organizations::organization_id,
                ))
                .filter(users::id.eq(user_id))
                .filter(users_to_organizations::deleted_at.is_null())
                .first::<(
                    (Uuid, String, Option<String>),
                    (UserOrganizationRole, UserOrganizationStatus),
                    Uuid,
                )>(&mut conn)
                .await
            {
                Ok(user_info) => user_info,
                Err(e) => {
                    tracing::error!("Error getting user information: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(user_info)
        })
    };

    // Spawn direct datasets query
    let direct_datasets_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let direct_datasets = match dataset_permissions::table
                .inner_join(datasets::table.on(dataset_permissions::dataset_id.eq(datasets::id)))
                .filter(dataset_permissions::permission_id.eq(user_id))
                .filter(dataset_permissions::permission_type.eq("user"))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .select((datasets::id, datasets::name))
                .load::<(Uuid, String)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => {
                    tracing::error!("Error getting direct datasets: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(direct_datasets)
        })
    };

    // Spawn permission group datasets query
    let permission_group_datasets_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let permission_group_datasets = match permission_groups_to_identities::table
                .inner_join(permission_groups::table.on(
                    permission_groups_to_identities::permission_group_id.eq(permission_groups::id),
                ))
                .inner_join(
                    dataset_permissions::table.on(
                        permission_groups_to_identities::permission_group_id
                            .eq(dataset_permissions::permission_id)
                            .and(dataset_permissions::permission_type.eq("permission_group")),
                    ),
                )
                .inner_join(datasets::table.on(dataset_permissions::dataset_id.eq(datasets::id)))
                .filter(permission_groups_to_identities::identity_id.eq(user_id))
                .filter(permission_groups_to_identities::identity_type.eq(IdentityType::User))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(permission_groups::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .filter(permission_groups_to_identities::deleted_at.is_null())
                .select((
                    datasets::id,
                    datasets::name,
                    permission_groups::id,
                    permission_groups::name,
                ))
                .load::<(Uuid, String, Uuid, String)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => {
                    tracing::error!("Error getting permission group datasets: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(permission_group_datasets)
        })
    };

    // Spawn all organization datasets query
    let org_datasets_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let org_datasets = match datasets::table
                .inner_join(
                    users_to_organizations::table
                        .on(datasets::organization_id.eq(users_to_organizations::organization_id)),
                )
                .filter(users_to_organizations::user_id.eq(user_id))
                .filter(datasets::deleted_at.is_null())
                .filter(users_to_organizations::deleted_at.is_null())
                .select((datasets::id, datasets::name))
                .load::<(Uuid, String)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => {
                    tracing::error!("Error getting organization datasets: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(org_datasets)
        })
    };

    // Spawn direct dataset groups query
    let direct_dataset_groups_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let dataset_groups_data = match dataset_groups_permissions::table
                .inner_join(
                    dataset_groups::table
                        .on(dataset_groups_permissions::dataset_group_id.eq(dataset_groups::id)),
                )
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::permission_id
                        .eq(dataset_groups::id)
                        .and(dataset_permissions::permission_type.eq("dataset_group"))),
                )
                .inner_join(datasets::table.on(dataset_permissions::dataset_id.eq(datasets::id)))
                .filter(dataset_groups_permissions::permission_id.eq(user_id))
                .filter(dataset_groups_permissions::permission_type.eq("user"))
                .filter(dataset_groups_permissions::deleted_at.is_null())
                .filter(dataset_groups::deleted_at.is_null())
                .filter(dataset_permissions::deleted_at.is_null())
                .select((
                    datasets::id,
                    datasets::name,
                    dataset_groups::id,
                    dataset_groups::name,
                ))
                .load::<(Uuid, String, Uuid, String)>(&mut conn)
                .await
            {
                Ok(data) => data,
                Err(e) => {
                    tracing::error!("Error getting dataset groups data: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(dataset_groups_data)
        })
    };

    // Spawn permission group to dataset groups query
    let permission_group_dataset_groups_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let pg_dataset_groups = match permission_groups_to_identities::table
                .inner_join(permission_groups::table.on(
                    permission_groups_to_identities::permission_group_id.eq(permission_groups::id),
                ))
                .inner_join(
                    dataset_groups_permissions::table.on(permission_groups::id
                        .eq(dataset_groups_permissions::permission_id)
                        .and(dataset_groups_permissions::permission_type.eq("permission_group"))),
                )
                .inner_join(
                    dataset_groups::table
                        .on(dataset_groups_permissions::dataset_group_id.eq(dataset_groups::id)),
                )
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::permission_id
                        .eq(dataset_groups::id)
                        .and(dataset_permissions::permission_type.eq("dataset_group"))),
                )
                .inner_join(datasets::table.on(dataset_permissions::dataset_id.eq(datasets::id)))
                .filter(permission_groups_to_identities::identity_id.eq(user_id))
                .filter(permission_groups_to_identities::identity_type.eq(IdentityType::User))
                .filter(permission_groups_to_identities::deleted_at.is_null())
                .filter(dataset_groups_permissions::deleted_at.is_null())
                .filter(permission_groups::deleted_at.is_null())
                .filter(dataset_groups::deleted_at.is_null())
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .select((
                    datasets::id,
                    datasets::name,
                    dataset_groups::id,
                    dataset_groups::name,
                    permission_groups::id,
                    permission_groups::name,
                ))
                .load::<(Uuid, String, Uuid, String, Uuid, String)>(&mut conn)
                .await
            {
                Ok(data) => data,
                Err(e) => {
                    tracing::error!("Error getting permission group dataset groups: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(pg_dataset_groups)
        })
    };

    // Await all futures
    let (
        user_result,
        direct_datasets,
        permission_group_datasets,
        org_datasets,
        direct_dataset_groups,
        permission_group_dataset_groups,
    ) = futures::try_join!(
        user_info_future,
        direct_datasets_future,
        permission_group_datasets_future,
        org_datasets_future,
        direct_dataset_groups_future,
        permission_group_dataset_groups_future,
    )?;

    let (
        (user, (role, status), _org_id),
        direct_datasets,
        permission_group_datasets,
        org_datasets,
        direct_dataset_groups,
        permission_group_dataset_groups,
    ) = (
        user_result?,
        direct_datasets?,
        permission_group_datasets?,
        org_datasets?,
        direct_dataset_groups?,
        permission_group_dataset_groups?,
    );

    let (id, email, name) = user;

    let mut datasets = Vec::new();

    match role {
        UserOrganizationRole::WorkspaceAdmin
        | UserOrganizationRole::DataAdmin
        | UserOrganizationRole::Querier => {
            // All datasets have default access
            for (dataset_id, dataset_name) in org_datasets {
                let role_name = match role {
                    UserOrganizationRole::WorkspaceAdmin => "Workspace Admin",
                    UserOrganizationRole::DataAdmin => "Data Admin",
                    UserOrganizationRole::Querier => "Querier",
                    _ => unreachable!(),
                };

                datasets.push(DatasetInfo {
                    id: dataset_id,
                    name: dataset_name,
                    can_query: true,
                    lineage: vec![vec![
                        DatasetLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Default Access")),
                        },
                        DatasetLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from(role_name)),
                        },
                    ]],
                });
            }
        }
        UserOrganizationRole::Viewer => {
            // No access to any datasets
            for (dataset_id, dataset_name) in org_datasets {
                datasets.push(DatasetInfo {
                    id: dataset_id,
                    name: dataset_name,
                    can_query: false,
                    lineage: vec![vec![
                        DatasetLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Default Access")),
                        },
                        DatasetLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Viewer")),
                        },
                    ]],
                });
            }
        }
        UserOrganizationRole::RestrictedQuerier => {
            let mut processed_dataset_ids = std::collections::HashSet::new();

            // Add datasets with direct access
            for (dataset_id, dataset_name) in direct_datasets {
                processed_dataset_ids.insert(dataset_id);
                datasets.push(DatasetInfo {
                    id: dataset_id,
                    name: dataset_name.clone(),
                    can_query: true,
                    lineage: vec![vec![
                        DatasetLineage {
                            id: Some(dataset_id),
                            type_: String::from("datasets"),
                            name: Some(String::from("Direct Access")),
                        },
                        DatasetLineage {
                            id: Some(dataset_id),
                            type_: String::from("datasets"),
                            name: Some(dataset_name.clone()),
                        },
                    ]],
                });
            }

            // Add datasets with permission group access
            for (dataset_id, dataset_name, group_id, group_name) in permission_group_datasets {
                if processed_dataset_ids.contains(&dataset_id) {
                    continue;
                }
                processed_dataset_ids.insert(dataset_id);
                datasets.push(DatasetInfo {
                    id: dataset_id,
                    name: dataset_name,
                    can_query: true,
                    lineage: vec![vec![
                        DatasetLineage {
                            id: Some(group_id),
                            type_: String::from("permissionGroups"),
                            name: Some(String::from("Permission Group")),
                        },
                        DatasetLineage {
                            id: Some(group_id),
                            type_: String::from("permissionGroups"),
                            name: Some(group_name),
                        },
                    ]],
                });
            }

            // Add datasets with direct dataset group access
            for (dataset_id, dataset_name, group_id, group_name) in direct_dataset_groups {
                if processed_dataset_ids.contains(&dataset_id) {
                    continue;
                }
                processed_dataset_ids.insert(dataset_id);
                datasets.push(DatasetInfo {
                    id: dataset_id,
                    name: dataset_name,
                    can_query: true,
                    lineage: vec![vec![
                        DatasetLineage {
                            id: Some(group_id),
                            type_: String::from("datasetGroups"),
                            name: Some(String::from("Dataset Group")),
                        },
                        DatasetLineage {
                            id: Some(group_id),
                            type_: String::from("datasetGroups"),
                            name: Some(group_name),
                        },
                    ]],
                });
            }

            // Add datasets with permission group to dataset group access
            for (dataset_id, dataset_name, group_id, group_name, perm_group_id, perm_group_name) in
                permission_group_dataset_groups
            {
                if processed_dataset_ids.contains(&dataset_id) {
                    continue;
                }
                processed_dataset_ids.insert(dataset_id);
                datasets.push(DatasetInfo {
                    id: dataset_id,
                    name: dataset_name,
                    can_query: true,
                    lineage: vec![vec![
                        DatasetLineage {
                            id: Some(perm_group_id),
                            type_: String::from("permissionGroups"),
                            name: Some(String::from("Permission Group")),
                        },
                        DatasetLineage {
                            id: Some(perm_group_id),
                            type_: String::from("permissionGroups"),
                            name: Some(perm_group_name),
                        },
                        DatasetLineage {
                            id: Some(group_id),
                            type_: String::from("datasetGroups"),
                            name: Some(String::from("Dataset Group")),
                        },
                        DatasetLineage {
                            id: Some(group_id),
                            type_: String::from("datasetGroups"),
                            name: Some(group_name),
                        },
                    ]],
                });
            }

            // Add remaining datasets with no access
            for (dataset_id, dataset_name) in org_datasets {
                if processed_dataset_ids.contains(&dataset_id) {
                    continue;
                }
                datasets.push(DatasetInfo {
                    id: dataset_id,
                    name: dataset_name,
                    can_query: false,
                    lineage: vec![vec![
                        DatasetLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Default Access")),
                        },
                        DatasetLineage {
                            id: Some(id),
                            type_: String::from("user"),
                            name: Some(String::from("Restricted Querier")),
                        },
                    ]],
                });
            }
        }
    }

    Ok(UserResponse {
        id,
        name,
        email,
        role,
        status,
        datasets,
    })
}
