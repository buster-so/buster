use anyhow::Result;
use colored::*;
use indicatif::{ProgressBar, ProgressStyle};
use inquire::{validator::Validation, Confirm, Password, Select, Text};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::error::Error;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

use crate::utils::{
    buster_credentials::get_and_validate_buster_credentials,
    profiles::{BigqueryCredentials, Credential, PostgresCredentials},
    BusterClient, BusterConfig, PostDataSourcesRequest,
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

pub async fn init(destination_path: Option<&str>) -> Result<()> {
    println!("{}", "Initializing Buster...".bold().green());

    // Determine the destination path for buster.yml
    let dest_path = match destination_path {
        Some(path) => PathBuf::from(path),
        None => std::env::current_dir()?,
    };

    // Ensure destination directory exists
    if !dest_path.exists() {
        fs::create_dir_all(&dest_path)?;
    }

    let config_path = dest_path.join("buster.yml");

    if config_path.exists() {
        let overwrite = Confirm::new(&format!(
            "A buster.yml file already exists at {}. Do you want to overwrite it?",
            config_path.display().to_string().cyan()
        ))
        .with_default(false)
        .prompt()?;

        if !overwrite {
            println!(
                "{}",
                "Keeping existing buster.yml file. Configuration will be skipped.".yellow()
            );
            return Ok(());
        }
    }

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
        }
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

    let db_type = Select::new("Select your database type:", db_types).prompt()?;

    println!("You selected: {}", db_type.to_string().cyan());

    match db_type {
        DatabaseType::Redshift => {
            setup_redshift(buster_creds.url, buster_creds.api_key, &config_path).await
        }
        DatabaseType::Postgres => {
            setup_postgres(buster_creds.url, buster_creds.api_key, &config_path).await
        }
        DatabaseType::BigQuery => {
            setup_bigquery(buster_creds.url, buster_creds.api_key, &config_path).await
        }
        _ => {
            println!(
                "{}",
                format!("{} support is coming soon!", db_type).yellow()
            );
            println!("Currently, only Redshift, Postgres, and BigQuery are supported.");
            Err(anyhow::anyhow!("Database type not yet implemented"))
        }
    }
}

