use crate::credentials::Credential;
use crate::data_source_connections::{
    get_bigquery_client::get_bigquery_client, get_databricks_client::get_databricks_client,
    get_mysql_connection::get_mysql_connection, get_postgres_connection::get_postgres_connection,
    get_redshift_connection::get_redshift_connection, get_snowflake_client::get_snowflake_client,
    get_sql_server_connection::get_sql_server_connection,
};
use anyhow::{anyhow, Result};

pub async fn test_data_source_connection(credential: &Credential) -> Result<()> {
    match credential {
        Credential::Bigquery(credential) => {
            match get_bigquery_client(credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting bigquery client: {:?}", e)),
            };

            Ok(())
        }
        Credential::Databricks(credential) => {
            let client = match get_databricks_client(credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting databricks client: {:?}", e)),
            };

            match client.query("SELECT 1".to_string()).await {
                Ok(_) => (),
                Err(e) => return Err(anyhow!("Error executing test query: {:?}", e)),
            }

            Ok(())
        }
        Credential::MySql(credential) => {
            match get_mysql_connection(credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting mysql client: {:?}", e)),
            };

            Ok(())
        }
        Credential::Postgres(credential) => {
            match get_postgres_connection(credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting postgres client: {:?}", e)),
            };

            Ok(())
        }
        Credential::Redshift(credential) => {
            get_redshift_connection(credential)
                .await
                .map_err(|e| anyhow!("Error getting redshift client: {:?}", e))?;

            println!("Made it to redshift");

            Ok(())
        }
        Credential::Snowflake(credential) => {
            match get_snowflake_client(credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting snowflake client: {:?}", e)),
            };

            Ok(())
        }
        Credential::SqlServer(credential) => {
            match get_sql_server_connection(credential).await {
                Ok(client) => client,
                Err(e) => return Err(anyhow!("Error getting sqlserver client: {:?}", e)),
            };

            Ok(())
        }
    }
}
