use anyhow::{anyhow, Error};
use std::process::Child;
use tempfile::NamedTempFile;
use tiberius::{AuthMethod, Client, Config};
use tokio::net::TcpStream;
use tokio_util::compat::{Compat, TokioAsyncWriteCompatExt};

use crate::{
    credentials::SqlServerCredentials, data_source_connections::ssh_tunneling::establish_ssh_tunnel,
};

pub async fn get_sql_server_connection(
    credentials: &SqlServerCredentials,
) -> Result<
    (
        Client<Compat<TcpStream>>,
        Option<std::process::Child>,
        Option<Vec<NamedTempFile>>,
    ),
    Error,
> {
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

    let mut config = Config::new();

    config.authentication(AuthMethod::sql_server(
        credentials.username.clone(),
        credentials.password.clone(),
    ));
    config.trust_cert();
    config.database(credentials.default_database.clone());

    if let Some(local_port) = parent_local_port {
        config.host("localhost");
        config.port(local_port)
    } else {
        config.host(credentials.host.clone());
        config.port(credentials.port);
    }

    let tcp = match TcpStream::connect(config.get_addr()).await {
        Ok(tcp) => tcp,
        Err(e) => {
            tracing::error!("There was an issue while connecting to the database: {}", e);
            return Err(anyhow!(e));
        }
    };

    tcp.set_nodelay(true)?;

    let client = match Client::connect(config, tcp.compat_write()).await {
        Ok(client) => client,
        Err(e) => {
            tracing::error!("There was an issue while connecting to the database: {}", e);
            return Err(anyhow!(e));
        }
    };

    Ok((client, parent_ssh_tunnel, parent_temp_files))
}