async fn setup_redshift(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
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
                Ok(Validation::Invalid(
                    "Name must contain only alphanumeric characters, dash (-) or underscore (_)"
                        .into(),
                ))
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
        .with_validator(|input: &str| match input.parse::<u16>() {
            Ok(_) => Ok(Validation::Valid),
            Err(_) => Ok(Validation::Invalid(
                "Port must be a valid number between 1 and 65535".into(),
            )),
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
        database: database.clone(),
        schemas: schema.as_ref().map(|s| vec![s.clone()]),
    };

    // Create API request
    // Note: PostgresCredentials requires String for database and schema, not Option<String>
    // We use empty strings to represent null/all databases or schemas
    let request = PostDataSourcesRequest {
        name: name.clone(),
        env: "dev".to_string(), // Default to dev environment
        credential: Credential::Redshift(PostgresCredentials {
            host: redshift_creds.host,
            port: redshift_creds.port,
            username: redshift_creds.username,
            password: redshift_creds.password,
            database: redshift_creds.database.clone().unwrap_or_default(),
            schema: redshift_creds
                .schemas
                .clone()
                .and_then(|s| s.first().cloned())
                .unwrap_or_default(),
            jump_host: None,
            ssh_username: None,
            ssh_private_key: None,
        }),
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
            spinner.finish_with_message(
                "✓ Data source created successfully!"
                    .green()
                    .bold()
                    .to_string(),
            );
            println!(
                "\nData source '{}' is now available for use with Buster.",
                name.cyan()
            );

            // Create a copy of the values we need for the config file
            let db_copy = database.clone();
            let schema_copy = schema.clone();

            // Create buster.yml file
            create_buster_config_file(
                config_path,
                &name,
                db_copy.as_deref(),
                schema_copy.as_deref(),
            )?;

            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            println!("Please check your credentials and try again.");
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

async fn setup_postgres(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
    println!("{}", "Setting up PostgreSQL connection...".bold().green());

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
                Ok(Validation::Invalid(
                    "Name must contain only alphanumeric characters, dash (-) or underscore (_)"
                        .into(),
                ))
            }
        })
        .prompt()?;

    // Collect host
    let host = Text::new("Enter the PostgreSQL host:")
        .with_help_message("Example: localhost or db.example.com")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Host cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect port (with validation)
    let port_str = Text::new("Enter the PostgreSQL port:")
        .with_default("5432") // Default Postgres port is 5432
        .with_help_message("Default PostgreSQL port is 5432")
        .with_validator(|input: &str| match input.parse::<u16>() {
            Ok(_) => Ok(Validation::Valid),
            Err(_) => Ok(Validation::Invalid(
                "Port must be a valid number between 1 and 65535".into(),
            )),
        })
        .prompt()?;
    let port = port_str.parse::<u16>()?;

    // Collect username
    let username = Text::new("Enter the PostgreSQL username:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Username cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect password (masked)
    let password = Password::new("Enter the PostgreSQL password:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Password cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .without_confirmation()
        .prompt()?;

    // Collect database (optional)
    let database = Text::new("Enter the PostgreSQL database name (optional):")
        .with_help_message("Leave blank to access all available databases")
        .prompt()?;
    let database = if database.trim().is_empty() {
        None
    } else {
        Some(database)
    };

    // Collect schema (optional)
    let schema = Text::new("Enter the PostgreSQL schema (optional):")
        .with_help_message("Leave blank to access all available schemas")
        .with_default("public") // Default Postgres schema is usually 'public'
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

    // Create API request
    let request = PostDataSourcesRequest {
        name: name.clone(),
        env: "dev".to_string(), // Default to dev environment
        credential: Credential::Postgres(PostgresCredentials {
            host,
            port,
            username,
            password,
            database: database.clone().unwrap_or_default(),
            schema: schema.clone().unwrap_or_default(),
            jump_host: None,
            ssh_username: None,
            ssh_private_key: None,
        }),
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
            spinner.finish_with_message(
                "✓ Data source created successfully!"
                    .green()
                    .bold()
                    .to_string(),
            );
            println!(
                "\nData source '{}' is now available for use with Buster.",
                name.cyan()
            );

            // Create a copy of the values we need for the config file
            let db_copy = database.clone();
            let schema_copy = schema.clone();

            // Create buster.yml file
            create_buster_config_file(
                config_path,
                &name,
                db_copy.as_deref(),
                schema_copy.as_deref(),
            )?;

            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            println!("Please check your credentials and try again.");
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

async fn setup_bigquery(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
    println!("{}", "Setting up BigQuery connection...".bold().green());

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
                Ok(Validation::Invalid(
                    "Name must contain only alphanumeric characters, dash (-) or underscore (_)"
                        .into(),
                ))
            }
        })
        .prompt()?;

    // Collect project ID
    let project_id = Text::new("Enter the Google Cloud project ID:")
        .with_help_message("Example: my-project-123456")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Project ID cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect dataset ID (optional)
    let dataset_id = Text::new("Enter the BigQuery dataset ID (optional):")
        .with_help_message("Leave blank to access all available datasets")
        .prompt()?;
    let dataset_id = if dataset_id.trim().is_empty() {
        None
    } else {
        Some(dataset_id)
    };

    // Collect credentials JSON
    println!(
        "\n{}",
        "BigQuery requires a service account credentials JSON file.".bold()
    );
    println!(
        "You can create one in the Google Cloud Console under IAM & Admin > Service Accounts."
    );

    let credentials_path = Text::new("Enter the path to your credentials JSON file:")
        .with_help_message("Example: /path/to/credentials.json")
        .with_validator(|input: &str| {
            let path = Path::new(input);
            if !path.exists() {
                return Ok(Validation::Invalid("File does not exist".into()));
            }
            if !path.is_file() {
                return Ok(Validation::Invalid("Path is not a file".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Read credentials file
    let credentials_content = match fs::read_to_string(&credentials_path) {
        Ok(content) => content,
        Err(e) => {
            return Err(anyhow::anyhow!("Failed to read credentials file: {}", e));
        }
    };

    // Parse JSON to ensure it's valid
    let credentials_json: serde_yaml::Value = match serde_yaml::from_str(&credentials_content) {
        Ok(json) => json,
        Err(e) => {
            return Err(anyhow::anyhow!("Invalid JSON in credentials file: {}", e));
        }
    };

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Project ID: {}", project_id.cyan());

    // Display dataset ID with clear indication if it's empty
    if let Some(ds) = &dataset_id {
        println!("Dataset ID: {}", ds.cyan());
    } else {
        println!("Dataset ID: {}", "All datasets (null)".cyan());
    }

    println!("Credentials: {}", credentials_path.cyan());

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create API request
    let request = PostDataSourcesRequest {
        name: name.clone(),
        env: "dev".to_string(), // Default to dev environment
        credential: Credential::Bigquery(BigqueryCredentials {
            credentials_json,
            project_id: project_id.clone(),
            dataset_ids: dataset_id.as_ref().map(|id| vec![id.clone()]),
        }),
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
            spinner.finish_with_message(
                "✓ Data source created successfully!"
                    .green()
                    .bold()
                    .to_string(),
            );
            println!(
                "\nData source '{}' is now available for use with Buster.",
                name.cyan()
            );

            // Create buster.yml file
            create_buster_config_file(
                config_path,
                &name,
                Some(&project_id),     // Project ID maps to database
                dataset_id.as_deref(), // Dataset ID maps to schema
            )?;

            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            println!("Please check your credentials and try again.");
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

// Helper function to create buster.yml file
fn create_buster_config_file(
    path: &Path,
    data_source_name: &str,
    database: Option<&str>,
    schema: Option<&str>,
) -> Result<()> {
    let config = BusterConfig {
        data_source_name: Some(data_source_name.to_string()),
        schema: schema.map(String::from),
        database: database.map(String::from),
        exclude_files: None,
        exclude_tags: None,
    };

    let yaml = serde_yaml::to_string(&config)?;
    fs::write(path, yaml)?;

    println!(
        "{} {}",
        "✓".green(),
        format!("Created buster.yml at {}", path.display()).green()
    );

    Ok(())
}
