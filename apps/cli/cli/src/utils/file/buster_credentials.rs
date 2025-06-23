use anyhow::Result;
use dirs::home_dir;
use serde::{Deserialize, Serialize};
use tokio::fs;

use crate::{error::BusterError, utils::buster::BusterClient};

#[derive(Serialize, Deserialize, Clone)]
pub struct BusterCredentials {
    pub url: String,
    pub api_key: String,
}

impl Default for BusterCredentials {
    fn default() -> Self {
        Self {
            url: String::from("https://api2.buster.so"),
            api_key: String::from(""),
        }
    }
}

pub async fn get_buster_credentials() -> Result<BusterCredentials, BusterError> {
    let mut path = home_dir().unwrap_or_default();
    path.push(".buster");
    path.push("credentials.yml");

    let contents = match fs::read_to_string(&path).await {
        Ok(contents) => contents,
        Err(_) => return Err(BusterError::FileNotFound { path }),
    };

    let creds_yaml: BusterCredentials = match serde_yaml::from_str(&contents) {
        Ok(creds_yaml) => creds_yaml,
        Err(e) => {
            return Err(BusterError::ParseError {
                error: e.to_string(),
            })
        }
    };

    Ok(creds_yaml)
}

pub async fn delete_buster_credentials() -> Result<(), BusterError> {
    let mut path = home_dir().unwrap_or_default();
    path.push(".buster");
    path.push("credentials.yml");

    if path.exists() {
        match fs::remove_file(&path).await {
            Ok(_) => Ok(()),
            Err(e) => Err(BusterError::FileWriteError {
                path,
                error: format!("Failed to delete credentials file: {}", e),
            }),
        }
    } else {
        // It's not an error if the file doesn't exist when trying to clear
        Ok(())
    }
}

pub async fn get_and_validate_buster_credentials() -> Result<BusterCredentials, BusterError> {
    // Get the credentials.
    let creds = match get_buster_credentials().await {
        Ok(creds) => creds,
        Err(e) => return Err(e),
    };

    // Check if the API key is empty.
    if creds.api_key.is_empty() {
        return Err(BusterError::InvalidCredentials);
    }

    // Validate the API key.
    let buster_client = match BusterClient::new(creds.url.clone(), creds.api_key.clone()) {
        Ok(buster_client) => buster_client,
        Err(_) => return Err(BusterError::InvalidCredentials),
    };

    if !buster_client.validate_api_key().await? {
        return Err(BusterError::InvalidCredentials);
    }

    Ok(creds)
}

pub async fn set_buster_credentials(creds: BusterCredentials) -> Result<(), BusterError> {
    let mut path = home_dir().unwrap_or_default();
    path.push(".buster");

    // Create .buster directory if it doesn't exist
    if !path.exists() {
        fs::create_dir_all(&path)
            .await
            .map_err(|e| BusterError::FileWriteError {
                path: path.clone(),
                error: e.to_string(),
            })?;
    }

    path.push("credentials.yml");

    let contents = match serde_yaml::to_string(&creds) {
        Ok(contents) => contents,
        Err(e) => {
            return Err(BusterError::ParseError {
                error: e.to_string(),
            })
        }
    };

    match fs::write(&path, contents).await {
        Ok(_) => Ok(()),
        Err(e) => Err(BusterError::FileWriteError {
            path,
            error: e.to_string(),
        }),
    }
}
