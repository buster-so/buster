use std::sync::Arc;

use anyhow::{anyhow, Result};
use async_compression::tokio::write::GzipEncoder;
use diesel::{ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use redis::{streams::StreamMaxlen, AsyncCommands};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::io::AsyncWriteExt;
use uuid::Uuid;

use database::{
    enums::{TeamToUserRole, UserOrganizationRole},
    pool::{get_pg_pool, get_redis_pool},
    models::{Organization, Team, User},
    schema::{organizations, teams, teams_to_users, users, users_to_organizations},
};

use super::{
    ws::{SubscriptionRwLock, WsError, WsErrorCode, WsEvent, WsResponseMessage, WsSendMethod},
    ws_router::WsRoutes,
};

/// Send a message to a subscription with Redis
///
/// Args:
///     - redis_client: The redis client
///     - subscription: The subscription to send the message to
///     - message: Message in format of WsResponseMessage

pub async fn send_ws_message(subscription: &String, message: &WsResponseMessage) -> Result<()> {
    let mut redis_conn = match get_redis_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting redis connection in send: {}", e);
            return Err(anyhow!("Error getting redis connection: {}", e));
        }
    };

    let message_string = serde_json::to_string(&message).unwrap();

    let mut compressed = Vec::new();

    let mut encoder = GzipEncoder::new(&mut compressed);

    match encoder.write_all(message_string.as_bytes()).await {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error writing to encoder: {}", e)),
    };

    match encoder.shutdown().await {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error finishing compression: {}", e)),
    };

    let stream_maxlen = StreamMaxlen::Approx(50);

    match redis_conn
        .xadd_maxlen::<&String, &str, &'static str, &[u8], redis::Value>(
            &subscription,
            stream_maxlen,
            "*",
            &[("data", &compressed)],
        )
        .await
    {
        Ok(_) => {}
        Err(e) => {
            let error = anyhow!(
                "Error while user sending join message to thread pubsub: {}",
                e
            );
            tracing::error!("Error subscribing to pubsub: {}", e);
            return Err(error);
        }
    };

    Ok(())
}

pub async fn subscribe_to_stream(
    subscriptions: &SubscriptionRwLock,
    new_subscription: &String,
    user_group: &String,
    user_id: &Uuid,
) -> Result<()> {
    let mut redis_conn = match get_redis_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting redis connection in subscribe: {}", e);
            return Err(anyhow!("Error getting redis connection: {}", e));
        }
    };

    match redis_conn
        .xgroup_create_mkstream::<&String, &String, &'static str, redis::Value>(
            new_subscription,
            user_group,
            "$",
        )
        .await
    {
        Ok(_) => subscriptions.write(new_subscription.clone()).await,
        Err(_) => {
            tracing::info!("Stream already subscribed to");
        }
    };

    let stream_maxlen = StreamMaxlen::Approx(50);

    match redis_conn
        .xadd_maxlen::<&String, &str, &'static str, &String, redis::Value>(
            &user_id.to_string(),
            stream_maxlen,
            "*",
            &[("new_subscription", &new_subscription)],
        )
        .await
    {
        Ok(_) => {}
        Err(e) => {
            let error = anyhow!(
                "Error while user sending join message to thread pubsub: {}",
                e
            );
            tracing::error!("Error subscribing to pubsub: {}", e);
            return Err(error);
        }
    };

    tracing::debug!("Subscribed to stream: {}", new_subscription);

    Ok(())
}

