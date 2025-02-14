use crate::database::enums::DataSourceType;

use super::{
    credentials::Credential,
    data_source_connections::{
        get_bigquery_client::get_bigquery_client, get_databricks_client::get_databricks_client,
        get_mysql_connection::get_mysql_connection,
        get_postgres_connection::get_postgres_connection,
        get_redshift_connection::get_redshift_connection,
        get_snowflake_client::get_snowflake_client,
        get_sql_server_connection::get_sql_server_connection,
    },
};
use anyhow::{anyhow, Result};

pub async fn test_data_source_connection(
    type_: &DataSourceType,
    credential: &Credential,
) -> Result<()> {
    match type_ {
        DataSourceType::BigQuery => {
            let credential = match credential {
                Credential::Bigquery(credential) => credential,
                _ => return Err(anyhow!("Invalid credential type")),
            };

            match get_bigquery_client(&credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting bigquery client: {:?}", e)),
            };

            Ok(())
        }
        DataSourceType::Databricks => {
            let credential = match credential {
                Credential::Databricks(credential) => credential,
                _ => return Err(anyhow!("Invalid credential type")),
            };

            let client = match get_databricks_client(&credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting databricks client: {:?}", e)),
            };

            match client.query("SELECT 1".to_string()).await {
                Ok(_) => (),
                Err(e) => return Err(anyhow!("Error executing test query: {:?}", e)),
            }

            Ok(())
        }
        DataSourceType::MySql | DataSourceType::Mariadb => {
            let credential = match credential {
                Credential::MySQL(credential) => credential,
                _ => return Err(anyhow!("Invalid credential type")),
            };

            match get_mysql_connection(credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting mysql client: {:?}", e)),
            };

            Ok(())
        }
        DataSourceType::Postgres | DataSourceType::Supabase => {
            let credential = match credential {
                Credential::Postgres(credential) => credential,
                _ => return Err(anyhow!("Invalid credential type")),
            };

            match get_postgres_connection(&credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting postgres client: {:?}", e)),
            };

            Ok(())
        }
        DataSourceType::Redshift => {
            // REDSHIFT just uses postgres credentials
            let Credential::Postgres(credential) = credential else {
                return Err(anyhow!("Invalid credential type: {:?}", credential));
            };

            get_redshift_connection(&credential)
                .await
                .map_err(|e| anyhow!("Error getting redshift client: {:?}", e))?;

            println!("Made it to redshift");

            Ok(())
        }
        DataSourceType::Snowflake => {
            let credential = match credential {
                Credential::Snowflake(credential) => credential,
                _ => return Err(anyhow!("Invalid credential type")),
            };

            match get_snowflake_client(&credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting snowflake client: {:?}", e)),
            };

            Ok(())
        }
        DataSourceType::SqlServer => {
            let credential = match credential {
                Credential::SqlServer(credential) => credential,
                _ => return Err(anyhow!("Invalid credential type")),
            };

            match get_sql_server_connection(&credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting sqlserver client: {:?}", e)),
            };

            Ok(())
        }
    }
}
