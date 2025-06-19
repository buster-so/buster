use std::{borrow::Cow, time::Duration};

use anyhow::{anyhow, Result};
use sqlx::{mysql::MySqlPoolOptions, MySql, Pool};
use std::process::Child;
use tempfile::NamedTempFile;
use url::form_urlencoded::byte_serialize;

use crate::credentials::MySqlCredentials;

use super::ssh_tunneling::establish_ssh_tunnel;

pub async fn get_mysql_connection(
    credentials: &MySqlCredentials,
) -> Result<(
    Pool<MySql>,
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
            credentials.port.to_string(),
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
            "mysql://{db_username}:{db_password}@localhost:{local_port}",
            db_username = url_encode(&credentials.username),
            db_password = url_encode(&credentials.password),
            local_port = local_port,
        );
    } else {
        connection_string = format!(
            "mysql://{}:{}@{}:{}",
            url_encode(&credentials.username),
            url_encode(&credentials.password),
            url_encode(&credentials.host),
            credentials.port,
        )
    }

    let mysql_pool = match MySqlPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .max_lifetime(Duration::from_secs(180))
        .idle_timeout(Duration::from_secs(180))
        .connect(connection_string.as_str())
        .await
    {
        Ok(mysql_pool) => mysql_pool,
        Err(e) => {
            tracing::error!("There was an issue while connecting to MYSQL: {}", e);
            return Err(anyhow!(e));
        }
    };

    Ok((mysql_pool, parent_ssh_tunnel, parent_temp_files))
}

fn url_encode(input: &str) -> Cow<str> {
    byte_serialize(input.as_bytes()).collect()
}
