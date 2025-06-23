use anyhow::{anyhow, Result};
use axum::{extract::Query, Extension};
use chrono::{DateTime, Utc};
use diesel::{
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl,
};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use middleware::AuthenticatedUser;

use database::{
    enums::{IdentityType, UserOrganizationRole},
    models::UserToOrganization,
    pool::get_pg_pool,
    schema::{
        data_sources, dataset_groups, dataset_groups_permissions, dataset_permissions, datasets,
        messages_deprecated, permission_groups_to_identities, users, users_to_organizations,
    },
};

use crate::routes::rest::ApiResponse;

#[derive(Deserialize)]
pub struct ListDatasetsQuery {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub admin_view: Option<bool>,
    pub enabled: Option<bool>,
    pub imported: Option<bool>,
    pub permission_group_id: Option<Uuid>,
    pub belongs_to: Option<bool>,
    pub data_source_id: Option<Uuid>,
}

#[derive(Serialize)]
pub struct ListDatasetOwner {
    pub id: Uuid,
    pub name: String,
    pub avatar_url: Option<String>,
}

#[derive(Serialize)]
pub struct ListDatasetDataSource {
    pub id: Uuid,
    pub name: String,
}

#[derive(Serialize)]
pub struct ListDatasetObject {
    pub id: Uuid,
    pub name: String,
    pub data_source: ListDatasetDataSource,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_queried: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub imported: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner: Option<ListDatasetOwner>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub belongs_to: Option<bool>,
}

pub async fn list_datasets(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListDatasetsQuery>,
) -> Result<ApiResponse<Vec<ListDatasetObject>>, (axum::http::StatusCode, &'static str)> {
    let datasets = match list_datasets_handler(
        &user.id,
        query.page,
        query.page_size,
        query.admin_view,
        query.enabled,
        query.imported,
        query.permission_group_id,
        query.belongs_to,
        query.data_source_id,
    )
    .await
    {
        Ok(datasets) => datasets,
        Err(e) => {
            tracing::error!("Error listing datasets: {:?}", e);
            return Err((
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to list datasets",
            ));
        }
    };

    Ok(ApiResponse::JsonData(datasets))
}

async fn list_datasets_handler(
    user_id: &Uuid,
    page: Option<i64>,
    page_size: Option<i64>,
    admin_view: Option<bool>,
    enabled: Option<bool>,
    imported: Option<bool>,
    _permission_group_id: Option<Uuid>,
    _belongs_to: Option<bool>,
    data_source_id: Option<Uuid>,
) -> Result<Vec<ListDatasetObject>> {
    let page = page.unwrap_or(0);
    let page_size = page_size.unwrap_or(25);
    let _admin_view = admin_view.unwrap_or(false);

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    // Right now we only allow users to have one organization this will change in the future
    let user_organization_record = match users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .select(users_to_organizations::all_columns)
        .first::<UserToOrganization>(&mut conn)
        .await
    {
        Ok(organization_id) => organization_id,
        Err(e) => return Err(anyhow!("Unable to get organization from database: {}", e)),
    };
    let list_of_datasets = match &user_organization_record.role {
        UserOrganizationRole::WorkspaceAdmin
        | UserOrganizationRole::DataAdmin
        | UserOrganizationRole::Querier => {
            get_org_datasets(
                &user_organization_record.organization_id,
                page,
                page_size,
                enabled,
                imported,
                data_source_id,
            )
            .await?
        }
        UserOrganizationRole::RestrictedQuerier => {
            get_restricted_user_datasets(user_id, page, page_size).await?
        }
        UserOrganizationRole::Viewer => Vec::new(),
    };

    Ok(list_of_datasets)
}

