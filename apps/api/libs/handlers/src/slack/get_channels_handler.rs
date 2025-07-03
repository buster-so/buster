use anyhow::{anyhow, Result};
use axum::extract::{Extension, Query};
use axum::response::Json;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use tracing::error;
use uuid::Uuid;

use database::{
    pool::get_pg_pool,
    vault::read_secret,
};
use middleware::auth::Auth;
use server_shared::error::AppError;
use sharing::validate_identity_has_permission;

use reqwest::Client;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct GetChannelsQuery {
    pub integration_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct ChannelInfo {
    pub id: String,
    pub name: String,
    pub is_private: bool,
    pub is_member: bool,
    pub num_members: Option<i32>,
    pub topic: Option<String>,
    pub purpose: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct GetChannelsResponse {
    pub channels: Vec<ChannelInfo>,
}

// Slack API response structures
#[derive(Debug, Deserialize)]
struct SlackChannelsResponse {
    ok: bool,
    channels: Vec<SlackChannel>,
    error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SlackChannel {
    id: String,
    name: String,
    is_private: bool,
    is_member: bool,
    num_members: Option<i32>,
    topic: Option<SlackTopicPurpose>,
    purpose: Option<SlackTopicPurpose>,
}

#[derive(Debug, Deserialize)]
struct SlackTopicPurpose {
    value: String,
}

pub async fn get_channels_handler(
    Extension(auth): Extension<Auth>,
    Query(query): Query<GetChannelsQuery>,
) -> Result<Json<GetChannelsResponse>, AppError> {
    let user = auth.user()?;

    // Get a database connection
    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .map_err(|e| AppError::internal_error(anyhow!("Failed to get connection: {}", e)))?;

    // First, check if the integration exists and belongs to the user's organization
    let integration = dsl::slack_integrations
        .filter(slack_integrations::id.eq(&query.integration_id))
        .filter(slack_integrations::deleted_at.is_null())
        .filter(slack_integrations::status.eq("active"))
        .select((
            slack_integrations::id,
            slack_integrations::organization_id,
            slack_integrations::token_vault_key,
        ))
        .first::<(Uuid, Uuid, Option<String>)>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => {
                AppError::not_found("Slack integration not found or not active")
            }
            _ => AppError::internal_error(anyhow!("Failed to fetch integration: {}", e)),
        })?;

    let (integration_id, organization_id, token_vault_key) = integration;

    // Check if user has permission to access this integration
    validate_identity_has_permission(
        &user.id,
        &organization_id,
        "read",
        "slack_integration",
        &integration_id,
        &mut conn,
    )
    .await
    .map_err(|e| {
        AppError::permission_denied(format!(
            "You don't have permission to view this Slack integration: {}",
            e
        ))
    })?;

    // Get the token from vault
    let token_vault_key = token_vault_key
        .ok_or_else(|| AppError::internal_error(anyhow!("No token found for integration")))?;

    // Read the token from vault using the integration ID as the key
    let token = read_secret(&integration_id)
        .await
        .map_err(|e| {
            error!("Failed to read Slack token from vault: {}", e);
            AppError::internal_error(anyhow!("Failed to retrieve Slack token"))
        })?;

    // Parse the token JSON to get the bot token
    let token_data: HashMap<String, serde_json::Value> = serde_json::from_str(&token)
        .map_err(|e| {
            error!("Failed to parse token data: {}", e);
            AppError::internal_error(anyhow!("Invalid token format"))
        })?;

    let bot_token = token_data
        .get("access_token")
        .or_else(|| token_data.get("bot_token"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::internal_error(anyhow!("Bot token not found in credentials")))?;

    // Call Slack API to get channels
    let client = Client::new();
    let response = client
        .get("https://slack.com/api/conversations.list")
        .header("Authorization", format!("Bearer {}", bot_token))
        .query(&[
            ("types", "public_channel"),
            ("exclude_archived", "true"),
            ("limit", "1000"),
        ])
        .send()
        .await
        .map_err(|e| {
            error!("Failed to call Slack API: {}", e);
            AppError::internal_error(anyhow!("Failed to fetch channels from Slack"))
        })?;

    if !response.status().is_success() {
        error!("Slack API returned error status: {}", response.status());
        return Err(AppError::internal_error(anyhow!(
            "Slack API returned error: {}",
            response.status()
        )));
    }

    let slack_response: SlackChannelsResponse = response.json().await.map_err(|e| {
        error!("Failed to parse Slack response: {}", e);
        AppError::internal_error(anyhow!("Failed to parse Slack response"))
    })?;

    if !slack_response.ok {
        let error_msg = slack_response
            .error
            .unwrap_or_else(|| "Unknown error".to_string());
        error!("Slack API returned error: {}", error_msg);
        return Err(AppError::internal_error(anyhow!(
            "Slack API error: {}",
            error_msg
        )));
    }

    // Convert Slack channels to our response format
    let channels: Vec<ChannelInfo> = slack_response
        .channels
        .into_iter()
        .map(|channel| ChannelInfo {
            id: channel.id,
            name: channel.name,
            is_private: channel.is_private,
            is_member: channel.is_member,
            num_members: channel.num_members,
            topic: channel.topic.map(|t| t.value),
            purpose: channel.purpose.map(|p| p.value),
        })
        .collect();

    Ok(Json(GetChannelsResponse { channels }))
}