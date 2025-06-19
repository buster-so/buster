use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::models::DatasetGroup;
use database::schema::dataset_groups;
use crate::routes::rest::ApiResponse;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize)]
pub struct DatasetGroupInfo {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_dataset_groups(
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<ApiResponse<Vec<DatasetGroupInfo>>, (StatusCode, &'static str)> {
    let dataset_groups = match list_dataset_groups_handler(user).await {
        Ok(groups) => groups,
        Err(e) => {
            tracing::error!("Error listing dataset groups: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing dataset groups",
            ));
        }
    };

    Ok(ApiResponse::JsonData(dataset_groups))
}

async fn list_dataset_groups_handler(user: AuthenticatedUser) -> Result<Vec<DatasetGroupInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    let dataset_groups = dataset_groups::table
        .filter(dataset_groups::deleted_at.is_null())
        .filter(dataset_groups::organization_id.eq(organization_id))
        .order_by(dataset_groups::created_at.desc())
        .load::<DatasetGroup>(&mut *conn)
        .await?;

    Ok(dataset_groups
        .into_iter()
        .map(|group| DatasetGroupInfo {
            id: group.id,
            name: group.name.to_string(),
            created_at: group.created_at,
            updated_at: group.updated_at,
        })
        .collect())
}
