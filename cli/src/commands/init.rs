use anyhow::Result;
use colored::*;
use inquire::{Select, Text, Password, validator::Validation, Confirm};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::error::Error;
use indicatif::{ProgressBar, ProgressStyle};
use std::time::Duration;

use crate::utils::{
    buster_credentials::get_and_validate_buster_credentials,
    profiles::{Credential, PostgresCredentials},
    BusterClient, PostDataSourcesRequest,
};

#[derive(Debug, Clone)]
enum DatabaseType {
    Redshift,
    Postgres,
    BigQuery,
    Snowflake,
}

impl std::fmt::Display for DatabaseType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DatabaseType::Redshift => write!(f, "Redshift"),
            DatabaseType::Postgres => write!(f, "Postgres"),
            DatabaseType::BigQuery => write!(f, "BigQuery"),
            DatabaseType::Snowflake => write!(f, "Snowflake"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct RedshiftCredentials {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database: Option<String>,
    pub schemas: Option<Vec<String>>,
}

pub async fn init() -> Result<()> {
    println!("{}", "Initializing Buster...".bold().green());

    // Check for Buster credentials with progress indicator
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.green} {msg}")
            .unwrap(),
    );
    spinner.set_message("Checking for Buster credentials...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    let buster_creds = match get_and_validate_buster_credentials().await {
        Ok(creds) => {
            spinner.finish_with_message("✓ Buster credentials found".green().to_string());
            creds
        },
        Err(_) => {
            spinner.finish_with_message("✗ No valid Buster credentials found".red().to_string());
            println!("Please run {} first.", "buster auth".cyan());
            return Err(anyhow::anyhow!("No valid Buster credentials found"));
        }
    };

    // Select database type
    let db_types = vec![
        DatabaseType::Redshift,
        DatabaseType::Postgres,
        DatabaseType::BigQuery,
        DatabaseType::Snowflake,
    ];

    let db_type = Select::new(
        "Select your database type:",
        db_types,
    )
    .prompt()?;

    println!("You selected: {}", db_type.to_string().cyan());

    match db_type {
        DatabaseType::Redshift => setup_redshift(buster_creds.url, buster_creds.api_key).await,
        _ => {
            println!("{}", format!("{} support is coming soon!", db_type).yellow());
            println!("Currently, only Redshift is supported.");
            Err(anyhow::anyhow!("Database type not yet implemented"))
        }
    }
}

async fn setup_redshift(buster_url: String, buster_api_key: String) -> Result<()> {
    println!("{}", "Setting up Redshift connection...".bold().green());
    
    // Collect name (with validation)
    let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
    let name = Text::new("Enter a unique name for this data source:")
        .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed")
        .with_validator(move |input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Name cannot be empty".into()));
            }
            if name_regex.is_match(input) {
                Ok(Validation::Valid)
            } else {
                Ok(Validation::Invalid("Name must contain only alphanumeric characters, dash (-) or underscore (_)".into()))
            }
        })
        .prompt()?;

    // Collect host
    let host = Text::new("Enter the Redshift host:")
        .with_help_message("Example: my-cluster.abc123xyz789.us-west-2.redshift.amazonaws.com")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Host cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect port (with validation)
    let port_str = Text::new("Enter the Redshift port:")
        .with_default("5439")
        .with_help_message("Default Redshift port is 5439")
        .with_validator(|input: &str| {
            match input.parse::<u16>() {
                Ok(_) => Ok(Validation::Valid),
                Err(_) => Ok(Validation::Invalid("Port must be a valid number between 1 and 65535".into())),
            }
        })
        .prompt()?;
    let port = port_str.parse::<u16>()?;

    // Collect username
    let username = Text::new("Enter the Redshift username:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Username cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect password (masked)
    let password = Password::new("Enter the Redshift password:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Password cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .without_confirmation()
        .prompt()?;

    // Collect database (optional)
    let database = Text::new("Enter the Redshift database (optional):")
        .with_help_message("Leave blank to access all available databases")
        .prompt()?;
    let database = if database.trim().is_empty() {
        None
    } else {
        Some(database)
    };

    // Collect schema (optional)
    let schema = Text::new("Enter the Redshift schema (optional):")
        .with_help_message("Leave blank to access all available schemas")
        .prompt()?;
    let schema = if schema.trim().is_empty() {
        None
    } else {
        Some(schema)
    };

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    
    // Display database and schema with clear indication if they're empty
    if let Some(db) = &database {
        println!("Database: {}", db.cyan());
    } else {
        println!("Database: {}", "All databases (null)".cyan());
    }
    
    if let Some(sch) = &schema {
        println!("Schema: {}", sch.cyan());
    } else {
        println!("Schema: {}", "All schemas (null)".cyan());
    }

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create credentials
    let redshift_creds = RedshiftCredentials {
        host,
        port,
        username,
        password,
        database,
        schemas: schema.map(|s| vec![s]),
    };

    // Create API request
    // Note: PostgresCredentials requires String for database and schema, not Option<String>
    // We use empty strings to represent null/all databases or schemas
    let request = PostDataSourcesRequest {
        name: name.clone(),
        env: "dev".to_string(), // Default to dev environment
        credential: Credential::Redshift(
            PostgresCredentials {
                host: redshift_creds.host,
                port: redshift_creds.port,
                username: redshift_creds.username,
                password: redshift_creds.password,
                database: redshift_creds.database.clone().unwrap_or_default(),
                schema: redshift_creds.schemas.clone().and_then(|s| s.first().cloned()).unwrap_or_default(),
                jump_host: None,
                ssh_username: None,
                ssh_private_key: None,
            }
        ),
    };

    // Send to API with progress indicator
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.green} {msg}")
            .unwrap(),
    );
    spinner.set_message("Sending credentials to Buster API...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    let client = BusterClient::new(buster_url, buster_api_key)?;
    
    match client.post_data_sources(vec![request]).await {
        Ok(_) => {
            spinner.finish_with_message("✓ Data source created successfully!".green().bold().to_string());
            println!("\nData source '{}' is now available for use with Buster.", name.cyan());
            println!("You can now use this data source with other Buster commands.");
            Ok(())
        },
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            println!("Please check your credentials and try again.");
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}
