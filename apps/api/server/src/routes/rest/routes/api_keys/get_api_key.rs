use anyhow::Result;
use axum::{
    extract::Path,
    http::StatusCode,
    Extension,
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::models::ApiKey;
use database::schema::api_keys;
use database::schema::users;
use crate::routes::rest::ApiResponse;
use super::list_api_keys::ApiKeyInfo;
use middleware::AuthenticatedUser;

pub async fn get_api_key(
    Extension(user): Extension<AuthenticatedUser>,
    Path(api_key_id): Path<Uuid>,
) -> Result<ApiResponse<ApiKeyInfo>, (StatusCode, &'static str)> {
    let api_key = match get_api_key_handler(user, api_key_id).await {
        Ok(key) => key,
        Err(e) => {
            tracing::error!("Error getting API key: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error getting API key"));
        }
    };

    Ok(ApiResponse::JsonData(api_key))
}

async fn get_api_key_handler(user: AuthenticatedUser, api_key_id: Uuid) -> Result<ApiKeyInfo> {
    let mut conn = get_pg_pool().get().await?;

    let (api_key, email): (ApiKey, String) = api_keys::table
        .inner_join(users::table.on(api_keys::owner_id.eq(users::id)))
        .filter(api_keys::id.eq(api_key_id))
        .filter(api_keys::owner_id.eq(user.id))
        .filter(api_keys::deleted_at.is_null())
        .select((api_keys::all_columns, users::email))
        .first(&mut *conn)
        .await
        .map_err(|_| anyhow::anyhow!("API key not found"))?;

    Ok(ApiKeyInfo {
        id: api_key.id,
        owner_id: api_key.owner_id,
        owner_email: email,
        created_at: api_key.created_at,
    })
} 