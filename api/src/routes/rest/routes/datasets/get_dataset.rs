use anyhow::{anyhow, Result};
use axum::{extract::Path, Extension};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::{
    database::{
        enums::UserOrganizationRole,
        lib::get_pg_pool,
        models::User,
        schema::{data_sources, datasets, users, users_to_organizations},
    },
    routes::rest::ApiResponse,
};

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

#[derive(Serialize)]
pub struct GetDatasetResponse {
    pub id: Uuid,
    #[serde(rename = "description")]
    pub when_to_use: Option<String>,
    pub name: String,
    pub sql: Option<String>,
    pub yml_file: Option<String>,
}

pub async fn get_dataset(
    Extension(user): Extension<User>,
    Path(dataset_id): Path<Uuid>,
) -> Result<ApiResponse<GetDatasetResponse>, (axum::http::StatusCode, &'static str)> {
    match get_dataset_handler(&dataset_id, &user).await {
        Ok(dataset) => Ok(ApiResponse::JsonData(dataset)),
        Err(e) => {
            tracing::error!("Error getting dataset: {:?}", e);
            Err((
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to get dataset",
            ))
        }
    }
}

async fn get_dataset_handler(dataset_id: &Uuid, user: &User) -> Result<GetDatasetResponse> {
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

    let (dataset_id, name, sql, when_to_use, yml_file) = match datasets::table
        .filter(datasets::id.eq(dataset_id))
        .filter(datasets::deleted_at.is_null())
        .select((
            datasets::id,
            datasets::name,
            datasets::definition,
            datasets::when_to_use,
            datasets::yml_file,
        ))
        .first::<(Uuid, String, String, Option<String>, Option<String>)>(&mut conn)
        .await
    {
        Ok(result) => result,
        Err(e) => return Err(anyhow!("Unable to get dataset from database: {}", e)),
    };

    Ok(GetDatasetResponse {
        id: dataset_id,
        name,
        sql: Some(sql),
        when_to_use,
        yml_file,
    })
}
