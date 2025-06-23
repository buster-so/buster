use anyhow::Result;
use axum::{http::StatusCode, Extension, Json};
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Deserialize;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::schema::dataset_groups;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Deserialize, Clone)]
pub struct DatasetGroupUpdate {
    pub id: Uuid,
    pub name: String,
}

pub async fn put_dataset_group(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<Vec<DatasetGroupUpdate>>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    // Check if user is workspace admin or data admin
    let organization_id = match get_user_organization_id(&user.id).await {
        Ok(Some(organization_id)) => organization_id,
        Ok(None) => return Err((StatusCode::FORBIDDEN, "User does not belong to any organization")),
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error getting user organization id"));
        }
    };

    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => return Err((StatusCode::FORBIDDEN, "Insufficient permissions")),
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error checking user permissions",
            ));
        }
    }

    match put_dataset_group_handler(request).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error updating dataset groups: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error updating dataset groups",
            ))
        }
    }
}

async fn put_dataset_group_handler(request: Vec<DatasetGroupUpdate>) -> Result<()> {
    let now = Utc::now();

    // Process in chunks of 25
    let mut handles = vec![];
    for chunk in request.chunks(25) {
        let updates = chunk.to_vec();
        let timestamp = now;

        let handle = tokio::spawn(async move {
            let mut conn = get_pg_pool().get().await?;

            for update in updates {
                diesel::update(dataset_groups::table)
                    .filter(dataset_groups::id.eq(update.id))
                    .filter(dataset_groups::deleted_at.is_null())
                    .set((
                        dataset_groups::name.eq(update.name),
                        dataset_groups::updated_at.eq(timestamp),
                    ))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        });
        handles.push(handle);
    }

    // Wait for all tasks to complete
    for handle in handles {
        handle.await??;
    }

    Ok(())
} 