use anyhow::anyhow;
use axum::Extension;
use chrono::{DateTime, Utc};
use diesel::{BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::Serialize;
use std::sync::Arc;
use uuid::Uuid;

use axum::extract::Path;
use axum::http::StatusCode;
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;
use database::organization::get_user_organization_id;
use database::enums::{AssetPermissionRole, AssetType, UserOrganizationRole};
use database::pool::{get_pg_pool, PgPool};
use database::schema::{
    asset_permissions, collections_to_assets, dashboard_files, dashboards, metric_files, teams_to_users, threads_deprecated, threads_to_dashboards, users_to_organizations
};

pub async fn get_asset_access(
    Path((asset_type, asset_id)): Path<(AssetType, uuid::Uuid)>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<ApiResponse<AssetRecord>, (StatusCode, &'static str)> {
    let asset_record = match get_asset_access_handler(&user, asset_type, asset_id).await {
        Ok(asset_record) => asset_record,
        Err(e) => {
            if e.to_string().contains("Asset expired") {
                return Err((StatusCode::GONE, "This asset is no longer public."));
            }
            tracing::error!("Error getting asset access: {:?}", e);
            return Err((StatusCode::NOT_FOUND, "Unable to find asset."));
        }
    };

    Ok(ApiResponse::JsonData(asset_record))
}

#[derive(Serialize)]
pub struct AssetRecord {
    pub id: Uuid,
    pub public: bool,
    pub password_required: bool,
    pub has_access: bool,
}

async fn get_asset_access_handler(
    user: &AuthenticatedUser,
    asset_type: AssetType,
    asset_id: uuid::Uuid,
) -> anyhow::Result<AssetRecord> {
    let pg_pool = get_pg_pool();

    let (asset_info, user_permission) = match asset_type {
        AssetType::Collection => {
            return Err(anyhow!(
                "Public access is not supported for collections yet"
            ))
        }
        AssetType::Dashboard => {
            let mut conn = pg_pool.get().await?;

            let dashboard_info = dashboards::table
                .select((
                    dashboards::id,
                    dashboards::publicly_accessible,
                    dashboards::password_secret_id.is_not_null(),
                    dashboards::public_expiry_date,
                ))
                .filter(dashboards::id.eq(&asset_id))
                .filter(dashboards::deleted_at.is_null())
                .first::<(Uuid, bool, bool, Option<DateTime<Utc>>)>(&mut conn)
                .await?;

            let user_permission = {
                let pg_pool = pg_pool.clone();
                let user_id = user.id.clone();
                let asset_id = asset_id.clone();
                tokio::spawn(async move {
                    get_user_dashboard_permission(&pg_pool, &user_id, &asset_id).await
                })
            };

            let user_permission = user_permission
                .await
                .map_err(|_| anyhow!("Failed to join task"))? // Changed to discard error details
                .unwrap_or(None); // Use None for both error and no permission cases

            (dashboard_info, user_permission)
        }
        AssetType::Thread => {
            let mut conn = pg_pool.get().await?;

            let thread_info = threads_deprecated::table
                .select((
                    threads_deprecated::id,
                    threads_deprecated::publicly_accessible,
                    threads_deprecated::password_secret_id.is_not_null(),
                    threads_deprecated::public_expiry_date,
                ))
                .filter(threads_deprecated::id.eq(&asset_id))
                .filter(threads_deprecated::deleted_at.is_null())
                .first::<(Uuid, bool, bool, Option<DateTime<Utc>>)>(&mut conn)
                .await?;

            let user_permission = {
                let pg_pool = pg_pool.clone();
                let user_id = user.id.clone();
                let asset_id = asset_id.clone();
                tokio::spawn(async move {
                    get_user_thread_permission(&pg_pool, &user_id, &asset_id).await
                })
            };

            let user_permission = user_permission
                .await
                .map_err(|_| anyhow!("Failed to join task"))? // Changed to discard error details
                .unwrap_or(None); // Use None for both error and no permission cases

            (thread_info, user_permission)
        }
        AssetType::MetricFile => {
            let mut conn = pg_pool.get().await?;

            let metric_info = metric_files::table
                .select((
                    metric_files::id,
                    metric_files::publicly_accessible,
                    metric_files::public_expiry_date,
                ))
                .filter(metric_files::id.eq(&asset_id))
                .filter(metric_files::deleted_at.is_null())
                .first::<(Uuid, bool, Option<DateTime<Utc>>)>(&mut conn)
                .await?;

            let metric_info = (metric_info.0, metric_info.1, false, metric_info.2);

            (metric_info, Some(AssetPermissionRole::Owner))
        }
        AssetType::DashboardFile => {
            let mut conn = pg_pool.get().await?;

            let dashboard_info = dashboard_files::table
                .select((
                    dashboard_files::id,
                    dashboard_files::publicly_accessible,
                    dashboard_files::public_expiry_date,
                ))
                .filter(dashboard_files::id.eq(&asset_id))
                .filter(dashboard_files::deleted_at.is_null())
                .first::<(Uuid, bool, Option<DateTime<Utc>>)>(&mut conn)
                .await?;

            let dashboard_info = (dashboard_info.0, dashboard_info.1, false, dashboard_info.2);

            (dashboard_info, Some(AssetPermissionRole::Owner))
        }
        _ => {
            return Err(anyhow!("Public access is not supported for chats yet"));
        }
    };

    let (id, public, password_required, public_expiry_date) = asset_info;

    if let Some(expiry_date) = public_expiry_date {
        if expiry_date < chrono::Local::now() {
            return Err(anyhow!("Asset expired"));
        }
    }

    let has_access = user_permission.is_some();

    let asset_record = AssetRecord {
        id,
        public,
        password_required,
        has_access,
    };

    Ok(asset_record)
}

pub async fn get_user_dashboard_permission(
    pg_pool: &PgPool,
    user_id: &Uuid,
    dashboard_id: &Uuid,
) -> anyhow::Result<Option<AssetPermissionRole>> {
    let mut conn = match pg_pool.get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let permissions = match asset_permissions::table
        .left_join(
            teams_to_users::table.on(asset_permissions::identity_id.eq(teams_to_users::team_id)),
        )
        .select(asset_permissions::role)
        .filter(
            asset_permissions::identity_id
                .eq(&user_id)
                .or(teams_to_users::user_id.eq(&user_id)),
        )
        .filter(asset_permissions::asset_id.eq(&dashboard_id))
        .filter(asset_permissions::deleted_at.is_null())
        .load::<AssetPermissionRole>(&mut conn)
        .await
    {
        Ok(permissions) => permissions,
        Err(diesel::result::Error::NotFound) => return Ok(None),
        Err(e) => {
            tracing::error!("Error querying dashboard by ID: {}", e);
            return Err(anyhow!("Error querying dashboard by ID: {}", e));
        }
    };

    if permissions.is_empty() {
        return Ok(None);
    }

    let permission = permissions
        .into_iter()
        .max_by_key(|role| match role {
            AssetPermissionRole::Owner => 3,
            AssetPermissionRole::CanView => 2,
            AssetPermissionRole::FullAccess => 1,
            AssetPermissionRole::CanEdit => 0,
            AssetPermissionRole::CanFilter => 0,
        })
        .ok_or_else(|| anyhow!("No dashboard found with permissions"))?;

    Ok(Some(permission))
}

pub async fn get_user_thread_permission(
    pg_pool: &PgPool,
    user_id: &Uuid,
    thread_id: &Uuid,
) -> anyhow::Result<Option<AssetPermissionRole>> {
    let pg_pool = Arc::new(pg_pool.clone());
    let user_id = Arc::new(user_id.clone());
    let thread_id = Arc::new(thread_id.clone());

    let is_organization_admin_handle = {
        let pool = Arc::clone(&pg_pool);
        let user_id = Arc::clone(&user_id);
        tokio::spawn(async move { is_organization_admin_or_owner(pool, user_id).await })
    };

    let user_asset_role_handle = {
        let pool = Arc::clone(&pg_pool);
        let user_id = Arc::clone(&user_id);
        let thread_id = Arc::clone(&thread_id);
        tokio::spawn(async move { get_user_asset_role(pool, user_id, thread_id).await })
    };

    let (is_organization_admin, user_asset_role) =
        match tokio::try_join!(is_organization_admin_handle, user_asset_role_handle) {
            Ok((is_organization_admin, user_asset_role)) => {
                (is_organization_admin, user_asset_role)
            }
            Err(e) => {
                tracing::error!("Error getting user organization role: {}", e);
                return Err(anyhow!("Error getting user organization role: {}", e));
            }
        };

    let permissions = match user_asset_role {
        Ok(permissions) => permissions,
        Err(e) => {
            tracing::error!("Error getting user asset role: {}", e);
            return Err(anyhow!("Error getting user asset role: {}", e));
        }
    };

    let is_organization_admin = match is_organization_admin {
        Ok(is_admin) => is_admin,
        Err(e) => {
            tracing::error!("Error getting user organization role: {}", e);
            return Err(anyhow!("Error getting user organization role: {}", e));
        }
    };

    if is_organization_admin {
        return Ok(Some(AssetPermissionRole::Owner));
    }

    if let Some(permissions) = permissions {
        if permissions.is_empty() {
            return Ok(None);
        }

        let permission = permissions
            .into_iter()
            .max_by_key(|role| match role {
                AssetPermissionRole::Owner => 3,
                AssetPermissionRole::CanEdit => 2,
                AssetPermissionRole::CanView => 1,
                _ => 0,
            })
            .ok_or_else(|| anyhow!("No thread found with permissions"))?;

        Ok(Some(permission))
    } else {
        Ok(None)
    }
}

async fn get_user_asset_role(
    pg_pool: Arc<PgPool>,
    user_id: Arc<Uuid>,
    thread_id: Arc<Uuid>,
) -> anyhow::Result<Option<Vec<AssetPermissionRole>>> {
    let mut conn = match pg_pool.get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let permissions = match asset_permissions::table
        .left_join(
            teams_to_users::table.on(asset_permissions::identity_id.eq(teams_to_users::team_id)),
        )
        .left_join(
            threads_to_dashboards::table.on(asset_permissions::asset_id
                .eq(threads_to_dashboards::dashboard_id)
                .and(threads_to_dashboards::deleted_at.is_null())
                .and(threads_to_dashboards::thread_id.eq(*thread_id))),
        )
        .left_join(
            collections_to_assets::table.on(asset_permissions::asset_id
                .eq(collections_to_assets::collection_id)
                .and(collections_to_assets::deleted_at.is_null())
                .and(collections_to_assets::asset_id.eq(*thread_id))),
        )
        .select(asset_permissions::role)
        .filter(asset_permissions::deleted_at.is_null())
        .filter(
            asset_permissions::identity_id
                .eq(user_id.as_ref())
                .or(teams_to_users::user_id.eq(user_id.as_ref())),
        )
        .filter(
            asset_permissions::asset_id
                .eq(thread_id.as_ref())
                .or(threads_to_dashboards::thread_id.is_not_null())
                .or(collections_to_assets::collection_id.is_not_null()),
        )
        .load::<AssetPermissionRole>(&mut conn)
        .await
    {
        Ok(permissions) => Some(permissions),
        Err(diesel::result::Error::NotFound) => return Ok(None),
        Err(e) => {
            tracing::error!("Error querying thread by ID: {}", e);
            return Err(anyhow!("Error querying thread by ID: {}", e));
        }
    };

    Ok(permissions)
}

async fn is_organization_admin_or_owner(
    pg_pool: Arc<PgPool>,
    user_id: Arc<Uuid>,
) -> anyhow::Result<bool> {
    let user_organization_id = match get_user_organization_id(&user_id).await {
        Ok(Some(organization_id)) => organization_id,
        Ok(None) => {
            return Err(anyhow::anyhow!("User does not belong to any organization"));
        }
        Err(e) => {
            tracing::error!("Error getting user organization id: {}", e);
            return Ok(false);
        }
    };

    let mut conn = match pg_pool.get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    // TODO: This is a temporary solution to check if the user is an admin or owner of the organization
    let is_organization_admin = match users_to_organizations::table
        .select(users_to_organizations::role)
        .filter(users_to_organizations::organization_id.eq(&user_organization_id))
        .first::<UserOrganizationRole>(&mut conn)
        .await
    {
        Ok(role) => role,
        Err(diesel::result::Error::NotFound) => return Ok(false),
        Err(e) => {
            tracing::error!("Error getting user organization role: {}", e);
            return Ok(false);
        }
    };

    let is_organization_adminig = if is_organization_admin == UserOrganizationRole::WorkspaceAdmin
        || is_organization_admin == UserOrganizationRole::DataAdmin
    {
        true
    } else {
        false
    };

    Ok(is_organization_adminig)
}