pub async fn unsubscribe_from_stream(
    subscriptions: &Arc<SubscriptionRwLock>,
    subscription: &String,
    user_group: &String,
    user_id: &Uuid,
) -> Result<()> {
    subscriptions.remove(subscription.clone()).await;

    let mut redis_conn = match get_redis_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting redis connection in unsubscribe: {}", e);
            return Err(anyhow!("Error getting redis connection: {}", e));
        }
    };

    let stream_maxlen = StreamMaxlen::Approx(50);

    match redis_conn
        .xadd_maxlen::<&String, &str, &'static str, &String, redis::Value>(
            &user_id.to_string(),
            stream_maxlen,
            "*",
            &[("removed_subscription", &subscription)],
        )
        .await
    {
        Ok(_) => {}
        Err(e) => {
            let error = anyhow!(
                "Error while user sending join message to thread pubsub: {}",
                e
            );
            tracing::error!("Error subscribing to pubsub: {}", e);
            return Err(error);
        }
    };

    // Attempt to destroy the specific group
    match redis_conn
        .xgroup_destroy::<&String, &String, redis::Value>(subscription, user_group)
        .await
    {
        Ok(_) => {
            tracing::info!("Successfully destroyed group: {}", user_group);
        }
        Err(e) => {
            tracing::error!("Error unsubscribing from stream: {}", e);
            return Err(anyhow!("Error unsubscribing from stream: {}", e));
        }
    };

    // Check remaining groups
    let groups = match redis_conn
        .xinfo_groups::<&String, redis::Value>(subscription)
        .await
    {
        Ok(groups) => groups,
        Err(e) => {
            tracing::error!("Error getting groups: {}", e);
            return Err(anyhow!("Error getting groups: {}", e));
        }
    };

    // If no groups remain, delete the keys
    if let redis::Value::Array(group_info_list) = groups {
        if group_info_list.is_empty() {
            // Check if key exists first
            let exists: bool = redis_conn
                .exists(subscription.clone())
                .await
                .unwrap_or(false);
            tracing::debug!("Key {} exists before deletion: {}", subscription, exists);

            // First, delete all messages from the stream
            match redis_conn
                .xtrim::<String, i64>(subscription.clone(), StreamMaxlen::Equals(0))
                .await
            {
                Ok(response) => {
                    tracing::info!("Trimmed stream {}: {:?}", subscription, response);
                }
                Err(e) => {
                    tracing::error!("Error trimming stream: {} ({:?})", e, e);
                }
            }

            // Then delete the key
            match redis_conn
                .del::<String, redis::Value>(subscription.clone())
                .await
            {
                Ok(_) => (),
                Err(e) => {
                    tracing::error!("Error deleting subscription key: {} ({:?})", e, e);
                }
            }

            // Similar checks for draft key
            let draft_subscription = format!("draft:{}", subscription);

            // Delete the draft subscription key
            match redis_conn
                .del::<String, redis::Value>(draft_subscription.clone())
                .await
            {
                Ok(_) => {}
                Err(e) => {
                    tracing::warn!("Error deleting draft subscription key: {}", e);
                }
            }
        }
    }

    Ok(())
}

pub async fn set_key_value(key: &String, value: &String) -> Result<()> {
    let mut redis_conn = match get_redis_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting redis connection in set: {}", e);
            return Err(anyhow!("Error getting redis connection: {}", e));
        }
    };

    match redis_conn.set::<&String, &String, bool>(key, value).await {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error setting key value: {}", e)),
    }

    match redis_conn.expire::<&String, bool>(key, 3600).await {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error setting key expiration: {}", e)),
    }

    Ok(())
}

#[allow(dead_code)]
pub async fn delete_key_value(key: String) -> Result<()> {
    let mut redis_conn = match get_redis_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting redis connection in delete: {}", e);
            return Err(anyhow!("Error getting redis connection: {}", e));
        }
    };

    match redis_conn.del::<String, bool>(key).await {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error deleting key: {}", e)),
    }

    Ok(())
}

pub async fn get_key_value(key: &String) -> Result<Option<String>> {
    let mut redis_conn = match get_redis_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting redis connection in get: {}", e);
            return Err(anyhow!("Error getting redis connection: {}", e));
        }
    };

    let value: Option<String> = match redis_conn.get(key).await {
        Ok(Some(value)) => Some(value),
        Ok(None) => None,
        Err(e) => return Err(anyhow!("Error getting key value: {}", e)),
    };

    Ok(value)
}