async fn get_org_datasets(
    organization_id: &Uuid,
    page: i64,
    page_size: i64,
    enabled: Option<bool>,
    imported: Option<bool>,
    data_source_id: Option<Uuid>,
) -> Result<Vec<ListDatasetObject>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    let mut query = datasets::table
        .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
        .inner_join(users::table.on(datasets::created_by.eq(users::id)))
        .left_join(
            messages_deprecated::table
                .on(messages_deprecated::dataset_id.eq(datasets::id.nullable())),
        )
        .select((
            datasets::id,
            datasets::name,
            datasets::created_at,
            datasets::updated_at,
            datasets::enabled,
            datasets::imported,
            users::id,
            users::name.nullable(),
            users::email,
            data_sources::id,
            data_sources::name,
        ))
        .group_by((
            datasets::id,
            datasets::name,
            datasets::created_at,
            datasets::updated_at,
            datasets::enabled,
            datasets::imported,
            users::id,
            users::name,
            users::email,
            data_sources::id,
            data_sources::name,
        ))
        .filter(datasets::organization_id.eq(organization_id))
        .filter(datasets::deleted_at.is_null())
        .into_boxed();

    if let Some(enabled_value) = enabled {
        query = query.filter(datasets::enabled.eq(enabled_value));
    } else {
        query = query.filter(datasets::enabled.eq(true));
    }

    if let Some(data_source_id) = data_source_id {
        query = query.filter(datasets::data_source_id.eq(data_source_id));
    }

    if let Some(imported_value) = imported {
        query = query.filter(datasets::imported.eq(imported_value));
    }

    let list_dataset_records = match query
        .limit(page_size)
        .offset(page * page_size)
        .load::<(
            Uuid,
            String,
            DateTime<Utc>,
            DateTime<Utc>,
            bool,
            bool,
            Uuid,
            Option<String>,
            String,
            Uuid,
            String,
        )>(&mut conn)
        .await
    {
        Ok(datasets) => datasets,
        Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
    };

    let list_dataset_objects: Vec<ListDatasetObject> = list_dataset_records
        .into_iter()
        .map(
            |(
                id,
                name,
                created_at,
                updated_at,
                enabled,
                imported,
                user_id,
                user_name,
                user_email,
                data_source_id,
                data_source_name,
            )| {
                ListDatasetObject {
                    id,
                    name,
                    created_at: Some(created_at),
                    updated_at: Some(updated_at),
                    enabled: Some(enabled),
                    imported: Some(imported),
                    data_source: ListDatasetDataSource {
                        id: data_source_id,
                        name: data_source_name,
                    },
                    last_queried: None,
                    owner: Some(ListDatasetOwner {
                        id: user_id,
                        name: user_name.unwrap_or(user_email),
                        avatar_url: None,
                    }),
                    belongs_to: None,
                }
            },
        )
        .collect();

    Ok(list_dataset_objects)
}

