use anyhow::{anyhow, Error};
use rand::Rng;
use std::{
    fs,
    io::Write,
    net::TcpListener,
    process::{Child, Command},
};
use tempfile::NamedTempFile;

pub fn establish_ssh_tunnel(
    ssh_private_key: String,
    jump_host: String,
    ssh_username: String,
    db_host: String,
    db_port: String,
) -> Result<(std::process::Child, u16, Vec<NamedTempFile>), Error> {
    let mut temp_ssh_key = match NamedTempFile::new() {
        Ok(f) => f,
        Err(e) => {
            tracing::error!("There was a problem while creating the temp file: {}", e);
            return Err(anyhow!(e));
        }
    };

    temp_ssh_key.write_all(ssh_private_key.as_bytes()).unwrap();

    let output = match Command::new("ssh-keyscan").arg(jump_host.clone()).output() {
        Ok(o) => o,
        Err(e) => {
            tracing::error!("There was a problem while running ssh-keyscan: {}", e);
            return Err(anyhow!(e));
        }
    };

    let output_str = String::from_utf8_lossy(&output.stdout);

    let mut temp_file = match NamedTempFile::new() {
        Ok(f) => f,
        Err(e) => {
            tracing::error!("There was a problem while creating the temp file: {}", e);
            return Err(anyhow!(e));
        }
    };

    match temp_file.write_all(output_str.as_bytes()) {
        Ok(_) => {}
        Err(e) => {
            tracing::error!("There was a problem while writing to the temp file: {}", e);
        }
    };

    let known_hosts_path = temp_file.path();

    let local_port = loop {
        let port = rand::thread_rng().gen_range(1024..=65535);
        let listener = TcpListener::bind(("localhost", port));
        if listener.is_ok() {
            break port;
        }
    };

    let ssh_tunnel = match Command::new("ssh")
        .arg("-T")
        .arg("-i")
        .arg(temp_ssh_key.path())
        .arg("-L")
        .arg(format!(
            "{local_port}:{db_host}:{db_port}",
            local_port = local_port.clone(),
            db_host = db_host.clone(),
            db_port = db_port.clone(),
        ))
        .arg("-o")
        .arg(format!("UserKnownHostsFile={}", known_hosts_path.display()))
        .arg(format!(
            "{ssh_username}@{jump_host}",
            ssh_username = ssh_username.clone(),
            jump_host = jump_host.clone(),
        ))
        .spawn()
    {
        Ok(s) => s,
        Err(e) => {
            tracing::error!("There was a problem while spawning the ssh tunnel: {}", e);
            return Err(anyhow!(e));
        }
    };

    Ok((ssh_tunnel, local_port, vec![temp_ssh_key, temp_file]))
}

pub async fn kill_ssh_tunnel(
    ssh_tunnel: &mut Child,
    temp_files: Vec<NamedTempFile>,
) -> Result<(), Error> {
    let _ = ssh_tunnel.kill();
    for file in temp_files {
        let _ = file.close();
    }

    Ok(())
}