pub async fn send_error_message(
    subscription: &String,
    route: WsRoutes,
    event: WsEvent,
    code: WsErrorCode,
    message: String,
    user: &AuthenticatedUser,
) -> Result<()> {
    let error = WsError {
        code,
        message: message.to_string(),
    };

    let error_ws_response = WsResponseMessage::new(
        route,
        event,
        Value::Null,
        Some(error),
        user,
        WsSendMethod::SenderOnly,
    );

    match send_ws_message(&subscription, &error_ws_response).await {
        Ok(_) => (),
        Err(e) => return Err(e),
    }

    Ok(())
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserOrganization {
    #[serde(flatten)]
    pub organization: Organization,
    pub role: UserOrganizationRole,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserTeam {
    #[serde(flatten)]
    pub team: Team,
    pub role: TeamToUserRole,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserInfoObject {
    pub user: User,
    pub organizations: Vec<UserOrganization>,
    pub teams: Vec<UserTeam>,
}

pub async fn get_user_information(user_id: &Uuid) -> Result<UserInfoObject> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(_e) => {
            return Err(anyhow::anyhow!("Error getting postgres connection"));
        }
    };

    let user_org_teams = match users::table
        .left_join(users_to_organizations::table.on(users::id.eq(users_to_organizations::user_id)))
        .left_join(teams_to_users::table.on(users::id.eq(teams_to_users::user_id)))
        .left_join(teams::table.on(teams_to_users::team_id.eq(teams::id)))
        .left_join(
            organizations::table.on(users_to_organizations::organization_id.eq(organizations::id)),
        )
        .select((
            (
                users::id,
                users::email,
                users::name,
                users::config,
                users::created_at,
                users::updated_at,
                users::attributes,
                users::avatar_url,
            ),
            (
                teams::id,
                teams::name,
                teams::organization_id,
                teams::sharing_setting,
                teams::edit_sql,
                teams::upload_csv,
                teams::export_assets,
                teams::email_slack_enabled,
                teams::created_by,
                teams::created_at,
                teams::updated_at,
                teams::deleted_at,
            )
                .nullable(),
            (
                organizations::id,
                organizations::name,
                organizations::domain,
                organizations::created_at,
                organizations::updated_at,
                organizations::deleted_at,
                organizations::payment_required,
            )
                .nullable(),
            users_to_organizations::role.nullable(),
            teams_to_users::role.nullable(),
        ))
        .filter(users::id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .filter(teams::deleted_at.is_null())
        .filter(organizations::deleted_at.is_null())
        .filter(teams_to_users::deleted_at.is_null())
        .load::<(
            User,
            Option<Team>,
            Option<Organization>,
            Option<UserOrganizationRole>,
            Option<TeamToUserRole>,
        )>(&mut conn)
        .await
    {
        Ok(user_org_teams) => user_org_teams,
        Err(_e) => {
            return Err(anyhow::anyhow!("Error getting user information"));
        }
    };

    let user = match user_org_teams.iter().next() {
        Some((user, _, _, _, _)) => user.clone(),
        None => return Err(anyhow::anyhow!("User not found")),
    };

    let teams: Vec<UserTeam> = user_org_teams
        .iter()
        .filter_map(|(_, team, _, _, role)| {
            if let (Some(team), Some(role)) = (team, role) {
                Some(UserTeam {
                    team: team.clone(),
                    role: role.clone(),
                })
            } else {
                None
            }
        })
        .collect::<Vec<UserTeam>>();

    let organizations: Vec<UserOrganization> = user_org_teams
        .iter()
        .filter_map(|(_, _, organization, role, _)| {
            if let (Some(organization), Some(role)) = (organization, role) {
                Some(UserOrganization {
                    organization: organization.clone(),
                    role: role.clone(),
                })
            } else {
                None
            }
        })
        .collect::<Vec<UserOrganization>>();

    Ok(UserInfoObject {
        user,
        teams,
        organizations,
    })
}
