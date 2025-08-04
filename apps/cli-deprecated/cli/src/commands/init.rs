use anyhow::{anyhow, Result};
use colored::*;
use glob::{glob, Pattern, PatternError};
use indicatif::{ProgressBar, ProgressStyle};
use inquire::{validator::Validation, Confirm, Password, Select, Text, MultiSelect, PasswordDisplayMode};
use once_cell::sync::Lazy;
use query_engine::credentials::{
    BigqueryCredentials, Credential, DatabricksCredentials, MySqlCredentials, PostgresCredentials,
    RedshiftCredentials, SnowflakeCredentials, SqlServerCredentials,
};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

// Import from dbt_utils for dbt catalog parsing
use dbt_utils::models::{DbtCatalog, CatalogNode, ColumnMetadata, TableMetadata, CatalogMetadata}; 
use dbt_utils::{run_dbt_docs_generate, load_and_parse_catalog}; 

// Imports for Buster specific utilities and config
use crate::utils::{
    buster::{BusterClient, PostDataSourcesRequest},
    file::buster_credentials::get_and_validate_buster_credentials,
    BusterConfig,
    ProjectContext,
};

// Yaml* structs remain here as they define the output structure for `buster init`
// and are also used by `buster generate` via `use crate::commands::init::{...}`.
// These are specific to the CLI's internal representation before becoming full semantic_layer::Model instances.

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct YamlSemanticLayerSpec {
    pub models: Vec<YamlModel>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct YamlModel {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_source_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub database: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub dimensions: Vec<YamlDimension>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub measures: Vec<YamlMeasure>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct YamlDimension {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub type_: Option<String>,
    #[serde(default, skip_serializing_if = "is_false")]
    pub searchable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct YamlMeasure {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub type_: Option<String>,
}

// Helper for serde to skip serializing default false values for bool
pub fn is_false(val: &bool) -> bool {
    !*val
}

// Helper function to determine if a SQL type should be a measure
pub fn is_measure_type(sql_type: &str) -> bool {
    let lower_sql_type = sql_type.to_lowercase();
    lower_sql_type.contains("int") || 
    lower_sql_type.contains("numeric") ||
    lower_sql_type.contains("decimal") ||
    lower_sql_type.contains("real") || 
    lower_sql_type.contains("double") ||
    lower_sql_type.contains("float") ||
    lower_sql_type.contains("money") ||
    lower_sql_type.contains("number")
}

// Helper function to normalize and unquote catalog types
pub fn normalize_catalog_type(catalog_type_value: &str) -> String {
    let trimmed_type = catalog_type_value.trim();
    if trimmed_type.starts_with('"') && trimmed_type.ends_with('"') && trimmed_type.len() > 1 {
        trimmed_type[1..trimmed_type.len() - 1].to_string()
    } else {
        trimmed_type.to_string()
    }
}

// Enum for Database Type selection (ensure only one definition, placed before use)
#[derive(Debug, Clone)]
enum DatabaseType {
    Redshift, Postgres, BigQuery, Snowflake, MySql, SqlServer, Databricks,
}
impl std::fmt::Display for DatabaseType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DatabaseType::Redshift => write!(f, "Redshift"),
            DatabaseType::Postgres => write!(f, "Postgres"),
            DatabaseType::BigQuery => write!(f, "BigQuery"),
            DatabaseType::Snowflake => write!(f, "Snowflake"),
            DatabaseType::MySql => write!(f, "MySQL/MariaDB"),
            DatabaseType::SqlServer => write!(f, "SQL Server"),
            DatabaseType::Databricks => write!(f, "Databricks"),
        }
    }
}

// --- Structs for parsing dbt_project.yml (local to init) ---
#[derive(Debug, Clone, Default, Serialize)]
pub struct DbtModelGroupConfig {
    pub schema: Option<String>,
    pub database: Option<String>,
    pub subgroups: HashMap<String, DbtModelGroupConfig>,
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    pub other_plus_configs: HashMap<String, serde_yaml::Value>,
}

impl<'de> Deserialize<'de> for DbtModelGroupConfig {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let raw_map: HashMap<String, serde_yaml::Value> = HashMap::deserialize(deserializer)?;
        let mut config = DbtModelGroupConfig::default();

        for (key, value) in raw_map {
            if key == "+schema" {
                if let Some(s) = value.as_str() {
                    config.schema = Some(s.to_string());
                } else if !value.is_null() { // Allow null schema to mean "unset"
                    return Err(serde::de::Error::custom(format!(
                        "Invalid type for '+schema', expected string or null, got {:?}",
                        value
                    )));
                }
            } else if key == "+database" {
                if let Some(s) = value.as_str() {
                    config.database = Some(s.to_string());
                } else if !value.is_null() { // Allow null database to mean "unset"
                     return Err(serde::de::Error::custom(format!(
                        "Invalid type for '+database', expected string or null, got {:?}",
                        value
                    )));
                }
            } else if key.starts_with('+') {
                config.other_plus_configs.insert(key, value);
            } else {
                // This is a potential subgroup (directory) or a model-specific config block.
                // Attempt to deserialize as DbtModelGroupConfig for recursion.
                match serde_yaml::from_value::<DbtModelGroupConfig>(value.clone()) {
                    Ok(sub_config) => {
                        config.subgroups.insert(key, sub_config);
                    }
                    Err(_e) => {
                        // This key does not represent a DbtModelGroupConfig.
                        // It could be a model file config (e.g., "my_model.sql: {enabled: false}").
                        // For buster init's purpose of schema/db hierarchy, we can often ignore these
                        // if they don't fit the recursive DbtModelGroupConfig structure.
                        // The value is preserved in `other_plus_configs` if the key started with '+',
                        // otherwise, if not a subgroup, it's effectively skipped for hierarchy.
                        // Example: `my_model.sql: {enabled: false}` -- here `my_model.sql` does not start with `+`.
                        // This means it will not be in `other_plus_configs` and if `from_value` fails, it won't be a `subgroup`.
                        // This is generally fine as `build_contexts_recursive` focuses on `subgroups`.
                    }
                }
            }
        }
        Ok(config)
    }
}

#[derive(Debug, Deserialize, Clone, Default, Serialize)]
pub struct DbtProjectModelsBlock {
    #[serde(flatten)]
    pub project_configs: HashMap<String, DbtModelGroupConfig>,
}

#[derive(Debug, Deserialize, Clone, Default, Serialize)]
pub struct DbtProjectFileContent {
    pub name: Option<String>,
    #[serde(rename = "model-paths", default = "default_model_paths")]
    pub model_paths: Vec<String>,
    #[serde(default)]
    pub models: Option<DbtProjectModelsBlock>,
}

fn default_model_paths() -> Vec<String> {
    vec!["models".to_string()]
}

// Helper function to parse dbt_project.yml if it exists
// Make this function public so it can be called from generate.rs
pub fn parse_dbt_project_file_content(base_dir: &Path) -> Result<Option<DbtProjectFileContent>> {
    let dbt_project_path = base_dir.join("dbt_project.yml");
    if dbt_project_path.exists() && dbt_project_path.is_file() {
        match fs::read_to_string(&dbt_project_path) {
            Ok(content) => {
                match serde_yaml::from_str::<DbtProjectFileContent>(&content) {
                    Ok(dbt_config) => Ok(Some(dbt_config)),
                    Err(e) => {
                        eprintln!(
                            "{}",
                            format!("⚠️ Warning: Failed to parse {}: {}. Proceeding without dbt project info for advanced config.", dbt_project_path.display(), e).yellow()
                        );
                        Ok(None)
                    }
                }
            }
            Err(e) => {
                eprintln!(
                    "{}",
                    format!(
                        "⚠️ Warning: Failed to read {}: {}. Proceeding without dbt project info for advanced config.",
                        dbt_project_path.display(),
                        e
                    )
                    .yellow()
                );
                Ok(None)
            }
        }
    } else {
        Ok(None)
    }
}

// --- Input Helper Functions ---

static NAME_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[a-zA-Z0-9_-]+$").unwrap());

fn prompt_required_text(prompt: &str, help_message: Option<&str>) -> Result<String> {
    let mut text_prompt = Text::new(prompt);
    if let Some(help) = help_message {
        text_prompt = text_prompt.with_help_message(help);
    }
    let prompt_string = prompt.to_string(); // Clone prompt
    text_prompt
        .with_validator(move |input: &str| { // Add move keyword
            if input.trim().is_empty() {
                // Use the cloned prompt_string here
                Ok(Validation::Invalid(format!("{} cannot be empty", prompt_string.replace(":", "")).into()))
            } else {
                Ok(Validation::Valid)
            }
        })
        .prompt()
        .map_err(Into::into) // Convert inquire::Error to anyhow::Error
}

