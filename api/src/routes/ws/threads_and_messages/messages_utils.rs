use std::sync::Arc;

use crate::database::{
    enums::{AssetPermissionRole, UserOrganizationRole},
    lib::get_pg_pool,
    models::Message,
    schema::{
        asset_permissions, data_sources, datasets, messages, teams_to_users, threads,
        users_to_organizations,
    },
};
use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::{
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl,
};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Deserialize, Serialize)]
pub struct MessageDraftState {
    pub draft_session_id: Uuid,
    pub title: Option<String>,
    pub chart_config: Option<Value>,
    pub code: Option<String>,
    pub deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_message_with_permission(
    message_id: &Uuid,
    user_id: &Uuid,
) -> Result<(Message, AssetPermissionRole)> {
    let message_id = Arc::new(message_id.clone());
    let user_id = Arc::new(user_id.clone());

    let message_handler = {
        let id = Arc::clone(&message_id);
        tokio::spawn(async move { get_message_by_id(id).await })
    };

    let permission_handler = {
        let user_id = Arc::clone(&user_id);
        let message_id = Arc::clone(&message_id);
        tokio::spawn(async move { get_user_thread_permission(user_id, message_id).await })
    };

    let is_public_thread_handler = {
        let message_id = Arc::clone(&message_id);
        tokio::spawn(async move { check_public_thread(message_id).await })
    };

    let (message_result, permission_result, is_public_thread_result) = match tokio::try_join!(
        message_handler,
        permission_handler,
        is_public_thread_handler
    ) {
        Ok((message, permission, is_public_thread)) => (message, permission, is_public_thread),
        Err(e) => return Err(anyhow!("Error getting message or permission: {}", e)),
    };

    let message = match message_result {
        Ok(message) => message,
        Err(e) => return Err(anyhow!("Error getting message: {}", e)),
    };

    let permission = match permission_result {
        Ok(permission) => match permission {
            Some(permission) => Some(permission),
            None => None,
        },
        Err(e) => {
            tracing::error!("Unable to insert thread into database: {:?}", e);
            return Err(anyhow!("Unable to insert thread into database: {:?}", e));
        }
    };

    let is_public_thread = match is_public_thread_result {
        Ok(is_public) => is_public,
        Err(e) => {
            tracing::error!("Error checking public thread: {}", e);
            return Err(anyhow!("Error checking public thread: {}", e));
        }
    };

    let final_permission = if permission.is_some() {
        permission.unwrap()
    } else if !is_public_thread {
        return Err(anyhow!("No message found with permissions"));
    } else {
        AssetPermissionRole::Viewer
    };

    Ok((message, final_permission))
}

async fn get_message_by_id(message_id: Arc<Uuid>) -> Result<Message> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let message = match messages::table
        .filter(messages::id.eq(message_id.as_ref()))
        .filter(messages::deleted_at.is_null())
        .select(messages::all_columns)
        .first::<Message>(&mut conn)
        .await
    {
        Ok(threads) => threads,
        Err(diesel::result::Error::NotFound) => {
            return Err(anyhow!("thread not found"));
        }
        Err(e) => {
            return Err(anyhow!("Error querying thread by ID: {}", e));
        }
    };

    Ok(message)
}

pub async fn check_public_thread(message_id: Arc<Uuid>) -> Result<bool> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    match threads::table
        .inner_join(
            messages::table.on(threads::id.eq(messages::thread_id).and(
                messages::id.eq(message_id.as_ref()).and(
                    messages::deleted_at
                        .is_null()
                        .and(messages::draft_session_id.is_null()),
                ),
            )),
        )
        .select((threads::publicly_accessible, threads::public_expiry_date))
        .filter(threads::deleted_at.is_null())
        .first::<(bool, Option<DateTime<Utc>>)>(&mut conn)
        .await
    {
        Ok((is_public, expiry_date)) => {
            if is_public {
                return Ok(true);
            }

            if expiry_date.is_some() && expiry_date.unwrap() < Utc::now() {
                return Ok(false);
            }

            return Ok(false);
        }
        Err(diesel::result::Error::NotFound) => return Ok(false),
        Err(e) => return Err(anyhow!("Error querying thread by ID: {}", e)),
    }
}

pub async fn get_user_thread_permission(
    user_id: Arc<Uuid>,
    message_id: Arc<Uuid>,
) -> Result<Option<AssetPermissionRole>> {
    let is_organization_admin_handle = {
        let user_id = Arc::clone(&user_id);
        let message_id = Arc::clone(&message_id);
        tokio::spawn(async move { is_organization_admin_or_owner(user_id, message_id).await })
    };

    let user_asset_role_handle = {
        let user_id = Arc::clone(&user_id);
        let message_id = Arc::clone(&message_id);
        tokio::spawn(async move { get_user_asset_role(user_id, message_id).await })
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
                AssetPermissionRole::Editor => 2,
                AssetPermissionRole::Viewer => 1,
            })
            .ok_or_else(|| anyhow!("No thread found with permissions"))?;

        Ok(Some(permission))
    } else {
        Ok(None)
    }
}

async fn get_user_asset_role(
    user_id: Arc<Uuid>,
    message_id: Arc<Uuid>,
) -> Result<Option<Vec<AssetPermissionRole>>> {
    let mut conn = match get_pg_pool().get().await {
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
        .inner_join(messages::table.on(asset_permissions::asset_id.eq(messages::thread_id)))
        .select(asset_permissions::role)
        .filter(
            asset_permissions::identity_id
                .eq(user_id.as_ref())
                .or(teams_to_users::user_id.eq(user_id.as_ref())),
        )
        .filter(messages::id.eq(message_id.as_ref()))
        .filter(asset_permissions::deleted_at.is_null())
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

async fn is_organization_admin_or_owner(user_id: Arc<Uuid>, message_id: Arc<Uuid>) -> Result<bool> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let is_organization_admin = match users_to_organizations::table
        .inner_join(
            data_sources::table
                .on(users_to_organizations::organization_id.eq(data_sources::organization_id)),
        )
        .inner_join(datasets::table.on(data_sources::id.eq(datasets::data_source_id)))
        .inner_join(messages::table.on(datasets::id.nullable().eq(messages::dataset_id)))
        .select(users_to_organizations::role)
        .filter(messages::id.eq(message_id.as_ref()))
        .filter(users_to_organizations::user_id.eq(user_id.as_ref()))
        .first::<UserOrganizationRole>(&mut conn)
        .await
    {
        Ok(role) => role,
        Err(e) => {
            tracing::error!("Error getting user organization role: {}", e);
            return Err(anyhow!("Error getting user organization role: {}", e));
        }
    };

    let is_organization_adminig = if is_organization_admin == UserOrganizationRole::Admin
        || is_organization_admin == UserOrganizationRole::Owner
    {
        true
    } else {
        false
    };

    Ok(is_organization_adminig)
}
