use std::str::FromStr;

use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::{AsChangeset, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::types::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{
    enums::{DataSourceType, UserOrganizationRole},
    models::{DataSource, User},
    pool::get_pg_pool,
    schema::{data_sources, users},
    vault::{read_secret, update_secret},
};
use query_engine::credentials::Credential;

/// Request for updating a data source
#[derive(Debug, Deserialize)]
pub struct UpdateDataSourceRequest {
    pub name: Option<String>,
    pub env: Option<String>,
    #[serde(flatten)]
    pub credential: Option<serde_json::Value>,
}

/// Changeset for updating a data source
#[derive(AsChangeset)]
#[diesel(table_name = data_sources)]
struct DataSourceChangeset {
    name: Option<String>,
    env: Option<String>,
    updated_at: DateTime<Utc>,
    updated_by: Uuid,
    #[diesel(column_name = type_)]
    type_field: Option<String>,
}

/// Part of the response showing the user who created the data source
#[derive(Serialize)]
pub struct CreatedBy {
    pub id: String,
    pub email: String,
    pub name: String,
}

/// Response for a data source
#[derive(Serialize)]
pub struct DataSourceResponse {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: CreatedBy,
    pub credentials: Credential,
    pub data_sets: Vec<serde_json::Value>, // Empty for now, could be populated if needed
}

/// Handler for updating a data source
pub async fn update_data_source_handler(
    user: &AuthenticatedUser,
    data_source_id: &Uuid,
    request: UpdateDataSourceRequest,
) -> Result<DataSourceResponse> {
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
            "User does not have appropriate permissions to update data sources"
        ));
    }

    let mut conn = get_pg_pool().get().await?;

    // Get current data source
    let mut data_source = data_sources::table
        .filter(data_sources::id.eq(data_source_id))
        .filter(data_sources::organization_id.eq(user_org.id))
        .filter(data_sources::deleted_at.is_null())
        .first::<DataSource>(&mut conn)
        .await
        .map_err(|e| anyhow!("Data source not found: {}", e))?;

    // Extract type from credentials if present (can't change type in update)
    let type_field = request
        .credential
        .as_ref()
        .and_then(|cred| cred.get("type"))
        .and_then(|t| t.as_str())
        .map(|s| s.to_string());

    // Only perform database update if there are changes to make
    if request.name.is_some() || request.env.is_some() || type_field.is_some() {
        // Create changeset for update
        let changeset = DataSourceChangeset {
            name: request.name.clone(),
            env: request.env.clone(),
            updated_at: Utc::now(),
            updated_by: user.id,
            type_field: type_field.clone(),
        };

        // Execute the update
        diesel::update(data_sources::table)
            .filter(data_sources::id.eq(data_source_id))
            .set(changeset)
            .execute(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to update data source: {}", e))?;

        // Update local variable
        if let Some(name) = &request.name {
            data_source.name = name.clone();
        }

        if let Some(env) = &request.env {
            data_source.env = env.clone();
        }

        if let Some(type_str) = &type_field {
            data_source.type_ = DataSourceType::from_str(type_str).unwrap();
        }
    }

    // Update credentials if provided
    if let Some(new_credentials) = &request.credential {
        // Read existing secret
        let existing_secret = read_secret(data_source_id).await?;

        // Get the current credential structure
        let current_credential: Credential = serde_json::from_str(&existing_secret)
            .map_err(|e| anyhow!("Failed to parse existing credentials: {}", e))?;

        // Create updated credential based on the type
        let updated_credential = match &current_credential {
            Credential::Postgres(creds) => {
                let mut updated = creds.clone();

                // Update fields if present in request
                if let Some(host) = new_credentials.get("host").and_then(|v| v.as_str()) {
                    updated.host = host.to_string();
                }
                if let Some(port) = new_credentials
                    .get("port")
                    .and_then(|v| v.as_u64())
                    .map(|v| v as u16)
                {
                    updated.port = port;
                }
                if let Some(username) = new_credentials.get("username").and_then(|v| v.as_str()) {
                    updated.username = username.to_string();
                }
                if let Some(password) = new_credentials.get("password").and_then(|v| v.as_str()) {
                    updated.password = password.to_string();
                }
                if let Some(default_database) = new_credentials
                    .get("default_database")
                    .and_then(|v| v.as_str())
                {
                    updated.default_database = default_database.to_string();
                }
                if let Some(default_schema) = new_credentials
                    .get("default_schema")
                    .and_then(|v| v.as_str())
                {
                    updated.default_schema = Some(default_schema.to_string());
                }
                if let Some(jump_host) = new_credentials.get("jump_host").and_then(|v| v.as_str()) {
                    updated.jump_host = Some(jump_host.to_string());
                }
                if let Some(ssh_username) =
                    new_credentials.get("ssh_username").and_then(|v| v.as_str())
                {
                    updated.ssh_username = Some(ssh_username.to_string());
                }
                if let Some(ssh_private_key) = new_credentials
                    .get("ssh_private_key")
                    .and_then(|v| v.as_str())
                {
                    updated.ssh_private_key = Some(ssh_private_key.to_string());
                }

                Credential::Postgres(updated)
            }
            Credential::MySql(creds) => {
                let mut updated = creds.clone();

                if let Some(host) = new_credentials.get("host").and_then(|v| v.as_str()) {
                    updated.host = host.to_string();
                }
                if let Some(port) = new_credentials
                    .get("port")
                    .and_then(|v| v.as_u64())
                    .map(|v| v as u16)
                {
                    updated.port = port;
                }
                if let Some(username) = new_credentials.get("username").and_then(|v| v.as_str()) {
                    updated.username = username.to_string();
                }
                if let Some(password) = new_credentials.get("password").and_then(|v| v.as_str()) {
                    updated.password = password.to_string();
                }
                if let Some(default_database) = new_credentials
                    .get("default_database")
                    .and_then(|v| v.as_str())
                {
                    updated.default_database = default_database.to_string();
                }
                if let Some(jump_host) = new_credentials.get("jump_host").and_then(|v| v.as_str()) {
                    updated.jump_host = Some(jump_host.to_string());
                }
                if let Some(ssh_username) =
                    new_credentials.get("ssh_username").and_then(|v| v.as_str())
                {
                    updated.ssh_username = Some(ssh_username.to_string());
                }
                if let Some(ssh_private_key) = new_credentials
                    .get("ssh_private_key")
                    .and_then(|v| v.as_str())
                {
                    updated.ssh_private_key = Some(ssh_private_key.to_string());
                }

                Credential::MySql(updated)
            }
            Credential::Bigquery(creds) => {
                let mut updated = creds.clone();

                if let Some(default_project_id) = new_credentials
                    .get("default_project_id")
                    .and_then(|v| v.as_str())
                {
                    updated.default_project_id = default_project_id.to_string();
                }
                if let Some(default_dataset_id) = new_credentials
                    .get("default_dataset_id")
                    .and_then(|v| v.as_str())
                {
                    updated.default_dataset_id = default_dataset_id.to_string();
                }
                if let Some(credentials_json) = new_credentials.get("credentials_json") {
                    updated.credentials_json = credentials_json.clone();
                }

                Credential::Bigquery(updated)
            }
            Credential::SqlServer(creds) => {
                let mut updated = creds.clone();

                if let Some(host) = new_credentials.get("host").and_then(|v| v.as_str()) {
                    updated.host = host.to_string();
                }
                if let Some(port) = new_credentials
                    .get("port")
                    .and_then(|v| v.as_u64())
                    .map(|v| v as u16)
                {
                    updated.port = port;
                }
                if let Some(username) = new_credentials.get("username").and_then(|v| v.as_str()) {
                    updated.username = username.to_string();
                }
                if let Some(password) = new_credentials.get("password").and_then(|v| v.as_str()) {
                    updated.password = password.to_string();
                }
                if let Some(default_database) = new_credentials
                    .get("default_database")
                    .and_then(|v| v.as_str())
                {
                    updated.default_database = default_database.to_string();
                }
                if let Some(default_schema) = new_credentials
                    .get("default_schema")
                    .and_then(|v| v.as_str())
                {
                    updated.default_schema = Some(default_schema.to_string());
                }
                if let Some(jump_host) = new_credentials.get("jump_host").and_then(|v| v.as_str()) {
                    updated.jump_host = Some(jump_host.to_string());
                }
                if let Some(ssh_username) =
                    new_credentials.get("ssh_username").and_then(|v| v.as_str())
                {
                    updated.ssh_username = Some(ssh_username.to_string());
                }
                if let Some(ssh_private_key) = new_credentials
                    .get("ssh_private_key")
                    .and_then(|v| v.as_str())
                {
                    updated.ssh_private_key = Some(ssh_private_key.to_string());
                }

                Credential::SqlServer(updated)
            }
            Credential::Redshift(creds) => {
                let mut updated = creds.clone();

                if let Some(host) = new_credentials.get("host").and_then(|v| v.as_str()) {
                    updated.host = host.to_string();
                }
                if let Some(port) = new_credentials
                    .get("port")
                    .and_then(|v| v.as_u64())
                    .map(|v| v as u16)
                {
                    updated.port = port;
                }
                if let Some(username) = new_credentials.get("username").and_then(|v| v.as_str()) {
                    updated.username = username.to_string();
                }
                if let Some(password) = new_credentials.get("password").and_then(|v| v.as_str()) {
                    updated.password = password.to_string();
                }
                if let Some(default_database) = new_credentials
                    .get("default_database")
                    .and_then(|v| v.as_str())
                {
                    updated.default_database = default_database.to_string();
                }
                if let Some(default_schema) = new_credentials
                    .get("default_schema")
                    .and_then(|v| v.as_str())
                {
                    updated.default_schema = Some(default_schema.to_string());
                }

                Credential::Redshift(updated)
            }
            Credential::Databricks(creds) => {
                let mut updated = creds.clone();

                if let Some(host) = new_credentials.get("host").and_then(|v| v.as_str()) {
                    updated.host = host.to_string();
                }
                if let Some(api_key) = new_credentials.get("api_key").and_then(|v| v.as_str()) {
                    updated.api_key = api_key.to_string();
                }
                if let Some(warehouse_id) =
                    new_credentials.get("warehouse_id").and_then(|v| v.as_str())
                {
                    updated.warehouse_id = warehouse_id.to_string();
                }
                if let Some(default_catalog) = new_credentials
                    .get("default_catalog")
                    .and_then(|v| v.as_str())
                {
                    updated.default_catalog = default_catalog.to_string();
                }
                if let Some(default_schema) = new_credentials
                    .get("default_schema")
                    .and_then(|v| v.as_str())
                {
                    updated.default_schema = Some(default_schema.to_string());
                }

                Credential::Databricks(updated)
            }
            Credential::Snowflake(creds) => {
                let mut updated = creds.clone();

                if let Some(account_id) = new_credentials.get("account_id").and_then(|v| v.as_str())
                {
                    updated.account_id = account_id.to_string();
                }
                if let Some(warehouse_id) =
                    new_credentials.get("warehouse_id").and_then(|v| v.as_str())
                {
                    updated.warehouse_id = warehouse_id.to_string();
                }
                if let Some(username) = new_credentials.get("username").and_then(|v| v.as_str()) {
                    updated.username = username.to_string();
                }
                if let Some(password) = new_credentials.get("password").and_then(|v| v.as_str()) {
                    updated.password = password.to_string();
                }
                if let Some(role) = new_credentials.get("role").and_then(|v| v.as_str()) {
                    updated.role = Some(role.to_string());
                }
                if let Some(default_database) = new_credentials
                    .get("default_database")
                    .and_then(|v| v.as_str())
                {
                    updated.default_database = default_database.to_string();
                }
                if let Some(default_schema) = new_credentials
                    .get("default_schema")
                    .and_then(|v| v.as_str())
                {
                    updated.default_schema = Some(default_schema.to_string());
                }

                Credential::Snowflake(updated)
            }
        };

        // Update the secret
        let updated_secret_json = serde_json::to_string(&updated_credential)
            .map_err(|e| anyhow!("Failed to serialize updated credentials: {}", e))?;

        update_secret(data_source_id, &updated_secret_json, &data_source.name, None)
            .await
            .map_err(|e| anyhow!("Error updating credentials in vault: {}", e))?;
    }

    // Get the creator's information
    let creator = users::table
        .filter(users::id.eq(data_source.created_by))
        .first::<User>(&mut conn)
        .await
        .map_err(|e| anyhow!("Unable to get creator information: {}", e))?;

    // Fetch the current credential data
    let secret = read_secret(data_source_id).await?;
    let credential: Credential =
        serde_json::from_str(&secret).map_err(|e| anyhow!("Failed to parse credentials: {}", e))?;

    // Build the response
    Ok(DataSourceResponse {
        id: data_source.id.to_string(),
        name: data_source.name,
        db_type: data_source.type_.to_string(),
        created_at: data_source.created_at,
        updated_at: data_source.updated_at,
        created_by: CreatedBy {
            id: creator.id.to_string(),
            email: creator.email,
            name: creator.name.unwrap_or_else(|| "".to_string()),
        },
        credentials: credential,
        data_sets: Vec::new(),
    })
}
