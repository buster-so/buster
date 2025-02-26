use std::{borrow::Cow, time::Duration};

use anyhow::{anyhow, Result};
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use std::process::Child;
use tempfile::NamedTempFile;
use url::form_urlencoded::byte_serialize;

use crate::utils::query_engine::credentials::PostgresCredentials;

use super::ssh_tunneling::establish_ssh_tunnel;

pub async fn get_postgres_connection(
    credentials: &PostgresCredentials,
) -> Result<(
    Pool<Postgres>,
    Option<std::process::Child>,
    Option<Vec<NamedTempFile>>,
)> {
    let mut parent_ssh_tunnel: Option<Child> = None;
    let mut parent_temp_files: Option<Vec<NamedTempFile>> = None;
    let mut parent_local_port: Option<u16> = None;

    if let (Some(jump_host), Some(ssh_private_key), Some(ssh_username)) = (
        credentials.jump_host.clone(),
        credentials.ssh_private_key.clone(),
        credentials.ssh_username.clone(),
    ) {
        let (ssh_tunnel, local_port, temp_files) = match establish_ssh_tunnel(
            ssh_private_key,
            jump_host,
            ssh_username,
            credentials.host.clone(),
            credentials.port.to_string().clone(),
        ) {
            Ok((ssh_tunnel, local_port, temp_files)) => (Some(ssh_tunnel), local_port, temp_files),
            Err(e) => {
                tracing::error!(
                    "There was an issue while establishing the ssh tunnel: {}",
                    e
                );
                return Err(anyhow!(e));
            }
        };

        parent_local_port = Some(local_port);
        parent_ssh_tunnel = ssh_tunnel;
        parent_temp_files = Some(temp_files);
    }

    let connection_string;

    if let Some(local_port) = parent_local_port {
        connection_string = format!(
            "postgresql://{}:{}@127.0.0.1:{}/{}",
            url_encode(&credentials.username),
            url_encode(&credentials.password),
            local_port,
            url_encode(&credentials.database.clone().unwrap_or_default())
        );
    } else {
        connection_string = format!(
            "postgresql://{}:{}@{}:{}/{}",
            url_encode(&credentials.username),
            url_encode(&credentials.password),
            url_encode(&credentials.host),
            credentials.port,
            url_encode(&credentials.database.clone().unwrap_or_default())
        )
    }

    let pg_pool = match PgPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .connect(connection_string.as_str())
        .await
    {
        Ok(pg_pool) => pg_pool,
        Err(e) => {
            tracing::error!("There was an issue while connecting to Postgres: {}", e);
            return Err(anyhow!(e));
        }
    };

    Ok((pg_pool, parent_ssh_tunnel, parent_temp_files))
}

fn url_encode(input: &str) -> Cow<str> {
    byte_serialize(input.as_bytes()).collect()
}