fn prompt_validated_name(prompt: &str, suggested_name: Option<&str>) -> Result<String> {
    let base_help_message = "Only alphanumeric characters, dash (-) and underscore (_) allowed";
    let help_message = if let Some(s_name) = suggested_name {
        format!("{}. Hit enter to use the default ({}).", base_help_message, s_name)
    } else {
        base_help_message.to_string()
    };

    let mut name_prompt = Text::new(prompt)
        .with_help_message(&help_message);

    if let Some(s_name) = suggested_name {
        name_prompt = name_prompt.with_default(s_name);
    }

    name_prompt
        .with_validator(move |input: &str| {
            if input.trim().is_empty() {
                Ok(Validation::Invalid("Name cannot be empty".into()))
            } else if NAME_REGEX.is_match(input) {
                Ok(Validation::Valid)
            } else {
                Ok(Validation::Invalid(
                    "Name must contain only alphanumeric characters, dash (-) or underscore (_)"
                        .into(),
                ))
            }
        })
        .prompt()
        .map_err(Into::into)
}

fn prompt_password(prompt: &str) -> Result<String> {
    Password::new(prompt)
        .with_display_mode(PasswordDisplayMode::Masked)
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                Ok(Validation::Invalid("Password cannot be empty".into()))
            } else {
                Ok(Validation::Valid)
            }
        })
        .without_confirmation()
        .prompt()
        .map_err(Into::into)
}

fn prompt_u16_with_default(prompt: &str, default: &str, help_message: Option<&str>) -> Result<u16> {
    let mut port_prompt = Text::new(prompt).with_default(default);
    if let Some(help) = help_message {
        port_prompt = port_prompt.with_help_message(help);
    }
    let port_str = port_prompt
        .with_validator(|input: &str| match input.parse::<u16>() {
            Ok(_) => Ok(Validation::Valid),
            Err(_) => Ok(Validation::Invalid(
                "Port must be a valid number between 1 and 65535".into(),
            )),
        })
        .prompt()?;
    port_str.parse::<u16>().map_err(Into::into) // Convert parse error
}

// --- End Input Helper Functions ---
// 
// --- API Interaction Helper ---

