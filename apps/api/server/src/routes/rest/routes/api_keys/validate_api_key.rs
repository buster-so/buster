use anyhow::Result;
use axum::http::StatusCode;
use axum::Json;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::schema::api_keys;
use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct ValidateApiKeyRequest {
    pub api_key: String,
}

#[derive(Debug, Serialize)]
pub struct ValidateApiKeyResponse {
    pub valid: bool,
}

pub async fn validate_api_key(
    Json(request): Json<ValidateApiKeyRequest>,
) -> Result<ApiResponse<ValidateApiKeyResponse>, (StatusCode, &'static str)> {
    let valid = match validate_api_key_handler(request.api_key).await {
        Ok(api_key) => api_key,
        Err(e) => {
            tracing::error!("Error creating API key: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error creating API key"));
        }
    };

    Ok(ApiResponse::JsonData(ValidateApiKeyResponse { valid }))
}

async fn validate_api_key_handler(api_key: String) -> Result<bool> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting database connection: {:?}", e);
            return Err(anyhow::anyhow!("Error getting database connection"));
        }
    };

    let api_key_exists = match api_keys::table
        .filter(api_keys::key.eq(api_key))
        .filter(api_keys::deleted_at.is_null())
        .select(api_keys::id)
        .first::<Uuid>(&mut *conn)
        .await
    {
        Ok(_) => true,
        Err(diesel::NotFound) => false,
        Err(e) => {
            tracing::error!("Error getting API key: {:?}", e);
            return Err(anyhow::anyhow!("Error getting API key"));
        }
    };

    Ok(api_key_exists)
}
