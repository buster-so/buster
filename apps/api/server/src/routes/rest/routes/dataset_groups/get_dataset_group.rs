use anyhow::Result;
use axum::{extract::Path, http::StatusCode, Extension};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use super::list_dataset_groups::DatasetGroupInfo;
use crate::routes::rest::ApiResponse;
use database::models::DatasetGroup;
use database::pool::get_pg_pool;
use database::schema::dataset_groups;
use middleware::AuthenticatedUser;

pub async fn get_dataset_group(
    Extension(user): Extension<AuthenticatedUser>,
    Path(dataset_group_id): Path<Uuid>,
) -> Result<ApiResponse<DatasetGroupInfo>, (StatusCode, &'static str)> {
    let organization_id = match user.organizations.get(0) {
        Some(organization) => organization.id,
        _ => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting organization id",
            ));
        }
    };

    match get_dataset_group_handler(dataset_group_id, organization_id).await {
        Ok(group) => Ok(ApiResponse::JsonData(group)),
        Err(e) => {
            tracing::error!("Error getting dataset group: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting dataset group",
            ));
        }
    }
}

async fn get_dataset_group_handler(
    dataset_group_id: Uuid,
    organization_id: Uuid,
) -> Result<DatasetGroupInfo> {
    let mut conn = get_pg_pool().get().await?;

    let dataset_group = dataset_groups::table
        .filter(dataset_groups::id.eq(dataset_group_id))
        .filter(dataset_groups::organization_id.eq(organization_id))
        .filter(dataset_groups::deleted_at.is_null())
        .first::<DatasetGroup>(&mut *conn)
        .await
        .map_err(|_| anyhow::anyhow!("Dataset group not found"))?;

    Ok(DatasetGroupInfo {
        id: dataset_group.id,
        name: dataset_group.name,
        created_at: dataset_group.created_at,
        updated_at: dataset_group.updated_at,
    })
}
