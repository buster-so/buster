use anyhow::{Context, Result};
use clap::Parser;
use inquire::{Password, Text};
use thiserror::Error;

use crate::utils::{
    buster_credentials::{get_buster_credentials, set_buster_credentials, BusterCredentials},
    BusterClient,
};

const DEFAULT_HOST: &str = "https://api2.buster.so";

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("URL is required")]
    MissingUrl,
    #[error("API key is required")]
    MissingApiKey,
    #[error("Invalid API key")]
    InvalidApiKey,
    #[error("Failed to validate credentials: {0}")]
    ValidationError(String),
    #[error("Failed to save credentials: {0}")]
    StorageError(String),
}

#[derive(Parser, Debug)]
#[command(about = "Authenticate with Buster API")]
pub struct AuthArgs {
    /// The Buster API host URL
    #[arg(long, env = "BUSTER_HOST")]
    pub host: Option<String>,

    /// Your Buster API key
    #[arg(long, env = "BUSTER_API_KEY")]
    pub api_key: Option<String>,

    /// Don't save credentials to disk
    #[arg(long)]
    pub no_save: bool,
}

async fn validate_credentials(url: &str, api_key: &str) -> Result<(), AuthError> {
    let buster_client = BusterClient::new(url.to_string(), api_key.to_string())
        .map_err(|e| AuthError::ValidationError(e.to_string()))?;

    if !buster_client.validate_api_key().await
        .map_err(|e| AuthError::ValidationError(e.to_string()))? {
        return Err(AuthError::InvalidApiKey);
    }

    Ok(())
}

pub async fn auth() -> Result<()> {
    let args = AuthArgs::parse();
    auth_with_args(args).await
}

pub async fn auth_with_args(args: AuthArgs) -> Result<()> {
    // Get existing credentials or create default
    let mut buster_creds = match get_buster_credentials().await {
        Ok(creds) => creds,
        Err(_) => BusterCredentials {
            url: DEFAULT_HOST.to_string(),
            api_key: String::new(),
        },
    };

    // Apply host from args or use default
    if let Some(host) = args.host {
        buster_creds.url = host;
    }

    // Apply API key from args or environment
    if let Some(api_key) = args.api_key {
        buster_creds.api_key = api_key;
    }

    // Interactive mode for missing values
    if buster_creds.url.is_empty() {
        let url_input = Text::new("Enter the URL of your Buster API")
            .with_default(DEFAULT_HOST)
            .with_help_message("Press Enter to use the default URL")
            .prompt()
            .context("Failed to get URL input")?;

        if url_input.is_empty() {
            buster_creds.url = DEFAULT_HOST.to_string();
        } else {
            buster_creds.url = url_input;
        }
    }

    if buster_creds.api_key.is_empty() {
        let obfuscated_api_key = String::from("None");

        let api_key_input = Password::new(&format!("Enter your API key [{obfuscated_api_key}]:"))
            .without_confirmation()
            .with_help_message("Your API key can be found in your Buster dashboard")
            .prompt()
            .context("Failed to get API key input")?;

        if api_key_input.is_empty() && buster_creds.api_key.is_empty() {
            return Err(AuthError::MissingApiKey.into());
        } else if !api_key_input.is_empty() {
            buster_creds.api_key = api_key_input;
        }
    }

    // Validate credentials
    validate_credentials(&buster_creds.url, &buster_creds.api_key).await?;

    // Save credentials unless --no-save is specified
    if !args.no_save {
        set_buster_credentials(buster_creds).await
            .context("Failed to save credentials")?;
        println!("Credentials saved successfully!");
    }

    println!("Authentication successful!");
    if args.no_save {
        println!("Note: Credentials were not saved due to --no-save flag");
    }

    Ok(())
}
