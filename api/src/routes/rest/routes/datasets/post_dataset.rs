use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use reqwest::StatusCode;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    database::{
        enums::{DatasetType, UserOrganizationRole},
        lib::get_pg_pool,
        models::{DataSource, Dataset, User},
        schema::{data_sources, datasets, users_to_organizations},
    },
    routes::rest::ApiResponse,
    utils::{
        security::checks::is_user_workspace_admin_or_data_admin,
        user::user_info::get_user_organization_id,
    },
};

#[derive(Debug, Deserialize)]
pub struct PostDatasetReq {
    pub name: String,
    pub data_source_id: Uuid,
}

pub async fn post_dataset(
    Extension(user): Extension<User>,
    Json(request): Json<PostDatasetReq>,
) -> Result<ApiResponse<Dataset>, (axum::http::StatusCode, String)> {
    match is_user_workspace_admin_or_data_admin(&user.id).await {
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

    let dataset = match post_dataset_handler(&user.id, &request.data_source_id, &request.name).await
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
    name: &str,
) -> Result<Dataset> {
    // Get the user organization id.
    let organization_id = get_user_organization_id(&user_id).await?;

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    // First check if user has admin access through their organization role
    let user_role = match users_to_organizations::table
        .inner_join(
            datasets::table
                .on(users_to_organizations::organization_id.eq(datasets::organization_id)),
        )
        .select(users_to_organizations::role)
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .first::<UserOrganizationRole>(&mut conn)
        .await
    {
        Ok(role) => role,
        Err(e) => return Err(anyhow!("Unable to get user role: {}", e)),
    };

    let has_admin_access = matches!(
        user_role,
        UserOrganizationRole::WorkspaceAdmin | UserOrganizationRole::DataAdmin
    );

    if !has_admin_access {
        return Err(anyhow!(
            "User does not have permission to access this dataset"
        ));
    }

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
    };

    diesel::insert_into(datasets::table)
        .values(&dataset)
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to insert dataset: {}", e))?;

    Ok(dataset)
}
