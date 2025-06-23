use anyhow::Result;
use axum::{
    extract::Path,
    http::StatusCode,
    Extension,
};
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::schema::api_keys;
use crate::routes::rest::ApiResponse;
use middleware::AuthenticatedUser;

pub async fn delete_api_key(
    Extension(user): Extension<AuthenticatedUser>,
    Path(api_key_id): Path<Uuid>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match delete_api_key_handler(user, api_key_id).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error deleting API key: {:?}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Error deleting API key"))
        }
    }
}

async fn delete_api_key_handler(user: AuthenticatedUser, api_key_id: Uuid) -> Result<()> {
    let mut conn = get_pg_pool()
        .get()
        .await
        .map_err(|e| anyhow::anyhow!("Error getting database connection: {}", e))?;

    let rows_affected = diesel::update(
        api_keys::table
            .filter(api_keys::id.eq(api_key_id))
            .filter(api_keys::owner_id.eq(user.id))
            .filter(api_keys::deleted_at.is_null()),
    )
    .set(api_keys::deleted_at.eq(Some(Utc::now())))
    .execute(&mut *conn)
    .await
    .map_err(|e| anyhow::anyhow!("Error deleting API key: {}", e))?;

    if rows_affected == 0 {
        return Err(anyhow::anyhow!("API key not found"));
    }

    Ok(())
} 