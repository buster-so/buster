use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::models::ApiKey;
use database::schema::api_keys;
use crate::routes::rest::ApiResponse;
use database::schema::users;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize)]
pub struct ApiKeyInfo {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub owner_email: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ListApiKeysResponse {
    pub api_keys: Vec<ApiKeyInfo>,
}

pub async fn list_api_keys(
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<ApiResponse<ListApiKeysResponse>, (StatusCode, &'static str)> {
    let api_keys = match list_api_keys_handler(user).await {
        Ok(keys) => keys,
        Err(e) => {
            tracing::error!("Error listing API keys: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error listing API keys"));
        }
    };

    Ok(ApiResponse::JsonData(ListApiKeysResponse { api_keys }))
}

async fn list_api_keys_handler(user: AuthenticatedUser) -> Result<Vec<ApiKeyInfo>> {
    let mut conn = get_pg_pool().get().await?;

    let api_keys: Vec<(ApiKey, String)> = api_keys::table
        .inner_join(users::table.on(api_keys::owner_id.eq(users::id)))
        .filter(api_keys::owner_id.eq(user.id))
        .filter(api_keys::deleted_at.is_null())
        .order_by(api_keys::created_at.desc())
        .select((api_keys::all_columns, users::email))
        .load(&mut *conn)
        .await?;

    Ok(api_keys
        .into_iter()
        .map(|(key, email)| ApiKeyInfo {
            id: key.id,
            owner_id: key.owner_id,
            owner_email: email,
            created_at: key.created_at,
        })
        .collect())
} 