async fn get_restricted_user_datasets(
    user_id: &Uuid,
    _page: i64,
    _page_size: i64,
) -> Result<Vec<ListDatasetObject>> {
    // Direct dataset access
    let direct_user_permissioned_datasets_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let result = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id)),
                )
                .filter(dataset_permissions::permission_id.eq(user_id))
                .filter(dataset_permissions::permission_type.eq("user"))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .filter(data_sources::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
                .select((
                    datasets::id,
                    datasets::name,
                    datasets::created_at,
                    datasets::updated_at,
                    datasets::enabled,
                    datasets::imported,
                    data_sources::id,
                    data_sources::name,
                ))
                .load::<(
                    Uuid,
                    String,
                    DateTime<Utc>,
                    DateTime<Utc>,
                    bool,
                    bool,
                    Uuid,
                    String,
                )>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(result)
        })
    };

    // Permission group access
    let permission_group_datasets_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let result = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id)),
                )
                .inner_join(
                    permission_groups_to_identities::table.on(
                        permission_groups_to_identities::identity_id
                            .eq(user_id)
                            .and(
                                permission_groups_to_identities::identity_type
                                    .eq(IdentityType::User),
                            ),
                    ),
                )
                .filter(
                    dataset_permissions::permission_id
                        .eq(permission_groups_to_identities::permission_group_id),
                )
                .filter(dataset_permissions::permission_type.eq("permission_group"))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(permission_groups_to_identities::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .filter(data_sources::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
                .select((
                    datasets::id,
                    datasets::name,
                    datasets::created_at,
                    datasets::updated_at,
                    datasets::enabled,
                    datasets::imported,
                    data_sources::id,
                    data_sources::name,
                ))
                .load::<(
                    Uuid,
                    String,
                    DateTime<Utc>,
                    DateTime<Utc>,
                    bool,
                    bool,
                    Uuid,
                    String,
                )>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(result)
        })
    };

    // Dataset group access
    let dataset_group_datasets_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let result = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id)),
                )
                .inner_join(
                    dataset_groups_permissions::table.on(dataset_groups_permissions::permission_id
                        .eq(user_id)
                        .and(dataset_groups_permissions::permission_type.eq("user"))),
                )
                .inner_join(
                    dataset_groups::table
                        .on(dataset_groups::id.eq(dataset_groups_permissions::dataset_group_id)),
                )
                .filter(dataset_permissions::permission_id.eq(dataset_groups::id))
                .filter(dataset_permissions::permission_type.eq("dataset_group"))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(dataset_groups_permissions::deleted_at.is_null())
                .filter(dataset_groups::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .filter(data_sources::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
                .select((
                    datasets::id,
                    datasets::name,
                    datasets::created_at,
                    datasets::updated_at,
                    datasets::enabled,
                    datasets::imported,
                    data_sources::id,
                    data_sources::name,
                ))
                .load::<(
                    Uuid,
                    String,
                    DateTime<Utc>,
                    DateTime<Utc>,
                    bool,
                    bool,
                    Uuid,
                    String,
                )>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(result)
        })
    };

    // Permission group to dataset group access
    let permission_group_dataset_groups_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let result = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id)),
                )
                .inner_join(
                    dataset_groups::table.on(dataset_groups::id
                        .eq(dataset_permissions::permission_id)
                        .and(dataset_permissions::permission_type.eq("dataset_group"))),
                )
                .inner_join(
                    dataset_groups_permissions::table
                        .on(dataset_groups::id.eq(dataset_groups_permissions::dataset_group_id)),
                )
                .inner_join(
                    permission_groups_to_identities::table.on(
                        permission_groups_to_identities::identity_id
                            .eq(user_id)
                            .and(
                                permission_groups_to_identities::identity_type
                                    .eq(IdentityType::User),
                            )
                            .and(
                                dataset_groups_permissions::permission_id
                                    .eq(permission_groups_to_identities::permission_group_id),
                            )
                            .and(
                                dataset_groups_permissions::permission_type.eq("permission_group"),
                            ),
                    ),
                )
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(dataset_groups_permissions::deleted_at.is_null())
                .filter(dataset_groups::deleted_at.is_null())
                .filter(permission_groups_to_identities::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .filter(data_sources::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
                .select((
                    datasets::id,
                    datasets::name,
                    datasets::created_at,
                    datasets::updated_at,
                    datasets::enabled,
                    datasets::imported,
                    data_sources::id,
                    data_sources::name,
                ))
                .load::<(
                    Uuid,
                    String,
                    DateTime<Utc>,
                    DateTime<Utc>,
                    bool,
                    bool,
                    Uuid,
                    String,
                )>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(result)
        })
    };

    let mut all_datasets = Vec::new();

    // Collect results from all handles
    match direct_user_permissioned_datasets_handle.await {
        Ok(Ok(datasets)) => all_datasets.extend(datasets),
        Ok(Err(e)) => return Err(anyhow!("Unable to get direct datasets: {}", e)),
        Err(e) => return Err(anyhow!("Task join error for direct datasets: {}", e)),
    }

    match permission_group_datasets_handle.await {
        Ok(Ok(datasets)) => all_datasets.extend(datasets),
        Ok(Err(e)) => return Err(anyhow!("Unable to get permission group datasets: {}", e)),
        Err(e) => {
            return Err(anyhow!(
                "Task join error for permission group datasets: {}",
                e
            ))
        }
    }

    match dataset_group_datasets_handle.await {
        Ok(Ok(datasets)) => all_datasets.extend(datasets),
        Ok(Err(e)) => return Err(anyhow!("Unable to get dataset group datasets: {}", e)),
        Err(e) => return Err(anyhow!("Task join error for dataset group datasets: {}", e)),
    }

    match permission_group_dataset_groups_handle.await {
        Ok(Ok(datasets)) => all_datasets.extend(datasets),
        Ok(Err(e)) => {
            return Err(anyhow!(
                "Unable to get permission group dataset group datasets: {}",
                e
            ))
        }
        Err(e) => {
            return Err(anyhow!(
                "Task join error for permission group dataset group datasets: {}",
                e
            ))
        }
    }

    // Deduplicate based on dataset id
    all_datasets.sort_by_key(|k| k.0);
    all_datasets.dedup_by_key(|k| k.0);

    let list_dataset_objects: Vec<ListDatasetObject> = all_datasets
        .into_iter()
        .map(
            |(
                id,
                name,
                created_at,
                updated_at,
                enabled,
                imported,
                data_source_id,
                data_source_name,
            )| {
                ListDatasetObject {
                    id,
                    name,
                    created_at: Some(created_at),
                    updated_at: Some(updated_at),
                    enabled: Some(enabled),
                    imported: Some(imported),
                    data_source: ListDatasetDataSource {
                        id: data_source_id,
                        name: data_source_name,
                    },
                    last_queried: None,
                    owner: None,
                    belongs_to: None,
                }
            },
        )
        .collect();

    Ok(list_dataset_objects)
}
