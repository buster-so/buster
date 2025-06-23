use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::{Extension, Json};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use tokio::spawn;
use uuid::Uuid;

use database::pool::get_pg_pool;
use database::models::DatasetToDatasetGroup;
use database::schema::datasets_to_dataset_groups;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize, Deserialize)]
pub struct DatasetAssignment {
    pub id: Uuid,
    pub assigned: bool,
}

/// Update dataset assignments for a dataset group
/// Accepts a list of dataset assignments to add or remove from the dataset group
pub async fn put_datasets(
    Extension(user): Extension<AuthenticatedUser>,
    Path(dataset_group_id): Path<Uuid>,
    Json(assignments): Json<Vec<DatasetAssignment>>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match put_datasets_handler(user, dataset_group_id, assignments).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error assigning datasets to dataset group: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error assigning datasets to dataset group",
            ));
        }
    }
}

async fn put_datasets_handler(
    user: AuthenticatedUser,
    dataset_group_id: Uuid,
    assignments: Vec<DatasetAssignment>,
) -> Result<()> {
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    if !is_user_workspace_admin_or_data_admin(&user, &organization_id).await? {
        return Err(anyhow::anyhow!(
            "User is not authorized to assign datasets to dataset group"
        ));
    }

    let (to_assign, to_unassign): (Vec<_>, Vec<_>) = assignments.into_iter().partition(|a| a.assigned);

    let assign_handle = {
        let dataset_group_id = dataset_group_id;
        spawn(async move {
            if !to_assign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                let values: Vec<_> = to_assign
                    .into_iter()
                    .map(|dataset| DatasetToDatasetGroup {
                        dataset_id: dataset.id,
                        dataset_group_id,
                        deleted_at: None,
                        created_at: chrono::Utc::now(),
                        updated_at: chrono::Utc::now(),
                    })
                    .collect();

                diesel::insert_into(datasets_to_dataset_groups::table)
                    .values(&values)
                    .on_conflict((
                        datasets_to_dataset_groups::dataset_id,
                        datasets_to_dataset_groups::dataset_group_id,
                    ))
                    .do_update()
                    .set(datasets_to_dataset_groups::deleted_at.eq(None::<chrono::DateTime<chrono::Utc>>))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let unassign_handle = {
        let dataset_group_id = dataset_group_id;
        spawn(async move {
            if !to_unassign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                diesel::update(datasets_to_dataset_groups::table)
                    .filter(
                        datasets_to_dataset_groups::dataset_id
                            .eq_any(to_unassign.iter().map(|a| a.id))
                            .and(datasets_to_dataset_groups::dataset_group_id.eq(dataset_group_id)),
                    )
                    .set(datasets_to_dataset_groups::deleted_at.eq(chrono::Utc::now()))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let (assign_result, unassign_result) = tokio::try_join!(assign_handle, unassign_handle)?;
    assign_result?;
    unassign_result?;

    Ok(())
} 