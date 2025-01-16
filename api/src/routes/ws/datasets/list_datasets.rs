use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::{
    allow_columns_to_appear_in_same_group_by_clause,
    dsl::sql,
    sql_types::{Nullable, Timestamptz},
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl,
};
use diesel_async::RunQueryDsl;
use uuid::Uuid;
use tokio;

use serde::{Deserialize, Serialize};

use crate::{
    database::{
        enums::{IdentityType, UserOrganizationRole},
        lib::{get_pg_pool, PgPool},
        models::{User, UserToOrganization},
        schema::{
            data_sources, dataset_permissions, datasets, datasets_to_permission_groups, messages,
            permission_groups_to_identities, permission_groups_to_users, teams_to_users, users,
            users_to_organizations,
        },
    },
    routes::ws::{
        datasets::datasets_router::{DatasetEvent, DatasetRoute},
        ws::{WsErrorCode, WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::{send_error_message, send_ws_message},
    },
    utils::{clients::sentry_utils::send_sentry_error, user::user_info::get_user_organization_id},
};

#[derive(Deserialize, Debug, Clone)]
pub struct ListDatasetsRequest {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub admin_view: Option<bool>,
    pub enabled: Option<bool>,
    pub imported: Option<bool>,
    pub permission_group_id: Option<Uuid>,
    pub belongs_to: Option<bool>,
    pub data_source_id: Option<Uuid>,
}

#[derive(Serialize, Debug, Clone)]
pub struct ListDatasetOwner {
    pub id: Uuid,
    pub name: String,
    pub avatar_url: Option<String>,
}

#[derive(Serialize, Debug, Clone)]
pub struct ListDatasetDataSource {
    pub id: Uuid,
    pub name: String,
}

#[derive(Serialize, Debug, Clone)]
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

allow_columns_to_appear_in_same_group_by_clause!(
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
);

pub async fn list_datasets(user: &User, req: ListDatasetsRequest) -> Result<()> {
    let list_dashboards_res = match list_datasets_handler(
        &user.id,
        req.page,
        req.page_size,
        req.admin_view,
        req.enabled,
        req.imported,
        req.permission_group_id,
        req.belongs_to,
        req.data_source_id,
    )
    .await
    {
        Ok(res) => res,
        Err(e) => {
            tracing::error!("Error getting threads: {}", e);
            let err = anyhow!("Error getting threads: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            send_error_message(
                &user.id.to_string(),
                WsRoutes::Datasets(DatasetRoute::List),
                WsEvent::Datasets(DatasetEvent::ListDatasets),
                WsErrorCode::InternalServerError,
                "Failed to list datasets.".to_string(),
                user,
            )
            .await?;
            return Err(err);
        }
    };

    let event = match req.admin_view {
        Some(true) => DatasetEvent::ListDatasetsAdmin,
        Some(false) => DatasetEvent::ListDatasets,
        None => DatasetEvent::ListDatasets,
    };

    let list_dashboards_message = WsResponseMessage::new(
        WsRoutes::Datasets(DatasetRoute::List),
        WsEvent::Datasets(event),
        list_dashboards_res,
        None,
        user,
        WsSendMethod::SenderOnly,
    );

    match send_ws_message(&user.id.to_string(), &list_dashboards_message).await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error sending ws message: {}", e);
            let err = anyhow!("Error sending ws message: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err(err);
        }
    }

    Ok(())
}