async fn create_data_source_with_progress(
    client: &BusterClient,
    request: PostDataSourcesRequest,
    data_source_name: &str,
) -> Result<()> {
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.green} {msg}")
            .unwrap(),
    );
    spinner.set_message(format!("Sending credentials for '{}' to Buster API...", data_source_name));
    spinner.enable_steady_tick(Duration::from_millis(100));

    match client.post_data_sources(request).await {
        Ok(_) => {
            spinner.finish_with_message(
                format!("✅ Data source '{}' created successfully!", data_source_name)
                    .green()
                    .bold()
                    .to_string(),
            );
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message(format!("❌ Failed to create data source '{}'", data_source_name).red().bold().to_string());
            let error_message = e.to_string();
            println!("\nError: {}", error_message);
            // Check for the specific error string
            if error_message.contains("Data source already exists") {
                println!("{}", "ℹ️ A data source with this name already exists in Buster.".yellow());
            } else {
                 // Keep the generic message for other errors
                println!("Please check your credentials and network connection, then try again.");
            }
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

// --- End API Interaction Helper ---

pub async fn init(destination_path: Option<&str>) -> Result<()> {
    println!("{}\n", "🚀 Initializing Buster...".bold().green());

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
            spinner.finish_and_clear();
            println!("{}", "✅ Buster credentials found and validated.".green().to_string());
            creds
        }
        Err(_) => {
            spinner.finish_and_clear();
            println!("{}", "❌ No valid Buster credentials found.".red().to_string());
            println!("Please run {} first.", "buster auth".cyan());
            return Err(anyhow!("No valid Buster credentials found"));
        }
    };

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
    let mut existing_config_overwrite = false;

    if config_path.exists() {
        let overwrite = Confirm::new(&format!("A buster.yml file already exists at {}. Do you want to overwrite it?", config_path.display().to_string().cyan())).with_default(false).prompt()?;
        if !overwrite {
            println!("{}", "ℹ️ Keeping existing buster.yml file. Configuration will be skipped.".yellow());
            match BusterConfig::load(&config_path) {
                Ok(existing_cfg) => {
                    if Confirm::new("Would you like to use `dbt docs generate` and build your base yml files?").with_default(true).prompt()? {
                        let mut mutable_existing_cfg = existing_cfg.clone(); // Clone to make it mutable
                        generate_semantic_models_flow(&mut mutable_existing_cfg, &config_path, &dest_path).await?;
                    }
                    return Ok(());
                }
                Err(e) => { eprintln!("{}: {}. Proceeding to overwrite prevention message.", "⚠️ Failed to load existing buster.yml".yellow(), e); return Ok(()); }
            }
        } else { existing_config_overwrite = true; }
    }

    // --- Try to parse dbt_project.yml ---
    let dbt_project_main_name_suggestion = parse_dbt_project_file_content(&dest_path)?
        .and_then(|parsed_content| parsed_content.name);

    if let Some(name) = &dbt_project_main_name_suggestion {
        println!(
            "\n{}\n",
            format!(
                "ℹ️  dbt_project.yml found ({}). Will use settings for defaults.",
                name.cyan()
            )
            .dimmed()
        );
    }
    // --- End dbt_project.yml parsing ---

    // Select database type
    // Sort database types alphabetically by display name
    let mut db_types = vec![
        DatabaseType::Redshift,
        DatabaseType::Postgres,
        DatabaseType::BigQuery,
        DatabaseType::Snowflake,
        DatabaseType::MySql,
        DatabaseType::SqlServer,
        DatabaseType::Databricks,
    ];
    db_types.sort_by_key(|db: &DatabaseType| db.to_string()); // Added type annotation for |db|

    let db_type = Select::new("Select your database type:", db_types).prompt()?;

    // --- Database specific setup --- (This section largely remains the same)
    // It will eventually call create_buster_config_file internally or return data for it.
    // For brevity, assuming it populates necessary details for BusterConfig.

    // Placeholder for the result of database setup, which should include
    // the data_source_name, database_name, and schema_name needed for BusterConfig.
    // In a real scenario, these would be returned by the setup_X functions.
    let (data_source_name_for_config, db_name_for_config, schema_name_for_config_opt) = match db_type {
        DatabaseType::Redshift => {
            setup_redshift(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::Postgres => {
            setup_postgres(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::BigQuery => {
            setup_bigquery(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::MySql => {
            setup_mysql(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::SqlServer => {
            setup_sqlserver(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::Databricks => {
            setup_databricks(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::Snowflake => {
            setup_snowflake(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
    };

    // Create buster.yml using the gathered information
    create_buster_config_file(
        &config_path,
        &data_source_name_for_config,
        &db_name_for_config,
        schema_name_for_config_opt.as_deref(),
    )?;
    
    // If we overwrote, or if the file didn't exist, buster.yml was just created by one of the setup_X functions.
    // Now, load it to potentially add semantic_models_file.
    let mut current_buster_config = BusterConfig::load(&config_path).map_err(|e| {
        anyhow!("❌ Failed to load buster.yml (path: {}): {}", config_path.display(), e)
    })?;

    // Default directory for semantic models: "" for side-by-side
    let default_semantic_models_dirs_str = current_buster_config.projects.as_ref()
        .and_then(|projs| projs.first())
        .and_then(|proj| proj.semantic_model_paths.as_ref())
        .filter(|paths| !paths.is_empty()) // Only join if paths exist and are not empty
        .map(|paths| paths.join(","))
        .unwrap_or_else(String::new); // Default to empty string for side-by-side

    let semantic_models_dirs_input_str = Text::new("Enter directory/directories for generated semantic model YAML files (comma-separated, leave empty for side-by-side with SQL files):")
        .with_default(&default_semantic_models_dirs_str)
        .with_help_message("Example: ./semantic_layer (for dedicated dir) or empty (for side-by-side)")
        .prompt()?;

    // --- Semantic Model Generation --- 
    if Confirm::new("Would you like to use `dbt docs generate` and build your base yml files?")
        .with_default(true)
        .prompt()? 
    {
        // The original code for defining default_semantic_models_dirs_str and 
        // prompting for semantic_models_dirs_input_str has been moved above.
        // Now we use the semantic_models_dirs_input_str that was already prompted.
        let semantic_model_paths_vec = semantic_models_dirs_input_str
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect::<Vec<String>>();

        // If semantic_model_paths_vec is empty, it implies side-by-side generation.
        // No error here, this is a valid configuration.

        if !semantic_model_paths_vec.is_empty() {
            // Only create primary output directory if a specific path is given (not side-by-side)
            let primary_semantic_models_dir_str = semantic_model_paths_vec.first().unwrap().clone(); // Must exist due to !is_empty()
            let primary_semantic_output_dir_abs = dest_path.join(&primary_semantic_models_dir_str);
            fs::create_dir_all(&primary_semantic_output_dir_abs).map_err(|e| {
                anyhow!("Failed to create primary directory for semantic models YAML '{}': {}", primary_semantic_output_dir_abs.display(), e)
            })?;
            println!("{} {}", "✅".green(), format!("Ensured primary semantic model directory exists: {}", primary_semantic_output_dir_abs.display()).dimmed());
        } else {
            println!("{}", "ℹ️ Semantic models will be generated side-by-side with their SQL counterparts.".dimmed());
        }


        // Store relative paths in the config, normalizing them.
        // Relative paths are assumed to be relative to dest_path.
        // Absolute paths are made relative to dest_path if possible.
        let relative_semantic_model_paths = semantic_model_paths_vec.iter().map(|p_str| {
            let p_path = PathBuf::from(p_str);
            if p_path.is_relative() {
                // Normalize relative paths (e.g., "./foo" to "foo", "foo/./bar" to "foo/bar")
                // This does not require filesystem access.
                let normalized_relative_path = p_path.components().collect::<PathBuf>();
                normalized_relative_path.to_string_lossy().into_owned()
            } else {
                // For absolute paths, try to make them relative to dest_path.
                // This relies on pathdiff and its canonicalization (which needs FS access).
                match pathdiff::diff_paths(&p_path, &dest_path) {
                    Some(relative_version_of_absolute_path) => {
                        relative_version_of_absolute_path.to_string_lossy().into_owned()
                    }
                    None => {
                        eprintln!(
                            "{}",
                            format!(
                                "⚠️ Could not make absolute path '{}' relative to project root '{}', or path does not exist. Using path as is.",
                                p_path.display(), dest_path.display()
                            ).yellow()
                        );
                        p_str.clone() // Fallback to using the original absolute string
                    }
                }
            }
        }).collect::<Vec<String>>();

        // Store in the first project context
        if let Some(projects) = current_buster_config.projects.as_mut() {
            if let Some(first_project) = projects.first_mut() {
                first_project.semantic_model_paths = Some(relative_semantic_model_paths.clone());
            } else {
                eprintln!("{}", "⚠️ Warning: No project contexts found in buster.yml to store semantic_model_paths.".yellow());
            }
        } else {
             eprintln!("{}", "⚠️ Warning: 'projects' array is None in buster.yml. Cannot store semantic_model_paths.".yellow());
        }
        
        current_buster_config.save(&config_path).map_err(|e| anyhow!("Failed to save buster.yml with semantic model paths: {}", e))?;
        println!("{} {} {}: {}", "✅".green(), "Updated buster.yml with".green(), "semantic_model_paths".cyan(), relative_semantic_model_paths.join(", ").cyan());

        generate_semantic_models_from_dbt_catalog(&current_buster_config, &config_path, &dest_path).await?;
    }

    println!("\n{}\n", "✨ Buster initialization complete! ✨".bold().green());
    Ok(())
}

// Helper function to manage the flow of semantic model generation
async fn generate_semantic_models_flow(buster_config: &mut BusterConfig, config_path: &Path, buster_config_dir: &Path) -> Result<()> {
    let default_dirs_str = String::new(); // Default to empty string for side-by-side

    // Try to get defaults from the first project context's semantic_model_paths
    let initial_dirs_str = buster_config.projects.as_ref()
        .and_then(|projs| projs.first())
        .and_then(|proj| proj.semantic_model_paths.as_ref())
        .filter(|paths| !paths.is_empty()) // Only join if paths exist and are not empty
        .map(|paths| paths.join(","))
        .unwrap_or(default_dirs_str);

    let semantic_models_dirs_input_str = Text::new("Enter directory/directories for generated semantic model YAML files (comma-separated, leave empty for side-by-side):")
        .with_default(&initial_dirs_str)
        .prompt()?;
    
    let semantic_model_paths_vec = semantic_models_dirs_input_str
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect::<Vec<String>>();

    // If semantic_model_paths_vec is empty, it implies side-by-side generation.
    // No error here.

    if !semantic_model_paths_vec.is_empty() {
        let primary_semantic_models_dir_str = semantic_model_paths_vec.first().unwrap().clone(); 
        let primary_semantic_output_dir_abs = buster_config_dir.join(&primary_semantic_models_dir_str);

        // Ensure the primary output directory exists
        fs::create_dir_all(&primary_semantic_output_dir_abs).map_err(|e| {
            anyhow!("Failed to create primary directory for semantic models YAML '{}': {}", primary_semantic_output_dir_abs.display(), e)
        })?;
        println!("{} {}", "✅".green(), format!("Ensured primary semantic model directory exists: {}", primary_semantic_output_dir_abs.display()).dimmed());
    } else {
        println!("{}", "ℹ️ Semantic models will be generated side-by-side with their SQL counterparts.".dimmed());
    }
    
    // Store relative paths in the config, normalizing them.
    // Relative paths are assumed to be relative to buster_config_dir.
    // Absolute paths are made relative to buster_config_dir if possible.
    let relative_semantic_model_paths = semantic_model_paths_vec.iter().map(|p_str| {
        let p_path = PathBuf::from(p_str);
        if p_path.is_relative() {
            // Normalize relative paths (e.g., "./foo" to "foo", "foo/./bar" to "foo/bar")
            // This does not require filesystem access.
            let normalized_relative_path = p_path.components().collect::<PathBuf>();
            normalized_relative_path.to_string_lossy().into_owned()
        } else {
            // For absolute paths, try to make them relative to buster_config_dir.
            // This relies on pathdiff and its canonicalization (which needs FS access).
            match pathdiff::diff_paths(&p_path, buster_config_dir) { // Corrected to buster_config_dir
                Some(relative_version_of_absolute_path) => {
                    relative_version_of_absolute_path.to_string_lossy().into_owned()
                }
                None => {
                    eprintln!(
                        "{}",
                        format!(
                            "⚠️ Could not make absolute path '{}' relative to project root '{}', or path does not exist. Using path as is.",
                            p_path.display(), buster_config_dir.display() // Corrected to buster_config_dir
                        ).yellow()
                    );
                    p_str.clone() // Fallback to using the original absolute string
                }
            }
        }
    }).collect::<Vec<String>>();

    // Store in the first project context
    if let Some(projects) = buster_config.projects.as_mut() {
        if let Some(first_project) = projects.first_mut() {
            first_project.semantic_model_paths = Some(relative_semantic_model_paths.clone());
        } else {
            eprintln!("{}", "⚠️ Warning: No project contexts found in buster.yml to update semantic_model_paths.".yellow());
        }
    } else {
        eprintln!("{}", "⚠️ Warning: 'projects' array is None in buster.yml. Cannot update semantic_model_paths.".yellow());
    }

    buster_config.save(config_path).map_err(|e| anyhow!("Failed to save buster.yml with semantic model paths: {}", e))?;
    println!("{} {} {}: {}", "✅".green(), "Updated buster.yml with".green(), "semantic_model_paths".cyan(), relative_semantic_model_paths.join(", ").cyan());

    generate_semantic_models_from_dbt_catalog(buster_config, config_path, buster_config_dir).await
}


// Placeholder for the main logic function
async fn generate_semantic_models_from_dbt_catalog(
    buster_config: &BusterConfig,
    _config_path: &Path, // Path to buster.yml
    buster_config_dir: &Path, // Directory containing buster.yml, assumed dbt project root
) -> Result<()> {
    println!("\n{}", "⚙️  Generating semantic models from dbt catalog...".dimmed());

    // --- 1. Load Catalog & Build Lookup Map ---
    // The user has already confirmed they want to run `dbt docs generate` in the calling function (init or generate_semantic_models_flow).
    println!("{}", "ℹ️ Attempting to refresh dbt catalog (catalog.json) by running 'dbt docs generate'...".dimmed());
    match run_dbt_docs_generate(buster_config_dir).await {
        Ok(_) => {
            println!("{}", "✅ 'dbt docs generate' completed successfully.".green());
        }
        Err(e) => {
            eprintln!("{}", format!("⚠️ 'dbt docs generate' failed: {}. Proceeding with existing catalog if available.", e).yellow());
        }
    }
    let catalog_json_path = buster_config_dir.join("target").join("catalog.json");

    if !catalog_json_path.exists() {
        eprintln!("{}", format!("❌ catalog.json not found at {}. Cannot generate models.", catalog_json_path.display()).red());
        return Ok(());
    }
    
    let dbt_catalog = match load_and_parse_catalog(&catalog_json_path) {
        Ok(catalog) => {
            println!("{}", "✅ Successfully parsed catalog.json.".green());
            catalog
        }
        Err(e) => {
            eprintln!("{}", format!("❌ Error loading/parsing catalog.json: {}. Cannot generate models.", e).red());
            return Ok(()); 
        }
    };

    // Build lookup map: Keyed by derived_model_name_from_file (which should be metadata.name)
    // We filter for nodes that have a derived_model_name_from_file and are models.
    let catalog_nodes_by_name: HashMap<String, &CatalogNode> = dbt_catalog.nodes.values()
        .filter_map(|node| {
            if node.derived_resource_type.as_deref() == Some("model") {
                node.derived_model_name_from_file.as_ref().map(|name| (name.clone(), node))
            } else {
                None
            }
        })
        .collect();
    
    if catalog_nodes_by_name.is_empty() {
        println!("{}", "ℹ️ No models found in the dbt catalog after parsing. Nothing to generate.".yellow());
        return Ok(());
    }

    // --- 2. Determine SQL Files to Process ---
    let mut sql_files_to_process: HashSet<PathBuf> = HashSet::new();
    let mut processed_via_buster_yml_paths = false; // Renamed for clarity

    if let Some(projects) = &buster_config.projects {
        if let Some(first_project) = projects.first() {
            if let Some(config_model_paths) = &first_project.model_paths { // These are Vec<String> from buster.yml
                if !config_model_paths.is_empty() { // Check if there are paths to process
                    println!("{}", format!("🔍 Scanning for SQL files based on model_paths in buster.yml: {:?}", config_model_paths).dimmed());
                    for path_entry_from_config in config_model_paths {
                        if path_entry_from_config.trim().is_empty() {
                            continue; // Skip empty path strings
                        }
                        let final_glob_pattern_str: String;
                        let path_is_absolute = Path::new(path_entry_from_config).is_absolute();
                        
                        // Construct the base path correctly whether path_entry_from_config is absolute or relative
                        let base_path_for_glob = if path_is_absolute {
                            PathBuf::from(path_entry_from_config)
                        } else {
                            buster_config_dir.join(path_entry_from_config)
                        };

                        // Check if path_entry_from_config (the original string) itself is a glob or just a directory
                        if path_entry_from_config.contains('*') || path_entry_from_config.contains('?') || path_entry_from_config.contains('[') {
                            // It's already a glob. If relative, it's joined with buster_config_dir. If absolute, it's used as is.
                            final_glob_pattern_str = base_path_for_glob.to_string_lossy().into_owned();
                        } else {
                            // It's a directory, append '/**/*.sql'
                            final_glob_pattern_str = base_path_for_glob.join("**/*.sql").to_string_lossy().into_owned();
                        }
                        
                        match glob::glob(&final_glob_pattern_str) {
                            Ok(paths) => {
                                for entry in paths {
                                    match entry {
                                        Ok(path) => {
                                            if path.is_file() && path.extension().map_or(false, |ext| ext == "sql") {
                                                sql_files_to_process.insert(path);
                                            }
                                        }
                                        Err(e) => eprintln!("{}", format!("Error processing entry from glob path '{}': {}", final_glob_pattern_str, e).yellow()),
                                    }
                                }
                            }
                            Err(e) => eprintln!("{}", format!("Glob pattern error for '{}': {}", final_glob_pattern_str, e).yellow()),
                        }
                    }
                    // If config_model_paths had at least one non-empty string, consider buster.yml paths as processed.
                    if config_model_paths.iter().any(|s| !s.trim().is_empty()) {
                        processed_via_buster_yml_paths = true;
                    }
                }
            }
        }
    }

    if !processed_via_buster_yml_paths {
        println!("{}", "ℹ️ No model_paths in buster.yml, they were empty, or no specific paths configured. Using dbt_project.yml model-paths as fallback.".dimmed());
        let dbt_project_content = parse_dbt_project_file_content(buster_config_dir)?;
        let dbt_model_source_roots = dbt_project_content.as_ref()
            .map(|content| content.model_paths.iter().map(PathBuf::from).collect::<Vec<PathBuf>>())
            .unwrap_or_else(|| vec![PathBuf::from("models")]);

        for dbt_source_root_rel in dbt_model_source_roots {
            let dbt_source_root_abs = buster_config_dir.join(dbt_source_root_rel);
            let glob_pattern = dbt_source_root_abs.join("**/*.sql");
            match glob::glob(&glob_pattern.to_string_lossy()) {
                Ok(paths) => {
                    for entry in paths {
                        match entry {
                            Ok(path) => if path.is_file() {
                                sql_files_to_process.insert(path);
                            }
                            Err(e) => eprintln!("{}", format!("Error processing glob path from dbt_project.yml: {}", e).yellow()),
                        }
                    }
                }
                Err(e) => eprintln!("{}", format!("Glob pattern error for dbt_project.yml path '{}': {}", glob_pattern.display(), e).yellow()),
            }
        }
    }

    if sql_files_to_process.is_empty() {
        println!("{}", "No SQL model files found based on configuration. Nothing to generate.".yellow());
        return Ok(());
    }
    println!("{}", format!("ℹ️ Found {} SQL model file(s) to process.", sql_files_to_process.len()).dimmed());

    // --- 3. Determine Output Configuration (Side-by-side or Dedicated Dir) ---
    let project_semantic_model_paths_config = buster_config.projects.as_ref()
        .and_then(|projs| projs.first())
        .and_then(|proj| proj.semantic_model_paths.as_ref());
    let is_side_by_side_generation = project_semantic_model_paths_config.map_or(true, |paths| paths.is_empty());
    let primary_dedicated_output_dir: Option<PathBuf> = if is_side_by_side_generation { None } 
        else { 
            project_semantic_model_paths_config.and_then(|paths| paths.first()).map(|p_str| buster_config_dir.join(p_str))
        };
    
    if is_side_by_side_generation {
        println!("{}", "ℹ️ Semantic models will be generated side-by-side with their SQL counterparts.".dimmed());
    } else if let Some(ref out_dir) = primary_dedicated_output_dir {
        println!("{}", format!("ℹ️ Semantic models will be generated in/under: {}", out_dir.display()).dimmed());
        fs::create_dir_all(out_dir).map_err(|e| anyhow!("Failed to create semantic models output dir '{}': {}", out_dir.display(), e))?;
    } else {
        // This case (not side-by-side but no primary_dedicated_output_dir) should ideally not happen if config is valid.
        // Defaulting to side-by-side for safety, though this indicates a potential config issue handled earlier in init.
        println!("{}", "⚠️ Warning: Semantic model output directory not clearly configured, defaulting to side-by-side generation logic.".yellow());
    }

    // --- .dbtignore update logic for side-by-side generation ---
    if is_side_by_side_generation {
        println!("{}", "ℹ️ Side-by-side generation selected. Ensuring .dbtignore is updated...".dimmed());
        let dbtignore_path = buster_config_dir.join(".dbtignore");
        let mut dbtignore_content = match fs::read_to_string(&dbtignore_path) {
            Ok(content) => content,
            Err(_) => String::new(), // If file doesn't exist or error, start with empty
        };

        let mut patterns_to_add: HashSet<String> = HashSet::new();

        let mut model_source_dirs: Vec<String> = Vec::new();
        let mut used_buster_config_paths = false;

        if let Some(projects) = &buster_config.projects {
            if let Some(first_project) = projects.first() {
                if let Some(config_model_paths) = &first_project.model_paths {
                    if config_model_paths.iter().any(|s| !s.trim().is_empty()) {
                        model_source_dirs.extend(config_model_paths.iter().filter(|s| !s.trim().is_empty()).cloned());
                        used_buster_config_paths = true;
                    }
                }
            }
        }

        if !used_buster_config_paths {
            // Try dbt_project.yml only if buster.yml paths were not used (either not present or all empty)
            if let Ok(Some(dbt_proj_content)) = parse_dbt_project_file_content(buster_config_dir) {
                if dbt_proj_content.model_paths.iter().any(|s| !s.trim().is_empty()) {
                    model_source_dirs.extend(dbt_proj_content.model_paths.into_iter().filter(|s| !s.trim().is_empty()));
                }
            }
        }
        
        // If model_source_dirs is still empty after all checks, default to "models"
        if model_source_dirs.is_empty() {
             model_source_dirs.push("models".to_string());
             println!("{}", "ℹ️ No specific model paths found in buster.yml or dbt_project.yml for .dbtignore. Defaulting to 'models/**/*.yml'.".dimmed());
        }

        for model_dir_str in model_source_dirs {
            let normalized_model_dir = model_dir_str.trim().trim_end_matches('/');
            if normalized_model_dir.is_empty() { continue; }
            let pattern = format!("{}/**/*.yml", normalized_model_dir);
            patterns_to_add.insert(pattern);
        }

        let existing_lines: HashSet<String> = dbtignore_content
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
            
        let mut new_patterns_added_to_content = false;
        let mut temp_new_content_additions = String::new();

        for pattern in patterns_to_add {
            if !existing_lines.contains(&pattern) {
                if !temp_new_content_additions.is_empty() { // Add newline before subsequent new patterns
                    temp_new_content_additions.push('\n');
                }
                temp_new_content_additions.push_str(&pattern);
                println!("{} Adding pattern to .dbtignore: {}", "+".green(), pattern.cyan());
                new_patterns_added_to_content = true;
            } else {
                println!("{} Pattern already in .dbtignore: {}", "=".dimmed(), pattern.dimmed());
            }
        }

        if new_patterns_added_to_content {
            // Ensure existing content ends with a newline if it's not empty and we're adding more
            if !dbtignore_content.is_empty() && !dbtignore_content.ends_with('\n') {
                dbtignore_content.push('\n');
            }
            dbtignore_content.push_str(&temp_new_content_additions);
            // Ensure the final content (after additions) ends with a newline if not empty
            if !dbtignore_content.is_empty() && !dbtignore_content.ends_with('\n') {
                dbtignore_content.push('\n');
            }

            fs::write(&dbtignore_path, &dbtignore_content)
                .map_err(|e| anyhow!("Failed to write to .dbtignore at {}: {}", dbtignore_path.display(), e))?;
            println!("{} {}", "✅".green(), format!(".dbtignore updated at {}", dbtignore_path.display()).dimmed());
        } else if !dbtignore_path.exists() && dbtignore_content.is_empty() {
             println!("{}", "ℹ️ No new patterns to add and .dbtignore does not exist. Skipping .dbtignore creation.".dimmed());
        } else {
             println!("{}", "ℹ️ .dbtignore already contains the necessary patterns or no new patterns were identified. No changes made.".dimmed());
        }
    }
    // --- End .dbtignore update logic ---

    // --- 4. Iterate Through SQL Files & Generate YamlModels ---
    let mut yaml_models_generated_count = 0;
    let default_data_source_name = buster_config.projects.as_ref().and_then(|p| p.first()).and_then(|pc| pc.data_source_name.as_deref());
    let default_database = buster_config.projects.as_ref().and_then(|p| p.first()).and_then(|pc| pc.database.as_deref());
    let default_schema = buster_config.projects.as_ref().and_then(|p| p.first()).and_then(|pc| pc.schema.as_deref());
    let mut failed_models: Vec<(String, String)> = Vec::new(); // To store (path_or_name, reason)

    for sql_file_abs_path in sql_files_to_process {
        let model_name_from_filename = sql_file_abs_path.file_stem().map_or_else(
            || "".to_string(), 
            |stem| stem.to_string_lossy().into_owned()
        );

        if model_name_from_filename.is_empty() {
            let warning_msg = format!("Could not determine model name from file: {}. Skipping.", sql_file_abs_path.display());
            eprintln!("{}", format!("⚠️ Warning: {}", warning_msg).yellow());
            failed_models.push((sql_file_abs_path.display().to_string(), warning_msg));
            continue;
        }

        match catalog_nodes_by_name.get(&model_name_from_filename) {
            Some(catalog_node) => {
                let Some(ref node_metadata_opt) = catalog_node.metadata else {
                    let warning_msg = format!("Skipping model '{}' (from file {}): Missing metadata in catalog entry.", model_name_from_filename, sql_file_abs_path.display());
                    eprintln!("{}", format!("⚠️ Warning: {}", warning_msg).yellow());
                    failed_models.push((sql_file_abs_path.display().to_string(), warning_msg));
                    continue;
                };
                let node_metadata = node_metadata_opt; // Shadow to non-Option for easier access, already checked Some
                let actual_semantic_model_name = node_metadata.name.clone(); 

                let mut dimensions: Vec<YamlDimension> = Vec::new();
                let mut measures: Vec<YamlMeasure> = Vec::new();

                for (_col_name, col_meta) in &catalog_node.columns { // col_meta is &ColumnMetadata
                    if is_measure_type(&col_meta.type_) { 
                        measures.push(YamlMeasure {
                            name: col_meta.name.clone(),
                            description: col_meta.comment.as_ref().filter(|s| !s.is_empty()).cloned().or_else(|| Some("Description missing - please update.".to_string())),
                            type_: Some(col_meta.type_.clone()),
                        });
                    } else {
                        dimensions.push(YamlDimension {
                            name: col_meta.name.clone(),
                            description: col_meta.comment.as_ref().filter(|s| !s.is_empty()).cloned().or_else(|| Some("Description missing - please update.".to_string())),
                            type_: Some(col_meta.type_.clone()),
                            searchable: false,
                            options: None,
                        });
                    }
                }
                
                let relative_sql_file_path_str = pathdiff::diff_paths(&sql_file_abs_path, buster_config_dir)
                    .map(|p| p.to_string_lossy().into_owned())
                    .unwrap_or_else(|| sql_file_abs_path.to_string_lossy().into_owned());

                let yaml_database = node_metadata.database.as_ref()
                    .filter(|catalog_db_val_str_ref| default_database != Some(catalog_db_val_str_ref.as_str()))
                    .cloned();

                let model_schema_from_catalog = &node_metadata.schema; 
                let yaml_schema = if default_schema.as_deref() == Some(model_schema_from_catalog.as_str()) {
                    None
                } else {
                    Some(model_schema_from_catalog.clone())
                };

                let yaml_model = YamlModel {
                    name: actual_semantic_model_name.clone(), 
                    description: node_metadata.comment.clone(),
                    data_source_name: None, 
                    database: yaml_database,
                    schema: yaml_schema,
                    dimensions,
                    measures,
                };

                let output_yaml_path: PathBuf;
                if is_side_by_side_generation {
                    output_yaml_path = sql_file_abs_path.with_extension("yml");
                } else if let Some(ref dedicated_dir) = primary_dedicated_output_dir {
                    let final_sub_path_for_yaml = 
                        if sql_file_abs_path.starts_with(dedicated_dir) {
                            // Case: SQL file is AT or UNDER the dedicated_dir.
                            // Example: dedicated_dir = /proj/models/mart
                            //          sql_file_abs_path = /proj/models/mart/sub/file.sql
                            // We want final_sub_path_for_yaml = sub/file.yml (path relative to dedicated_dir)
                            sql_file_abs_path.strip_prefix(dedicated_dir)
                                .unwrap() // Should not fail due to starts_with check
                                .with_extension("yml")
                        } else {
                            // Case: SQL file is ELSEWHERE, and dedicated_dir is a separate output target.
                            // Example: dedicated_dir = /proj/semantic_output
                            //          sql_file_abs_path = /proj/models/mart/file.sql
                            // We want final_sub_path_for_yaml = mart/file.yml (relative to its dbt model root)
                            
                            let dbt_model_source_roots_for_stripping = match parse_dbt_project_file_content(buster_config_dir) {
                                Ok(Some(c)) => c.model_paths.iter().map(PathBuf::from).collect::<Vec<PathBuf>>(),
                                _ => vec![PathBuf::from("models")],
                            };
                            
                            let mut stripped_relative_to_dbt_root: Option<PathBuf> = None;
                            for dbt_root_rel in &dbt_model_source_roots_for_stripping {
                                let abs_dbt_model_root = buster_config_dir.join(dbt_root_rel);
                                if let Ok(stripped) = sql_file_abs_path.strip_prefix(&abs_dbt_model_root) {
                                    stripped_relative_to_dbt_root = Some(stripped.with_extension("yml"));
                                    break;
                                }
                            }
                            stripped_relative_to_dbt_root.unwrap_or_else(|| 
                                PathBuf::from(&model_name_from_filename).with_extension("yml") // Fallback to flat file name
                            )
                        };
                    
                    output_yaml_path = dedicated_dir.join(final_sub_path_for_yaml);

                } else { 
                    // This case (not side-by-side but no primary_dedicated_output_dir) should ideally not happen if config is valid.
                    // Defaulting to side-by-side for safety, though this indicates a potential config issue handled earlier in init.
                    output_yaml_path = sql_file_abs_path.with_extension("yml"); 
                }

                if let Some(parent_dir) = output_yaml_path.parent() {
                    if let Err(e) = fs::create_dir_all(parent_dir) {
                        let error_msg = format!("Failed to create dir '{}': {}", parent_dir.display(), e);
                        eprintln!("{}", format!("❌ Error: {}", error_msg).red());
                        failed_models.push((actual_semantic_model_name, error_msg));
                        continue;
                    }
                }
                
                match serde_yaml::to_string(&yaml_model) {
                    Ok(yaml_string) => {
                        if let Err(e) = fs::write(&output_yaml_path, yaml_string) {
                            let error_msg = format!("Failed to write YAML file '{}': {}", output_yaml_path.display(), e);
                            eprintln!("{}", format!("❌ Error: {}", error_msg).red());
                            failed_models.push((actual_semantic_model_name, error_msg));
                        } else {
                            yaml_models_generated_count += 1;
                        }
                    }
                    Err(e) => {
                        let error_msg = format!("Failed to serialize model '{}' to YAML: {}", actual_semantic_model_name, e);
                        eprintln!("{}", format!("❌ Error: {}", error_msg).red());
                        failed_models.push((actual_semantic_model_name, error_msg));
                    }
                }
            }
            None => {
                let warning_msg = format!("SQL model file '{}' (model name: '{}') found, but no corresponding entry in dbt catalog. Skipping.", sql_file_abs_path.display(), model_name_from_filename);
                eprintln!("{}", format!("⚠️ Warning: {}", warning_msg).yellow());
                failed_models.push((sql_file_abs_path.display().to_string(), warning_msg));
            }
        }
    }

    println!(); // Add a blank line for spacing before the summary
    if yaml_models_generated_count > 0 {
        println!("{}", format!("🎉 Successfully generated {} semantic model YAML file(s).", yaml_models_generated_count).bold().green());
    } else {
        println!("{}", "ℹ️ No semantic model YAML files were successfully generated.".yellow());
    }

    if !failed_models.is_empty() {
        println!("{}", format!("❌ Encountered issues with {} model(s):", failed_models.len()).bold().red());
        for (name_or_path, reason) in failed_models {
            println!("   - {}: {}", name_or_path.cyan(), reason.yellow());
        }
    }

    Ok(())
}

// Helper function to suggest model paths from dbt_project.yml
fn suggest_model_paths_from_dbt(buster_config_dir: &Path) -> (Option<String>, String) {
    let mut suggested_model_paths_str = "".to_string();
    let mut log_message = "".to_string();

    let dbt_project_path = buster_config_dir.join("dbt_project.yml");
    if dbt_project_path.exists() && dbt_project_path.is_file() {
        match fs::read_to_string(&dbt_project_path) {
            Ok(content) => match serde_yaml::from_str::<DbtProjectFileContent>(&content) {
                Ok(dbt_config) => {
                    let paths_to_suggest = dbt_config.model_paths.clone();
                    if !paths_to_suggest.is_empty() {
                        suggested_model_paths_str = paths_to_suggest.join(",");
                        log_message = format!(
                            "ℹ️ Found dbt_project.yml, suggesting model paths: {}",
                            suggested_model_paths_str.cyan()
                        );
                    }
                }
                Err(e) => {
                    log_message = format!(
                            "⚠️ Warning: Failed to parse {}: {}. Proceeding without suggested model paths.",
                            dbt_project_path.display(), e
                        );
                }
            },
            Err(e) => {
                log_message = format!(
                    "⚠️ Warning: Failed to read {}: {}. Proceeding without suggested model paths.",
                    dbt_project_path.display(),
                    e
                );
            }
        }
    }
    (Some(suggested_model_paths_str), log_message)
}

// Helper function to create buster.yml file
fn create_buster_config_file(
    path: &Path,
    data_source_name_cli: &str,
    database_cli: &str,
    schema_cli: Option<&str>,
) -> Result<()> {
    let buster_config_dir = path.parent().unwrap_or_else(|| Path::new("."));
    let dbt_project_content_opt = parse_dbt_project_file_content(buster_config_dir).ok().flatten();

    let mut project_contexts: Vec<ProjectContext> = Vec::new();

    if let Some(dbt_content) = &dbt_project_content_opt {
        if let Some(models_block) = &dbt_content.models {
            let mut potential_contexts_info: Vec<DbtDerivedContextInfo> = Vec::new();
            for (dbt_project_key, top_level_dbt_config) in &models_block.project_configs {
                collect_potential_dbt_contexts_recursive(
                    &mut potential_contexts_info,
                    top_level_dbt_config,
                    Vec::new(), // current_config_path_segments
                    &dbt_content.model_paths, // base_dbt_model_paths from dbt_project.yml
                    dbt_project_key, // dbt_project_name_in_config e.g. "adventure_works"
                    database_cli, // top_level_database_cli_default
                    schema_cli,   // top_level_schema_cli_default
                    None, // parent_dbt_database
                    None, // parent_dbt_schema
                );
            }

            // --- MODIFIED SECTION FOR CUSTOM OPTION ---
            let custom_config_sentinel = "___CUSTOM_BUSTER_CONFIG___".to_string();
            let custom_option_display_name = "Custom Manual Configuration".to_string();
            let custom_context_option = DbtDerivedContextInfo {
                display_name: custom_option_display_name.clone(),
                config_path_segments: vec![custom_config_sentinel.clone()],
                derived_model_paths: Vec::new(),
                effective_schema: None,
                effective_database: String::new(), // Not used for custom
                dbt_project_name_in_config: custom_config_sentinel.clone(),
            };

            let mut options_for_multiselect = potential_contexts_info.clone(); // Clone original dbt contexts
            options_for_multiselect.sort_by(|a, b| a.display_name.cmp(&b.display_name)); // Sort dbt contexts
            options_for_multiselect.push(custom_context_option.clone()); // Add custom option

            if !potential_contexts_info.is_empty() {
                println!("\n\n{}\n", "ℹ️ Found potential model configurations in dbt_project.yml (plus a 'Custom' option):".dimmed());
            } else {
                println!("\n\n{}", "ℹ️ No specific dbt model configurations found. You can choose 'Custom Manual Configuration'.".dimmed());
            }

            let selected_options_result = MultiSelect::new(
                "Select the paths to your models in your dbt project that you want to create semantic models for:",
                options_for_multiselect,
            )
            .with_help_message("Use space to select, enter to confirm. 'Custom Manual Configuration' bypasses dbt-derived contexts for manual path entry.")
            .prompt();

            match selected_options_result {
                Ok(selected_items) => {
                    let is_custom_selected = selected_items.iter().any(|item| item.dbt_project_name_in_config == custom_config_sentinel);

                    if is_custom_selected {
                        println!("{}", "Custom Manual Configuration selected. Proceeding with manual model path configuration...".yellow());
                        // project_contexts remains empty, which triggers manual setup later
                    } else {
                        // Custom not selected, so process any actual dbt contexts that were chosen.
                        // If selected_items is empty here, project_contexts will also remain empty.
                        for dbt_info in selected_items {
                            // This check is technically redundant if is_custom_selected is false,
                            // but kept for safety in case logic evolves.
                            if dbt_info.dbt_project_name_in_config == custom_config_sentinel {
                                continue;
                            }
                            project_contexts.push(ProjectContext {
                                name: None, // User wants None
                                data_source_name: Some(data_source_name_cli.to_string()),
                                database: Some(dbt_info.effective_database.clone()),
                                schema: dbt_info.effective_schema.clone(),
                                model_paths: Some(dbt_info.derived_model_paths.clone()),
                                exclude_files: None,
                                exclude_tags: None,
                                // semantic_model_paths will also use these specific dirs for side-by-side
                                semantic_model_paths: Some(dbt_info.derived_model_paths),
                            });
                        }
                        // If project_contexts is still empty at this point (e.g., user deselected all dbt options
                        // or only custom was available and not picked), the later check `if project_contexts.is_empty()`
                        // will correctly lead to manual configuration.
                        if project_contexts.is_empty() && !is_custom_selected && !potential_contexts_info.is_empty() {
                            println!("{}", "No dbt configurations selected. Proceeding with manual model path configuration.".yellow());
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Error during dbt configuration selection: {}. Proceeding with manual setup.", e);
                    // project_contexts remains empty by default
                }
            }
            // --- END MODIFIED SECTION ---
        }
    }


    if project_contexts.is_empty() {
        println!("\n{}", "ℹ️ No dbt-derived project contexts created. Proceeding with manual model path configuration...".yellow());
        
        let mut suggested_model_paths_str = "models".to_string();
        if let Some(dbt_content) = parse_dbt_project_file_content(buster_config_dir).ok().flatten() {
            if !dbt_content.model_paths.is_empty() && dbt_content.model_paths != vec!["models"] {
                 suggested_model_paths_str = dbt_content.model_paths.join(",");
                 println!("\n{}", format!("ℹ️ Suggesting model paths from dbt_project.yml global model-paths: {}", suggested_model_paths_str.cyan()).dimmed());
            }
        }

        let model_paths_input = Text::new("Enter paths to your dbt models (comma-separated):")
            .with_default(&suggested_model_paths_str)
            .with_help_message("Example: `models`, `models/mart`, or `models` (relative to dbt project root)")
            .prompt()?;

        let model_paths_vec_option = if model_paths_input.trim().is_empty() {
            None
        } else {
            Some(
                model_paths_input
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .map(|s| { 
                        let p = Path::new(&s);
                        if p.is_absolute() {
                            eprintln!("{}", format!("⚠️ Warning: Absolute path '{}' provided for models. Consider using relative paths from your project root.", s).yellow());
                            s
                        } else {
                            s
                        }
                    })
                    .collect::<Vec<String>>(),
            )
        };
        
        let _main_context_name = if let Some(dbt_proj_name) = parse_dbt_project_file_content(buster_config_dir).ok().flatten().and_then(|p| p.name) {
            format!("{}_default_config", dbt_proj_name)
        } else {
            "DefaultProject".to_string()
        };

        project_contexts.push(ProjectContext {
            name: None,
            data_source_name: Some(data_source_name_cli.to_string()),
            database: Some(database_cli.to_string()),
            schema: schema_cli.map(str::to_string),
            model_paths: model_paths_vec_option.clone(),
            exclude_files: None,
            exclude_tags: None,
            semantic_model_paths: model_paths_vec_option, // Use same paths for semantic models by default
        });
    }

    let config = BusterConfig {
        data_source_name: None, // Top-level fields are for fallback or specific global settings not tied to projects
        schema: None,
        database: None,
        exclude_files: None,
        exclude_tags: None,
        model_paths: None, // This top-level field is superseded by 'projects'
        projects: Some(project_contexts),
        semantic_model_paths: None,
    };

    config.save(path)?;
    println!(
        "{} {}",
        "✅".green(),
        format!("Created buster.yml at {}", path.display()).green()
    );

    Ok(())
}

// Recursive helper to collect potential DbtDerivedContextInfo
#[derive(Debug, Clone)]
struct DbtDerivedContextInfo {
    display_name: String,           // e.g., "adventure_works.mart (schema: ont_ont, db: db_override)"
    config_path_segments: Vec<String>, // e.g., ["adventure_works", "mart"]
    derived_model_paths: Vec<String>, // e.g., ["models/mart", "other_models_root/mart"]
    effective_schema: Option<String>,
    effective_database: String,    // Database always has a value (CLI default if not from dbt)
    dbt_project_name_in_config: String, // e.g. "adventure_works"
}

impl std::fmt::Display for DbtDerivedContextInfo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.display_name)
    }
}

fn collect_potential_dbt_contexts_recursive(
    potential_contexts: &mut Vec<DbtDerivedContextInfo>,
    current_dbt_group_config: &DbtModelGroupConfig,
    current_config_path_segments: Vec<String>, // Segments *within* the dbt project's config, e.g., ["mart"] or ["staging", "core"]
    base_dbt_model_paths: &[String],           // From dbt_project.yml model-paths, e.g., ["models", "analysis"]
    dbt_project_name_in_config: &str,          // The key from dbt_project.yml (e.g., "adventure_works")
    top_level_database_cli_default: &str,
    top_level_schema_cli_default: Option<&str>,
    parent_dbt_database: Option<&str>, // Effective database from the parent dbt config node
    parent_dbt_schema: Option<&str>,   // Effective schema from the parent dbt config node
) {
    // Determine effective schema and database for *this* dbt config node
    let current_group_effective_database = current_dbt_group_config
        .database
        .as_deref()
        .or(parent_dbt_database)
        .unwrap_or(top_level_database_cli_default);

    let current_group_effective_schema = current_dbt_group_config
        .schema
        .as_deref()
        .or(parent_dbt_schema)
        .or(top_level_schema_cli_default);

    // Construct model paths for this specific group
    // current_config_path_segments: ["mart"] or ["staging/core"]
    // base_dbt_model_paths: ["models", "analysis_models"]
    // derived_model_paths should be: ["models/mart", "analysis_models/mart"] etc.
    let mut derived_model_paths_for_this_group: Vec<String> = Vec::new();
    if !current_config_path_segments.is_empty() { // Only create paths if we are inside a group
        for base_path_str in base_dbt_model_paths {
            let mut path_parts = vec![base_path_str.clone()];
            path_parts.extend_from_slice(&current_config_path_segments); // Add "mart" or "staging/core"
            derived_model_paths_for_this_group.push(PathBuf::from_iter(path_parts).to_string_lossy().into_owned());
        }
    } else { // This is the top-level dbt project config (e.g. "adventure_works:")
         // Use the base_dbt_model_paths directly
        derived_model_paths_for_this_group = base_dbt_model_paths.to_vec();
    }
    derived_model_paths_for_this_group.sort();
    derived_model_paths_for_this_group.dedup();


    // Decide if this node itself represents a selectable context.
    // A context is selectable if it has specific model paths (i.e., not the top-level dbt project key itself without further segments,
    // unless it's the *only* thing, or it has schema/db overrides).
    // Or, more simply: always offer a node if it could lead to models, or has overrides.
    // We will offer contexts for each level of nesting that could contain models.
    // The `display_name` helps the user understand what they are selecting.

    let mut full_display_path_segments = vec![dbt_project_name_in_config.to_string()];
    full_display_path_segments.extend_from_slice(&current_config_path_segments);
    let display_name_prefix = full_display_path_segments.join(".");

    // Add this current group as a potential context if it has model paths.
    // The top-level (current_config_path_segments.is_empty()) is also a valid context.
    if !derived_model_paths_for_this_group.is_empty() {
        let schema_display = current_group_effective_schema.unwrap_or("default (CLI)");
        let db_display = current_group_effective_database;
        let paths_display = derived_model_paths_for_this_group.join(", ");

        potential_contexts.push(DbtDerivedContextInfo {
            display_name: format!(
                "{} (schema: {}, db: {}, paths: [{}])",
                display_name_prefix.blue().bold(),
                schema_display.cyan(),
                db_display.cyan(),
                paths_display.dimmed()
            ),
            config_path_segments: full_display_path_segments.clone(),
            derived_model_paths: derived_model_paths_for_this_group.clone(),
            effective_schema: current_group_effective_schema.map(str::to_string),
            effective_database: current_group_effective_database.to_string(),
            dbt_project_name_in_config: dbt_project_name_in_config.to_string(),
        });
    }


    // Recurse for subgroups
    for (subgroup_name, subgroup_config) in &current_dbt_group_config.subgroups {
        let mut next_config_path_segments = current_config_path_segments.clone();
        next_config_path_segments.push(subgroup_name.clone());

        collect_potential_dbt_contexts_recursive(
            potential_contexts,
            subgroup_config,
            next_config_path_segments,
            base_dbt_model_paths,
            dbt_project_name_in_config, // This stays the same, it's the dbt project key
            top_level_database_cli_default,
            top_level_schema_cli_default,
            Some(current_group_effective_database), // Pass current node's effective as parent for next
            current_group_effective_schema,       // Pass current node's effective as parent for next
        );
    }
}

// --- Functions for setting up specific database types ---
// Modified to return Result<(String, String, Option<String>)> for (data_source_name, database, schema)
// They no longer write to buster.yml directly.

async fn setup_redshift(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("\n{}", "Setting up Redshift connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text(
        "Enter the Redshift host:",
        Some("Example: my-cluster.abc123xyz789.us-west-2.redshift.amazonaws.com"),
    )?;
    let port = prompt_u16_with_default(
        "Enter the Redshift port:",
        "5439",
        Some("Default Redshift port is 5439"),
    )?;
    let username = prompt_required_text("Enter the Redshift username:", None)?;
    let password = prompt_password("Enter the Redshift password:")?;
    let database = prompt_required_text("Enter the default Redshift database:", None)?;
    let schema = prompt_required_text("Enter the default Redshift schema:", None)?;

    if Confirm::new("\nConfirm the connection details and create this data source?")
        .with_default(true)
        .prompt()? 
    {
        let redshift_creds = RedshiftCredentials {
            host, port, username, password,
            default_database: database.clone(),
            default_schema: Some(schema.clone()),
        };
        let credential = Credential::Redshift(redshift_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request, &name).await?;
    } else {
        println!("{}", "ℹ️ Skipping data source creation in Buster Cloud.".yellow());
    }
    
    Ok((name, database, Some(schema)))
}

async fn setup_postgres(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up PostgreSQL connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text("Enter the PostgreSQL host:", Some("Example: localhost or db.example.com"))?;
    let port = prompt_u16_with_default("Enter the PostgreSQL port:", "5432", Some("Default PostgreSQL port is 5432"))?;
    let username = prompt_required_text("Enter the PostgreSQL username:", None)?;
    let password = prompt_password("Enter the PostgreSQL password:")?;
    let database = prompt_required_text("Enter the default PostgreSQL database name:", None)?;
    let schema = prompt_required_text("Enter the default PostgreSQL schema:", None)?;

    if Confirm::new("\nConfirm the connection details and create this data source?")
        .with_default(true)
        .prompt()? 
    {
        let postgres_creds = PostgresCredentials { host, port, username, password, default_database: database.clone(), default_schema: Some(schema.clone()), jump_host: None, ssh_username: None, ssh_private_key: None };
        let credential = Credential::Postgres(postgres_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request, &name).await?;
    } else {
        println!("{}", "ℹ️ Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, database, Some(schema)))
}

async fn setup_bigquery(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up BigQuery connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let project_id = prompt_required_text("Enter the default Google Cloud project ID:", Some("Example: my-project-123456"))?;
    let dataset_id = prompt_required_text("Enter the default BigQuery dataset ID:", None)?;
    let credentials_path_str = Text::new("Enter the path to your credentials JSON file:")
        .with_help_message("Example: /path/to/credentials.json")
        .with_validator(|input: &str| {
            let path = Path::new(input);
            if !path.exists() { Ok(Validation::Invalid("File does not exist".into())) }
            else if !path.is_file() { Ok(Validation::Invalid("Path is not a file".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;
    let credentials_content = fs::read_to_string(&credentials_path_str).map_err(|e| anyhow!("Failed to read credentials file '{}': {}", credentials_path_str, e))?;
    let credentials_json: serde_json::Value = serde_json::from_str(&credentials_content).map_err(|e| anyhow!("Invalid JSON in credentials file '{}': {}", credentials_path_str, e))?;
    
    if Confirm::new("\nConfirm the connection details and create this data source?")
        .with_default(true)
        .prompt()? 
    {
        let bigquery_creds = BigqueryCredentials { default_project_id: project_id.clone(), default_dataset_id: dataset_id.clone(), credentials_json };
        let credential = Credential::Bigquery(bigquery_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request, &name).await?;
    } else {
        println!("{}", "ℹ️ Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, project_id, Some(dataset_id))) // project_id is like 'database', dataset_id is like 'schema'
}

async fn setup_mysql(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up MySQL/MariaDB connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text("Enter the MySQL/MariaDB host:", Some("Example: localhost or db.example.com"))?;
    let port = prompt_u16_with_default("Enter the MySQL/MariaDB port:", "3306", Some("Default MySQL/MariaDB port is 3306"))?;
    let username = prompt_required_text("Enter the MySQL/MariaDB username:", None)?;
    let password = prompt_password("Enter the MySQL/MariaDB password:")?;
    let database = prompt_required_text("Enter the default MySQL/MariaDB database name:", None)?;
    // No schema for MySQL

    if Confirm::new("\nConfirm the connection details and create this data source?")
        .with_default(true)
        .prompt()? 
    {
        let mysql_creds = MySqlCredentials { host, port, username, password, default_database: database.clone(), jump_host: None, ssh_username: None, ssh_private_key: None };
        let credential = Credential::MySql(mysql_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request, &name).await?;
    } else {
        println!("{}", "ℹ️ Skipping data source creation in Buster Cloud.".yellow());
    }
    
    Ok((name, database, None))
}

async fn setup_sqlserver(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up SQL Server connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text("Enter the SQL Server host:", Some("Example: server.database.windows.net or localhost"))?;
    let port = prompt_u16_with_default("Enter the SQL Server port:", "1433", Some("Default SQL Server port is 1433"))?;
    let username = prompt_required_text("Enter the SQL Server username:", None)?;
    let password = prompt_password("Enter the SQL Server password:")?;
    let database = prompt_required_text("Enter the default SQL Server database name:", None)?;
    let schema = prompt_required_text("Enter the default SQL Server schema:", None)?;

    if Confirm::new("\nConfirm the connection details and create this data source?")
        .with_default(true)
        .prompt()? 
    {
        let sqlserver_creds = SqlServerCredentials { host, port, username, password, default_database: database.clone(), default_schema: Some(schema.clone()), jump_host: None, ssh_username: None, ssh_private_key: None };
        let credential = Credential::SqlServer(sqlserver_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request, &name).await?;
    } else {
        println!("{}", "ℹ️ Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, database, Some(schema)))
}

async fn setup_databricks(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up Databricks connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text("Enter the Databricks host:", Some("Example: adb-xxxxxxxxxxxx.xx.azuredatabricks.net"))?;
    let api_key_db = prompt_password("Enter the Databricks API key (Personal Access Token):")?;
    let warehouse_id = prompt_required_text("Enter the Databricks SQL Warehouse HTTP Path:", Some("Example: /sql/1.0/warehouses/xxxxxxxxxxxx"))?;
    let catalog = prompt_required_text("Enter the default Databricks catalog:", None)?;
    let schema = prompt_required_text("Enter the default Databricks schema:", None)?;

    if Confirm::new("\nConfirm the connection details and create this data source?")
        .with_default(true)
        .prompt()? 
    {
        let databricks_creds = DatabricksCredentials { host, api_key: api_key_db, warehouse_id, default_catalog: catalog.clone(), default_schema: Some(schema.clone()) };
        let credential = Credential::Databricks(databricks_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request, &name).await?;
    } else {
        println!("{}", "ℹ️ Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, catalog, Some(schema)))
}

async fn setup_snowflake(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up Snowflake connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let account_id = prompt_required_text("Enter the Snowflake account identifier:", Some("Example: xy12345.us-east-1"))?;
    let warehouse_id = prompt_required_text("Enter the Snowflake warehouse name:", Some("Example: COMPUTE_WH"))?;
    let username = prompt_required_text("Enter the Snowflake username:", None)?;
    let password = prompt_password("Enter the Snowflake password:")?;
    let role_input = Text::new("Enter the Snowflake role (optional):").prompt()?;
    let role_opt = if role_input.trim().is_empty() { None } else { Some(role_input) };
    let database = prompt_required_text("Enter the default Snowflake database name:", None)?;
    let schema = prompt_required_text("Enter the default Snowflake schema:", None)?;

    if Confirm::new("\nConfirm the connection details and create this data source?")
        .with_default(true)
        .prompt()? 
    {
        let snowflake_creds = SnowflakeCredentials { account_id, warehouse_id, username, password, role: role_opt.clone(), default_database: database.clone(), default_schema: Some(schema.clone()) };
        let credential = Credential::Snowflake(snowflake_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request, &name).await?;
    } else {
        println!("{}", "ℹ️ Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, database, Some(schema)))
}
