use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::types::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{
    enums::{DataSourceOnboardingStatus, UserOrganizationRole},
    models::DataSource,
    pool::get_pg_pool,
    schema::data_sources,
    vault::create_secret,
};
use query_engine::credentials::Credential;
use stored_values::schema::create_search_schema;

#[derive(Deserialize)]
pub struct CreateDataSourceRequest {
    pub name: String,
    #[serde(flatten)]
    pub credential: Credential,
}

#[derive(Serialize)]
pub struct CreateDataSourceResponse {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: CreatedByResponse,
    pub credentials: Credential,
    pub data_sets: Vec<DatasetResponse>,
}

#[derive(Serialize)]
pub struct CreatedByResponse {
    pub id: String,
    pub email: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct DatasetResponse {
    pub id: String,
    pub name: String,
}

pub async fn create_data_source_handler(
    user: &AuthenticatedUser,
    request: CreateDataSourceRequest,
) -> Result<CreateDataSourceResponse> {
    // Verify user has an organization
    if user.organizations.is_empty() {
        return Err(anyhow!("User is not a member of any organization"));
    }

    // Get the first organization (users can only belong to one organization currently)
    let user_org = &user.organizations[0];

    // Verify user has appropriate permissions (admin role)
    if user_org.role != UserOrganizationRole::WorkspaceAdmin
        && user_org.role != UserOrganizationRole::DataAdmin
    {
        return Err(anyhow!(
            "User does not have appropriate permissions to create data sources"
        ));
    }

    let mut conn = get_pg_pool().get().await?;

    // Check if data source with same name already exists in the organization
    let existing_data_source = data_sources::table
        .filter(data_sources::name.eq(&request.name))
        .filter(data_sources::organization_id.eq(user_org.id))
        .filter(data_sources::deleted_at.is_null())
        .first::<DataSource>(&mut conn)
        .await
        .ok();

    if existing_data_source.is_some() {
        return Err(anyhow!(
            "A data source with this name already exists in this organization and environment"
        ));
    }

    // Create new data source
    let data_source_id = Uuid::new_v4();
    let now = Utc::now();
    let data_source = DataSource {
        id: data_source_id,
        name: request.name.clone(),
        type_: request.credential.get_type(),
        secret_id: data_source_id, // Use same ID for data source and secret
        onboarding_status: DataSourceOnboardingStatus::NotStarted,
        onboarding_error: None,
        organization_id: user_org.id,
        created_by: user.id,
        updated_by: user.id,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        env: "dev".to_string(),
    };

    // Insert the data source
    diesel::insert_into(data_sources::table)
        .values(&data_source)
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Error creating data source: {}", e))?;

    // Create the search schema for this data source
    create_search_schema(data_source.id)
        .await
        .map_err(|e| anyhow!("Error creating search schema: {}", e))?;

    // Store credentials in vault
    let credential_json = serde_json::to_string(&request.credential)
        .map_err(|e| anyhow!("Error serializing credentials: {}", e))?;

    create_secret(&credential_json, &data_source.id.to_string(), None)
        .await
        .map_err(|e| anyhow!("Error storing credentials in vault: {}", e))?;

    // Build response using AuthenticatedUser info
    let response = CreateDataSourceResponse {
        id: data_source.id.to_string(),
        name: data_source.name,
        r#type: data_source.type_.to_string(),
        created_at: data_source.created_at.to_rfc3339(),
        updated_at: data_source.updated_at.to_rfc3339(),
        created_by: CreatedByResponse {
            id: user.id.to_string(),
            email: user.email.clone(),
            name: user.name.clone().unwrap_or_default(),
        },
        credentials: request.credential,
        data_sets: Vec::new(), // Empty for new data sources
    };

    Ok(response)
}
