use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use reqwest::StatusCode;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    database::{
        enums::DatasetType,
        models::{DataSource, Dataset},
        pool::get_pg_pool,
        schema::{data_sources, datasets},
    },
    routes::rest::ApiResponse,
    utils::security::checks::is_user_workspace_admin_or_data_admin,
};

use database::organization::get_user_organization_id;

#[derive(Debug, Deserialize)]
pub struct PostDatasetReq {
    pub name: String,
    pub data_source_id: Uuid,
}

pub async fn post_dataset(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<PostDatasetReq>,
) -> Result<ApiResponse<Dataset>, (axum::http::StatusCode, String)> {
    // Check if user is workspace admin or data admin
    let organization_id = match get_user_organization_id(&user.id).await {
        Ok(Some(id)) => id,
        Ok(None) => {
            return Err((
                StatusCode::FORBIDDEN,
                "User does not belong to any organization".to_string(),
            ));
        }
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting user organization id".to_string(),
            ));
        }
    };

    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => {
            return Err((
                StatusCode::FORBIDDEN,
                "Insufficient permissions".to_string(),
            ))
        }
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error checking user permissions".to_string(),
            ));
        }
    }

    let dataset = match post_dataset_handler(
        &user.id,
        &request.data_source_id,
        &organization_id,
        &request.name,
    )
    .await
    {
        Ok(dataset) => dataset,
        Err(e) => {
            tracing::error!("Error creating dataset: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error creating dataset".to_string(),
            ));
        }
    };

    Ok(ApiResponse::JsonData(dataset))
}

async fn post_dataset_handler(
    user_id: &Uuid,
    data_source_id: &Uuid,
    organization_id: &Uuid,
    name: &str,
) -> Result<Dataset> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    // Verify data source exists and belongs to organization
    match data_sources::table
        .filter(data_sources::id.eq(data_source_id))
        .filter(data_sources::organization_id.eq(organization_id))
        .filter(data_sources::deleted_at.is_null())
        .select(data_sources::all_columns)
        .first::<DataSource>(&mut conn)
        .await
    {
        Ok(data_source) => data_source,
        Err(diesel::NotFound) => return Err(anyhow!("Data source not found")),
        Err(e) => return Err(anyhow!("Data sources not found: {}", e)),
    };

    let database_name = name.replace(" ", "_");

    let dataset = Dataset {
        id: Uuid::new_v4(),
        name: name.to_string(),
        data_source_id: data_source_id.clone(),
        organization_id: organization_id.clone(),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        database_name,
        when_to_use: None,
        when_not_to_use: None,
        type_: DatasetType::Table,
        definition: String::new(),
        schema: String::new(),
        enabled: false,
        imported: false,
        created_by: user_id.clone(),
        updated_by: user_id.clone(),
        deleted_at: None,
        model: None,
        yml_file: None,
        database_identifier: None,
    };

    diesel::insert_into(datasets::table)
        .values(&dataset)
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to insert dataset: {}", e))?;

    Ok(dataset)
}
