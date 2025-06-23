use anyhow::{anyhow, Result};
use axum::{extract::Path, Extension};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use serde::Serialize;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use crate::{
    database::{
        enums::UserOrganizationRole,
        pool::get_pg_pool,
        models::Dataset,
        schema::{datasets, users_to_organizations},
    },
    routes::rest::ApiResponse,
};

use query_engine::data_types::DataType;
use query_engine::data_source_query_routes::query_engine::query_engine;

#[derive(Serialize)]
pub struct GetDatasetOwner {
    pub id: Uuid,
    pub name: String,
    pub avatar_url: Option<String>,
}

#[derive(Serialize)]
pub struct GetDatasetDataSource {
    pub id: Uuid,
    pub name: String,
}

pub async fn get_dataset_data_sample(
    Extension(user): Extension<AuthenticatedUser>,
    Path(dataset_id): Path<Uuid>,
) -> Result<ApiResponse<Vec<IndexMap<String, DataType>>>, (axum::http::StatusCode, &'static str)> {
    match get_dataset_data_sample_handler(&dataset_id, &user).await {
        Ok(data) => Ok(ApiResponse::JsonData(data)),
        Err(e) => {
            tracing::error!("Error getting dataset: {:?}", e);
            Err((
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to get dataset",
            ))
        }
    }
}

async fn get_dataset_data_sample_handler(
    dataset_id: &Uuid,
    user: &AuthenticatedUser,
) -> Result<Vec<IndexMap<String, DataType>>> {
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
        .filter(datasets::id.eq(dataset_id))
        .filter(users_to_organizations::user_id.eq(user.id))
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

    let dataset = match datasets::table
        .filter(datasets::id.eq(dataset_id))
        .filter(datasets::deleted_at.is_null())
        .first::<Dataset>(&mut conn)
        .await
    {
        Ok(dataset) => dataset,
        Err(e) => return Err(anyhow!("Unable to get dataset from database: {}", e)),
    };

    let data = {
        let schema = dataset.schema.clone();
        let database_name = dataset.database_name.clone();
        let sql = format!("SELECT * FROM {}.{} LIMIT 25", schema, database_name);
        match query_engine(&dataset.data_source_id, &sql, None).await {
            Ok(data) => data.data,
            Err(e) => {
                tracing::error!("Error getting dataset data: {:?}", e);
                return Err(anyhow!("Error getting dataset data: {:?}", e));
            }
        }
    };

    Ok(data)
}
