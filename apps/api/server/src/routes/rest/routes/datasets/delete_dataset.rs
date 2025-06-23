use anyhow::{anyhow, Result};
use axum::{extract::Path, http::StatusCode, Extension};
use chrono::Utc;
use diesel::{update, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde_json::Value;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use database::{pool::get_pg_pool, schema::datasets};

pub async fn delete_dataset(
    Extension(user): Extension<AuthenticatedUser>,
    Path(dataset_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    match delete_dataset_handler(&user, dataset_id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => {
            tracing::error!("Error deleting dataset: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

async fn delete_dataset_handler(user: &AuthenticatedUser, dataset_id: Uuid) -> Result<()> {
    let mut conn = get_pg_pool()
        .get()
        .await
        .map_err(|e| anyhow!("Unable to get connection from pool: {}", e))?;

    // Get dataset's organization_id
    let dataset = datasets::table
        .select(datasets::organization_id)
        .filter(datasets::id.eq(dataset_id))
        .filter(datasets::deleted_at.is_null())
        .first::<Uuid>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => anyhow!("Dataset not found"),
            _ => anyhow!("Error getting dataset: {}", e),
        })?;

    // Check user's organization and role
    let user_org_id = user
        .attributes
        .get("organization_id")
        .and_then(|v| match v {
            Value::String(s) => Some(s.as_str()),
            _ => None,
        })
        .ok_or_else(|| anyhow!("User organization id not found"))?;

    let user_org_id =
        Uuid::parse_str(user_org_id).map_err(|_| anyhow!("Invalid organization id format"))?;

    if user_org_id != dataset {
        return Err(anyhow!("User does not belong to dataset's organization"));
    }

    let user_role = user
        .attributes
        .get("organization_role")
        .and_then(|v| match v {
            Value::String(s) => Some(s.as_str()),
            _ => None,
        })
        .ok_or_else(|| anyhow!("User role not found"))?;

    if !["workspace_admin", "data_admin"].contains(&user_role) {
        return Err(anyhow!("User does not have required permissions"));
    }

    // Soft delete the dataset
    update(datasets::table)
        .filter(datasets::id.eq(dataset_id))
        .set(datasets::deleted_at.eq(Some(Utc::now())))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Error updating dataset: {}", e))?;

    Ok(())
}