async fn list_datasets_handler(
    user_id: &Uuid,
    page: Option<i64>,
    page_size: Option<i64>,
    admin_view: Option<bool>,
    enabled: Option<bool>,
    imported: Option<bool>,
    permission_group_id: Option<Uuid>,
    _belongs_to: Option<bool>,
    data_source_id: Option<Uuid>,
) -> Result<Vec<ListDatasetObject>> {
    let page = page.unwrap_or(0);
    let page_size = page_size.unwrap_or(25);
    let admin_view = admin_view.unwrap_or(false);

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

async fn get_user_permissioned_datasets(
    user_id: &Uuid,
    page: i64,
    page_size: i64,
) -> Result<Vec<ListDatasetObject>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    let list_dataset_records = match datasets::table
        .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
        .inner_join(
            datasets_to_permission_groups::table.on(datasets::id
                .eq(datasets_to_permission_groups::dataset_id)
                .and(datasets_to_permission_groups::deleted_at.is_null())),
        )
        .inner_join(
            permission_groups_to_identities::table.on(
                datasets_to_permission_groups::permission_group_id
                    .eq(permission_groups_to_identities::permission_group_id)
                    .and(permission_groups_to_identities::deleted_at.is_null()),
            ),
        )
        .left_join(
            teams_to_users::table.on(permission_groups_to_identities::identity_id
                .eq(teams_to_users::team_id)
                .and(permission_groups_to_identities::identity_type.eq(IdentityType::Team))
                .and(teams_to_users::deleted_at.is_null())),
        )
        .inner_join(users::table.on(datasets::created_by.eq(users::id)))
        .left_join(messages::table.on(messages::dataset_id.eq(datasets::id.nullable())))
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
            sql::<Nullable<Timestamptz>>("max(messages.created_at) as last_queried"),
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
        .filter(datasets::deleted_at.is_null())
        .filter(
            permission_groups_to_identities::identity_id
                .eq(user_id)
                .or(teams_to_users::user_id.eq(user_id)),
        )
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
            Option<DateTime<Utc>>,
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
                last_queried,
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
                    last_queried,
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
        .left_join(messages::table.on(messages::dataset_id.eq(datasets::id.nullable())))
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
            sql::<Nullable<Timestamptz>>("max(messages.created_at) as last_queried"),
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
            Option<DateTime<Utc>>,
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
                last_queried,
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
                    last_queried,
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

async fn list_permission_group_datasets(
    organization_id: Uuid,
    page: i64,
    page_size: i64,
    permission_group_id: Uuid,
) -> Result<Vec<ListDatasetObject>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    let list_dataset_records = match datasets::table
        .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
        .left_join(
            datasets_to_permission_groups::table.on(datasets::id
                .eq(datasets_to_permission_groups::dataset_id)
                .and(datasets_to_permission_groups::permission_group_id.eq(permission_group_id))
                .and(datasets_to_permission_groups::deleted_at.is_null())),
        )
        .select((
            datasets::id,
            datasets::name,
            data_sources::id,
            data_sources::name,
            datasets_to_permission_groups::permission_group_id.nullable(),
        ))
        .filter(datasets::organization_id.eq(organization_id))
        .filter(datasets::deleted_at.is_null())
        .filter(datasets::enabled.eq(true))
        .limit(page_size)
        .offset(page * page_size)
        .load::<(Uuid, String, Uuid, String, Option<Uuid>)>(&mut conn)
        .await
    {
        Ok(datasets) => datasets,
        Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
    };

    let list_dataset_objects: Vec<ListDatasetObject> = list_dataset_records
        .into_iter()
        .map(
            |(id, name, data_source_id, data_source_name, permission_group_id)| ListDatasetObject {
                id,
                name,
                created_at: None,
                updated_at: None,
                enabled: None,
                imported: None,
                data_source: ListDatasetDataSource {
                    id: data_source_id,
                    name: data_source_name,
                },
                last_queried: None,
                owner: None,
                belongs_to: Some(permission_group_id.is_some()),
            },
        )
        .collect();

    Ok(list_dataset_objects)
}

async fn get_restricted_user_datasets(
    user_id: &Uuid,
    page: i64,
    page_size: i64,
) -> Result<Vec<ListDatasetObject>> {
    let direct_user_permissioned_datasets_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let result = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(users::table.on(datasets::created_by.eq(users::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id)),
                )
                .left_join(messages::table.on(messages::dataset_id.eq(datasets::id.nullable())))
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
                    sql::<Nullable<Timestamptz>>("max(messages.created_at) as last_queried"),
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
                .filter(dataset_permissions::permission_id.eq(user_id))
                .filter(dataset_permissions::permission_type.eq("user"))
                .filter(datasets::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
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
                    Option<DateTime<Utc>>,
                )>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(result)
        })
    };

    // fetch permissions for user through permission group
    let permission_group_datasets_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let permission_group_datasets: Vec<(
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
                Option<DateTime<Utc>>,
            )> = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(users::table.on(datasets::created_by.eq(users::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id)),
                )
                .inner_join(
                    permission_groups_to_users::table
                        .on(permission_groups_to_users::user_id.eq(user_id)),
                )
                .left_join(messages::table.on(messages::dataset_id.eq(datasets::id.nullable())))
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
                    sql::<Nullable<Timestamptz>>("max(messages.created_at) as last_queried"),
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
                .filter(
                    dataset_permissions::permission_id
                        .eq(permission_groups_to_users::permission_group_id),
                )
                .filter(dataset_permissions::permission_type.eq("group"))
                .filter(datasets::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
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
                    Option<DateTime<Utc>>,
                )>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(permission_group_datasets)
        })
    };

    let mut all_datasets: Vec<(
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
        Option<DateTime<Utc>>,
    )> = Vec::new();

    match direct_user_permissioned_datasets_handle.await {
        Ok(Ok(direct_user_permissioned_datasets)) => {
            all_datasets.extend(direct_user_permissioned_datasets)
        }
        Ok(Err(e)) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
        Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
    }

    match permission_group_datasets_handle.await {
        Ok(Ok(permission_group_datasets)) => all_datasets.extend(permission_group_datasets),
        Ok(Err(e)) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
        Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
    }

    // Deduplicate based on dataset id (first tuple element)
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
                user_id,
                user_name,
                user_email,
                data_source_id,
                data_source_name,
                last_queried,
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
                    last_queried,
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
