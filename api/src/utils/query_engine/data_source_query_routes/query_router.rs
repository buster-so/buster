use indexmap::IndexMap;

use anyhow::{anyhow, Result};

use crate::{
    database::{enums::DataSourceType, models::DataSource},
    utils::{
        clients::supabase_vault::read_secret,
        query_engine::{
            credentials::{
                BigqueryCredentials, DatabricksCredentials, MySqlCredentials, PostgresCredentials,
                SnowflakeCredentials, SqlServerCredentials,
            },
            data_source_connections::{
                get_bigquery_client::get_bigquery_client,
                get_databricks_client::get_databricks_client,
                get_mysql_connection::get_mysql_connection,
                get_postgres_connection::get_postgres_connection,
                get_redshift_connection::get_redshift_connection,
                get_snowflake_client::get_snowflake_client,
                get_sql_server_connection::get_sql_server_connection,
                ssh_tunneling::kill_ssh_tunnel,
            },
            data_types::DataType,
        },
    },
};

use super::{
    bigquery_query::bigquery_query,
    databricks_query::databricks_query,
    mysql_query::mysql_query,
    postgres_query::postgres_query,
    redshift_query::redshift_query,
    security_utils::{query_safety_filter, write_query_safety_filter},
    snowflake_query::snowflake_query,
    sql_server_query::sql_server_query,
};

pub async fn query_router(
    data_source: &DataSource,
    sql: &String,
    limit: Option<i64>,
    write_req: bool,
) -> Result<Vec<IndexMap<String, DataType>>> {
    let corrected_sql = sql.clone();

    let secure_sql = corrected_sql.clone();

    if write_req {
        match write_query_safety_filter(secure_sql.clone()).await {
            Some(warning) => return Err(anyhow!(warning)),
            None => (),
        };
    } else {
        match query_safety_filter(secure_sql.clone()).await {
            Some(warning) => return Err(anyhow!(warning)),
            None => (),
        };
    }

    let results = match route_to_query(&data_source, &secure_sql, limit).await {
        Ok(results) => results,
        Err(e) => {
            tracing::error!(
                "There was an issue while querying the parent data source: {}",
                e
            );
            return Err(anyhow!(e));
        }
    };

    Ok(results)
}

async fn route_to_query(
    data_source: &DataSource,
    sql: &String,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<String, DataType>>> {
    let credentials_string = match read_secret(&data_source.secret_id).await {
        Ok(credentials) => credentials,
        Err(e) => return Err(anyhow!(e)),
    };

    let results = match data_source.type_ {
        DataSourceType::Postgres | DataSourceType::Supabase => {
            let credentials = match serde_json::from_str(&credentials_string) {
                Ok(credentials) => credentials,
                Err(e) => return Err(anyhow!(e)),
            };

            let (pg_pool, ssh_tunnel, temp_files) = match get_postgres_connection(&credentials)
                .await
            {
                Ok(pg_pool) => pg_pool,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match postgres_query(pg_pool, sql.clone(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    return Err(anyhow!(e));
                }
            };

            if let (Some(mut ssh_tunnel), Some(temp_files)) = (ssh_tunnel, temp_files) {
                let _ = kill_ssh_tunnel(&mut ssh_tunnel, temp_files).await;
            };

            results
        }
        DataSourceType::Redshift => {
            tracing::info!("Raw Redshift credentials string before deserialization: {}", credentials_string);
            
            let credentials: PostgresCredentials = match serde_json::from_str(&credentials_string) {
                Ok(creds) => creds,
                Err(e) => {
                    tracing::error!("Error deserializing Redshift credentials: {:?}", e);
                    return Err(anyhow!("Error deserializing Redshift credentials: {:?}", e));
                }
            };
            
            tracing::info!("Redshift query using credentials - database: {}, host: {}, port: {}", 
                credentials.database, credentials.host, credentials.port);

            let redshift_client = get_redshift_connection(&credentials).await?;

            let results = match redshift_query(redshift_client, sql.clone()).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            results
        }
        DataSourceType::MySql | DataSourceType::Mariadb => {
            let credentials: MySqlCredentials = serde_json::from_str(&credentials_string)?;

            let (mysql_pool, ssh_tunnel, temp_files) = match get_mysql_connection(&credentials)
                .await
            {
                Ok(mysql_pool) => mysql_pool,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match mysql_query(mysql_pool, sql.clone()).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            if let (Some(mut ssh_tunnel), Some(temp_files)) = (ssh_tunnel, temp_files) {
                let _ = kill_ssh_tunnel(&mut ssh_tunnel, temp_files).await;
            };

            results
        }
        DataSourceType::BigQuery => {
            let credentials: BigqueryCredentials = serde_json::from_str(&credentials_string)?;

            let (bq_client, project_id) = match get_bigquery_client(&credentials).await {
                Ok((bq_client, project_id)) => (bq_client, project_id),
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match bigquery_query(bq_client, project_id, sql.clone()).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            results
        }
        DataSourceType::SqlServer => {
            let credentials: SqlServerCredentials = serde_json::from_str(&credentials_string)?;

            let (sql_server_pool, ssh_tunnel, temp_files) = match get_sql_server_connection(
                &credentials,
            )
            .await
            {
                Ok(sql_server_pool) => sql_server_pool,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match sql_server_query(sql_server_pool, sql.clone()).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            if let (Some(mut ssh_tunnel), Some(temp_files)) = (ssh_tunnel, temp_files) {
                let _ = kill_ssh_tunnel(&mut ssh_tunnel, temp_files).await;
            };

            results
        }
        DataSourceType::Databricks => {
            let credentials: DatabricksCredentials = serde_json::from_str(&credentials_string)?;

            let databricks_client = match get_databricks_client(&credentials).await {
                Ok(databricks_client) => databricks_client,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match databricks_query(databricks_client, sql.clone()).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            results
        }
        DataSourceType::Snowflake => {
            let credentials: SnowflakeCredentials = serde_json::from_str(&credentials_string)?;

            let mut snowflake_client = match get_snowflake_client(&credentials).await {
                Ok(snowflake_client) => snowflake_client,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match snowflake_query(snowflake_client, sql.clone()).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            results
        }
    };

    Ok(results)
}
