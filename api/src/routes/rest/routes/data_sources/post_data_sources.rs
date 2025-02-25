use std::collections::HashMap;

use anyhow::{anyhow, Result};
use axum::http::StatusCode;
use axum::Extension;
use axum::Json;
use chrono::DateTime;
use chrono::Utc;
use diesel::insert_into;
use diesel::upsert::excluded;
use diesel::BoolExpressionMethods;
use diesel::ExpressionMethods;
use diesel::QueryDsl;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::database::enums::DataSourceOnboardingStatus;
use crate::database::enums::UserOrganizationRole;
use crate::database::lib::get_pg_pool;
use crate::database::models::{DataSource, User};
use crate::database::schema::data_sources;
use crate::database::schema::users_to_organizations;
use crate::routes::rest::ApiResponse;
use crate::utils::clients::supabase_vault::create_secrets;
use crate::utils::query_engine::credentials::Credential;
use crate::utils::query_engine::credentials::PostgresCredentials;

#[derive(Debug, Deserialize)]
pub struct CreateDataSourceRequest {
    pub name: String,
    pub env: String,
    #[serde(flatten)]
    pub credential: Credential,
}

#[derive(Debug, Serialize)]
pub struct CreateDataSourceResponse {
    pub ids: Vec<Uuid>,
}

pub async fn post_data_sources(
    Extension(user): Extension<User>,
    Json(payload): Json<Vec<CreateDataSourceRequest>>,
) -> Result<ApiResponse<CreateDataSourceResponse>, (StatusCode, &'static str)> {
    let ids = match post_data_sources_handler(&user.id, payload).await {
        Ok(ids) => ids,
        Err(e) => {
            tracing::error!("Error creating data sources: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error creating data sources",
            ));
        }
    };

    Ok(ApiResponse::JsonData(CreateDataSourceResponse { ids }))
}

async fn post_data_sources_handler(
    user_id: &Uuid,
    requests: Vec<CreateDataSourceRequest>,
) -> Result<Vec<Uuid>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            return Err(anyhow!("Error getting postgres connection: {}", e));
        }
    };

    let organization_id = match users_to_organizations::table
        .select(users_to_organizations::organization_id)
        .filter(users_to_organizations::deleted_at.is_null())
        .filter(
            users_to_organizations::role
                .eq(UserOrganizationRole::WorkspaceAdmin)
                .or(users_to_organizations::role.eq(UserOrganizationRole::DataAdmin)),
        )
        .filter(users_to_organizations::user_id.eq(user_id))
        .first::<Uuid>(&mut conn)
        .await
    {
        Ok(user_org) => user_org,
        Err(diesel::NotFound) => {
            return Err(anyhow!("User does not have appropriate permissions"));
        }
        Err(e) => {
            return Err(anyhow!("Error getting user organization: {}", e));
        }
    };

    let secret_values = requests
        .iter()
        .map(|request| {
            // Special handling for Redshift credentials
            let credential = if let Credential::Redshift(redshift_creds) = &request.credential {
                tracing::info!("Redshift credentials before conversion - database: {:?}, host: {}, port: {}", 
                    redshift_creds.database, redshift_creds.host, redshift_creds.port);
                
                // Convert RedshiftCredentials to PostgresCredentials
                // This is necessary because Redshift uses PostgresCredentials internally
                // but the database field is required in PostgresCredentials while optional in RedshiftCredentials
                let postgres_creds = PostgresCredentials {
                    host: redshift_creds.host.clone(),
                    port: redshift_creds.port,
                    username: redshift_creds.username.clone(),
                    password: redshift_creds.password.clone(),
                    // Use the database value if provided, otherwise use "dev" as default
                    database: redshift_creds.database.clone().unwrap_or_else(|| "dev".to_string()),
                    schema: None,
                    jump_host: None,
                    ssh_username: None,
                    ssh_private_key: None,
                };
                
                Credential::Postgres(postgres_creds)
            } else {
                request.credential.clone()
            };
            
            let serialized = serde_json::to_string(&credential).unwrap();
            
            if let Credential::Redshift(_) = &request.credential {
                tracing::info!("Serialized Redshift credentials (converted to Postgres): {}", serialized);
            }
            
            (
                request.name.clone(),
                serialized,
            )
        })
        .collect::<HashMap<String, String>>();

    let secret_ids = match create_secrets(&secret_values).await {
        Ok(secret_ids) => secret_ids,
        Err(e) => {
            return Err(anyhow!("Error creating secret: {}", e));
        }
    };

    let data_sources = requests
        .iter()
        .map(|request| {
            let secret_id = secret_ids.get(&request.name).unwrap();
            DataSource {
                id: Uuid::new_v4(),
                name: request.name.clone(),
                type_: request.credential.get_type(),
                secret_id: *secret_id,
                organization_id,
                created_by: *user_id,
                updated_by: *user_id,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted_at: None,
                onboarding_status: DataSourceOnboardingStatus::NotStarted,
                onboarding_error: None,
                env: request.env.clone(),
            }
        })
        .collect::<Vec<DataSource>>();

    match insert_into(data_sources::table)
        .values(&data_sources)
        .on_conflict((
            data_sources::name,
            data_sources::organization_id,
            data_sources::env,
        ))
        .do_update()
        .set((
            data_sources::type_.eq(excluded(data_sources::type_)),
            data_sources::updated_by.eq(excluded(data_sources::updated_by)),
            data_sources::secret_id.eq(excluded(data_sources::secret_id)),
            data_sources::updated_at.eq(chrono::Utc::now()),
            data_sources::deleted_at.eq(Option::<DateTime<Utc>>::None),
            data_sources::env.eq(excluded(data_sources::env)),
        ))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => {
            return Err(anyhow!("Error inserting data source: {}", e));
        }
    };

    Ok(data_sources.iter().map(|ds| ds.id).collect())
}
