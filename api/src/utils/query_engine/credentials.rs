use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use tracing;

use crate::{database::enums::DataSourceType, utils::clients::supabase_vault::read_secret};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
#[serde(rename_all = "lowercase")]
pub enum Credential {
    Postgres(PostgresCredentials),
    MySQL(MySqlCredentials),
    Bigquery(BigqueryCredentials),
    SqlServer(SqlServerCredentials),
    Redshift(RedshiftCredentials),
    Databricks(DatabricksCredentials),
    Snowflake(SnowflakeCredentials),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AthenaCredentials {
    pub data_source: String,
    pub db_database: String,
    pub aws_access_key: String,
    pub aws_secret_access: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BigqueryCredentials {
    pub credentials_json: Value,
    pub project_id: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DatabricksCredentials {
    pub host: String,
    pub api_key: String,
    pub warehouse_id: String,
    pub catalog_name: String,
    pub schemas: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MariadbCredentials {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub jump_host: Option<String>,
    pub ssh_username: Option<String>,
    pub ssh_private_key: Option<String>,
    #[serde(rename = "schemas")]
    pub databases: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MySqlCredentials {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub jump_host: Option<String>,
    pub ssh_username: Option<String>,
    pub ssh_private_key: Option<String>,
    #[serde(rename = "schemas")]
    pub databases: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PostgresCredentials {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    #[serde(alias = "dbname")]
    pub database: Option<String>,
    pub schemas: Option<Vec<String>>,
    pub jump_host: Option<String>,
    pub ssh_username: Option<String>,
    pub ssh_private_key: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RedshiftCredentials {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database: Option<String>,
    pub schemas: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SnowflakeCredentials {
    pub account_id: String,
    pub warehouse_id: String,
    pub database_id: Option<String>,
    pub username: String,
    pub password: String,
    pub role: Option<String>,
    pub schemas: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SqlServerCredentials {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database: String,
    pub jump_host: Option<String>,
    pub ssh_username: Option<String>,
    pub ssh_private_key: Option<String>,
    pub schemas: Option<Vec<String>>,
}

impl Credential {
    pub fn get_type_string(&self) -> String {
        match self {
            Credential::Postgres(_) => "postgres".to_string(),
            Credential::MySQL(_) => "mysql".to_string(),
            Credential::Bigquery(_) => "bigquery".to_string(),
            Credential::SqlServer(_) => "sqlserver".to_string(),
            Credential::Redshift(_) => "redshift".to_string(),
            Credential::Databricks(_) => "databricks".to_string(),
            Credential::Snowflake(_) => "snowflake".to_string(),
        }
    }

    pub fn get_type(&self) -> DataSourceType {
        match self {
            Credential::Postgres(_) => DataSourceType::Postgres,
            Credential::MySQL(_) => DataSourceType::MySql,
            Credential::Bigquery(_) => DataSourceType::BigQuery,
            Credential::SqlServer(_) => DataSourceType::SqlServer,
            Credential::Redshift(_) => DataSourceType::Redshift,
            Credential::Databricks(_) => DataSourceType::Databricks,
            Credential::Snowflake(_) => DataSourceType::Snowflake,
        }
    }
}

pub async fn get_data_source_credentials(
    secret_id: &Uuid,
    data_source_type: &DataSourceType,
    redact_secret: bool,
) -> Result<Credential> {
    let secret_string = match read_secret(&secret_id).await {
        Ok(secret) => secret,
        Err(e) => return Err(anyhow!("Error reading secret: {:?}", e)),
    };

    let credential: Credential = match data_source_type {
        DataSourceType::BigQuery => {
            match serde_json::from_str::<BigqueryCredentials>(&secret_string) {
                Ok(mut credential) => {
                    println!("credential: {:?}", credential);

                    if redact_secret {
                        credential.credentials_json = Value::Null;
                    }
                    Credential::Bigquery(credential)
                }
                Err(e) => return Err(anyhow!("Error deserializing BigQuery secret: {:?}", e)),
            }
        }
        DataSourceType::Databricks => {
            match serde_json::from_str::<DatabricksCredentials>(&secret_string) {
                Ok(mut credential) => {
                    if redact_secret {
                        credential.api_key = "[REDACTED]".to_string();
                    }
                    Credential::Databricks(credential)
                }
                Err(e) => return Err(anyhow!("Error deserializing Databricks secret: {:?}", e)),
            }
        }
        DataSourceType::MySql => match serde_json::from_str::<MySqlCredentials>(&secret_string) {
            Ok(mut credential) => {
                if redact_secret {
                    credential.password = "[REDACTED]".to_string();
                    credential.ssh_private_key =
                        credential.ssh_private_key.map(|_| "[REDACTED]".to_string());
                }
                Credential::MySQL(credential)
            }
            Err(e) => return Err(anyhow!("Error deserializing MySQL secret: {:?}", e)),
        },
        DataSourceType::Mariadb => match serde_json::from_str::<MySqlCredentials>(&secret_string) {
            Ok(mut credential) => {
                if redact_secret {
                    credential.password = "[REDACTED]".to_string();
                    credential.ssh_private_key =
                        credential.ssh_private_key.map(|_| "[REDACTED]".to_string());
                }
                Credential::MySQL(credential)
            }
            Err(e) => return Err(anyhow!("Error deserializing MariaDB secret: {:?}", e)),
        },
        DataSourceType::Postgres => {
            match serde_json::from_str::<PostgresCredentials>(&secret_string) {
                Ok(mut credential) => {
                    if redact_secret {
                        credential.password = "[REDACTED]".to_string();
                        credential.ssh_private_key =
                            credential.ssh_private_key.map(|_| "[REDACTED]".to_string());
                    }
                    Credential::Postgres(credential)
                }
                Err(e) => return Err(anyhow!("Error deserializing Postgres secret: {:?}", e)),
            }
        }
        DataSourceType::Redshift => {
            match serde_json::from_str::<PostgresCredentials>(&secret_string) {
                Ok(mut credential) => {
                    tracing::info!("Retrieved Redshift credentials from vault: database={:?}, host={}, port={}", 
                        credential.database, credential.host, credential.port);
                    
                    if redact_secret {
                        credential.password = "[REDACTED]".to_string();
                    }
                    // Convert PostgresCredentials to RedshiftCredentials
                    let redshift_creds = RedshiftCredentials {
                        host: credential.host,
                        port: credential.port,
                        username: credential.username,
                        password: credential.password,
                        database: credential.database.clone(),
                        schemas: credential.schemas.clone(),
                    };
                    Credential::Redshift(redshift_creds)
                }
                Err(e) => {
                    tracing::error!("Error deserializing Redshift secret: {:?}, raw secret: {}", e, secret_string);
                    return Err(anyhow!("Error deserializing Redshift secret: {:?}", e));
                }
            }
        }
        DataSourceType::Snowflake => {
            match serde_json::from_str::<SnowflakeCredentials>(&secret_string) {
                Ok(mut credential) => {
                    if redact_secret {
                        credential.password = "[REDACTED]".to_string();
                    }
                    Credential::Snowflake(credential)
                }
                Err(e) => return Err(anyhow!("Error deserializing Snowflake secret: {:?}", e)),
            }
        }
        DataSourceType::SqlServer => {
            match serde_json::from_str::<SqlServerCredentials>(&secret_string) {
                Ok(mut credential) => {
                    if redact_secret {
                        credential.password = "[REDACTED]".to_string();
                        credential.ssh_private_key =
                            credential.ssh_private_key.map(|_| "[REDACTED]".to_string());
                    }
                    Credential::SqlServer(credential)
                }
                Err(e) => return Err(anyhow!("Error deserializing SQL Server secret: {:?}", e)),
            }
        }
        DataSourceType::Supabase => {
            match serde_json::from_str::<PostgresCredentials>(&secret_string) {
                Ok(mut credential) => {
                    if redact_secret {
                        credential.password = "[REDACTED]".to_string();
                        credential.ssh_private_key =
                            credential.ssh_private_key.map(|_| "[REDACTED]".to_string());
                    }
                    Credential::Postgres(credential)
                }
                Err(e) => return Err(anyhow!("Error deserializing Supabase secret: {:?}", e)),
            }
        }
    };
    Ok(credential)
}
