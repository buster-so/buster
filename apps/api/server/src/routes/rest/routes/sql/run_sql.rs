use anyhow::{anyhow, Result};
use axum::{Extension, Json};
use diesel::{BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl};
use indexmap::IndexMap;
use query_engine::data_source_query_routes::query_engine::query_engine;
use query_engine::data_types::DataType;
use reqwest::StatusCode;
use uuid::Uuid;

use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};

use database::{
    enums::UserOrganizationRole,
    pool::get_pg_pool,
    schema::{data_sources, datasets, users_to_organizations},
    types::DataMetadata,
};

use dataset_security::has_dataset_access;
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;

const MAX_UNIQUE_VALUES: usize = 100;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RunSqlRequest {
    pub dataset_id: Option<Uuid>,
    pub data_source_id: Option<Uuid>,
    pub sql: String,
}

pub async fn run_sql(
    Extension(user): Extension<AuthenticatedUser>,
    Json(req): Json<RunSqlRequest>,
) -> Result<ApiResponse<DataObject>, (StatusCode, &'static str)> {
    let data_object =
        match run_sql_handler(&req.sql, &req.data_source_id, &req.dataset_id, &user.id).await {
            Ok(data_object) => data_object,
            Err(e) => {
                tracing::error!("Error running SQL: {:?}", e);
                let err_msg = format!("Error running SQL: {:?}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Box::leak(err_msg.into_boxed_str()),
                ));
            }
        };

    Ok(ApiResponse::JsonData(data_object))
}

async fn run_sql_handler(
    sql: &String,
    data_source_id: &Option<Uuid>,
    dataset_id: &Option<Uuid>,
    user_id: &Uuid,
) -> Result<DataObject> {
    if let Some(data_source_id) = data_source_id {
        return run_data_source_sql_handler(sql, &data_source_id, user_id).await;
    } else if let Some(dataset_id) = dataset_id {
        return run_dataset_sql_handler(sql, &dataset_id, user_id).await;
    } else {
        return Err(anyhow!("No data source or dataset id provided"));
    }
}

async fn run_dataset_sql_handler(
    sql: &String,
    dataset_id: &Uuid,
    user_id: &Uuid,
) -> Result<DataObject> {
    let has_dataset_access = match has_dataset_access(user_id, dataset_id).await {
        Ok(has_access) => has_access,
        Err(e) => return Err(e),
    };

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {}", e)),
    };

    let is_org_admin_or_owner = datasets::table
        .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
        .inner_join(
            users_to_organizations::table
                .on(data_sources::organization_id.eq(users_to_organizations::organization_id)),
        )
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(
            users_to_organizations::role
                .eq(UserOrganizationRole::WorkspaceAdmin)
                .or(users_to_organizations::role.eq(UserOrganizationRole::DataAdmin)),
        )
        .select(users_to_organizations::user_id)
        .first::<Uuid>(&mut conn)
        .await
        .is_ok();

    let results = if is_org_admin_or_owner || has_dataset_access {
        match fetch_data(sql, dataset_id).await {
            Ok(results) => results,
            Err(e) => return Err(e),
        }
    } else {
        return Err(anyhow!("User does not have access to this dataset"));
    };

    Ok(results)
}

#[derive(Debug, Serialize)]
pub struct DataObject {
    pub data: Vec<IndexMap<String, DataType>>,
    pub data_metadata: DataMetadata,
}

pub async fn fetch_data(sql: &String, dataset_id: &Uuid) -> Result<DataObject> {
    let query_result = match query_engine(&dataset_id, &sql, None).await {
        Ok(result) => result,
        Err(e) => {
            return Err(anyhow!(e));
        }
    };

    Ok(DataObject {
        data: query_result.data,
        data_metadata: query_result.metadata,
    })
}

async fn run_data_source_sql_handler(
    sql: &String,
    data_source_id: &Uuid,
    user_id: &Uuid,
) -> Result<DataObject> {
    let query_result = match query_engine(&data_source_id, &sql, None).await {
        Ok(result) => result,
        Err(e) => return Err(e),
    };

    Ok(DataObject {
        data: query_result.data,
        data_metadata: query_result.metadata,
    })
}
