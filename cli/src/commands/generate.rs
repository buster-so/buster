use anyhow::Result;
use std::path::PathBuf;
use std::collections::HashMap;
use regex::Regex;
use lazy_static::lazy_static;
use std::ffi::OsStr;
use serde::{Deserialize, Serialize};
use std::fs;
use std::fmt;
use inquire::{Text, required};
use crate::utils::{
    buster_credentials::get_and_validate_buster_credentials,
    BusterClient, GenerateApiRequest, GenerateApiResponse,
    yaml_diff_merger::YamlDiffMerger,
};
use glob;

#[derive(Debug)]
pub struct GenerateCommand {
    source_path: PathBuf,
    destination_path: PathBuf,
    data_source_name: Option<String>,
    schema: Option<String>,
    database: Option<String>,
    config: BusterConfig,
}

#[derive(Debug)]
struct ModelName {
    name: String,
    source_file: PathBuf,
    is_from_alias: bool,
}

#[derive(Debug)]
struct GenerateResult {
    successes: Vec<ModelName>,
    errors: Vec<GenerateError>,
}

#[derive(Debug)]
enum GenerateError {
    DuplicateModelName {
        name: String,
        first_occurrence: PathBuf,
        duplicate_occurrence: PathBuf,
    },
    MissingBusterYmlField {
        field: String,
    },
    FileAccessError {
        path: PathBuf,
        error: std::io::Error,
    },
}

impl fmt::Display for GenerateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            GenerateError::DuplicateModelName { name, first_occurrence, duplicate_occurrence } => {
                write!(f, "Duplicate model name '{}' found. First occurrence: {}, Duplicate: {}", 
                    name, first_occurrence.display(), duplicate_occurrence.display())
            }
            GenerateError::MissingBusterYmlField { field } => {
                write!(f, "Missing required field in buster.yml: {}", field)
            }
            GenerateError::FileAccessError { path, error } => {
                write!(f, "Failed to access file {}: {}", path.display(), error)
            }
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BusterConfig {
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
    pub database: Option<String>,
    pub exclude_files: Option<Vec<String>>,
}

impl BusterConfig {
    fn validate_exclude_patterns(&self) -> Result<()> {
        if let Some(patterns) = &self.exclude_files {
            for pattern in patterns {
                match glob::Pattern::new(pattern) {
                    Ok(_) => continue,
                    Err(e) => return Err(anyhow::anyhow!("Invalid glob pattern '{}': {}", pattern, e)),
                }
            }
        }
        Ok(())
    }
}

struct GenerateProgress {
    total_files: usize,
    processed: usize,
    excluded: usize,
    current_file: String,
    status: String,
}

impl GenerateProgress {
    fn new(total_files: usize) -> Self {
        Self {
            total_files,
            processed: 0,
            excluded: 0,
            current_file: String::new(),
            status: String::new(),
        }
    }

    fn log_progress(&self) {
        println!(
            "\n[{}/{}] Processing: {}",
            self.processed, self.total_files, self.current_file
        );
        println!("Status: {}", self.status);
    }

    fn log_error(&self, error: &str) {
        eprintln!("❌ Error processing {}: {}", self.current_file, error);
    }

    fn log_success(&self) {
        println!("✅ Successfully processed: {}", self.current_file);
    }

    fn log_warning(&self, warning: &str) {
        println!("⚠️  Warning for {}: {}", self.current_file, warning);
    }

    fn log_info(&self, info: &str) {
        println!("ℹ️  {}: {}", self.current_file, info);
    }

    fn log_excluded(&mut self, file: &str, pattern: &str) {
        self.excluded += 1;
        println!("⚠️  Skipping {} (matched exclude pattern: {})", file, pattern);
    }
}

impl GenerateCommand {
    pub fn new(
        source_path: PathBuf,
        destination_path: PathBuf,
        data_source_name: Option<String>,
        schema: Option<String>,
        database: Option<String>,
    ) -> Self {
        let config = BusterConfig {
            data_source_name: data_source_name.clone(),
            schema: schema.clone(),
            database: database.clone(),
            exclude_files: None,
        };

        Self {
            source_path,
            destination_path,
            data_source_name,
            schema,
            database,
            config,
        }
    }

    pub async fn execute(&self) -> Result<()> {
        let mut progress = GenerateProgress::new(0);
        
        // First handle buster.yml
        progress.status = "Checking buster.yml configuration...".to_string();
        progress.log_progress();
        
        let config = self.handle_buster_yml().await?;

        progress.status = "Scanning source directory...".to_string();
        progress.log_progress();

        // Create a new command with the loaded config
        let cmd = GenerateCommand {
            source_path: self.source_path.clone(),
            destination_path: self.destination_path.clone(),
            data_source_name: self.data_source_name.clone(),
            schema: self.schema.clone(),
            database: self.database.clone(),
            config,  // Use the loaded config
        };

        let model_names = cmd.process_sql_files(&mut progress).await?;
        
        // Print results
        println!("\n✅ Successfully processed all files");
        println!("\nFound {} model names:", model_names.len());
        for model in &model_names {
            println!("  - {} ({})", model.name, 
                if model.is_from_alias { "from alias" } else { "from filename" });
        }

        // Create API client
        progress.status = "Connecting to Buster API...".to_string();
        progress.log_progress();

        let creds = get_and_validate_buster_credentials().await?;
        let client = BusterClient::new(creds.url, creds.api_key)?;

        // Prepare API request
        let request = GenerateApiRequest {
            data_source_name: cmd.config.data_source_name.expect("data_source_name is required"),
            schema: cmd.config.schema.expect("schema is required"),
            database: cmd.config.database,
            model_names: model_names.iter().map(|m| m.name.clone()).collect(),
        };

        // Make API call
        progress.status = "Generating YAML files...".to_string();
        progress.log_progress();

        match client.generate_datasets(request).await {
            Ok(response) => {
                // Process each model's YAML
                for (model_name, yml_content) in response.yml_contents {
                    let file_path = self.destination_path.join(format!("{}.yml", model_name));
                    
                    if file_path.exists() {
                        // Use YAML diff merger for existing files
                        let merger = YamlDiffMerger::new(file_path.clone(), yml_content);
                        
                        match merger.compute_diff() {
                            Ok(diff_result) => {
                                // Preview changes
                                println!("\nProcessing model: {}", model_name);
                                merger.preview_changes(&diff_result);

                                // Apply changes
                                match merger.apply_changes(&diff_result) {
                                    Ok(_) => {
                                        progress.log_success();
                                        println!("✅ Updated {}.yml", model_name);
                                    }
                                    Err(e) => {
                                        progress.log_error(&format!("Failed to update {}.yml: {}", model_name, e));
                                    }
                                }
                            }
                            Err(e) => {
                                progress.log_error(&format!("Failed to compute diff for {}.yml: {}", model_name, e));
                            }
                        }
                    } else {
                        // Create new file for models that don't exist yet
                        match fs::write(&file_path, yml_content) {
                            Ok(_) => {
                                progress.log_success();
                                println!("✅ Created new file {}.yml", model_name);
                            }
                            Err(e) => {
                                progress.log_error(&format!("Failed to write {}.yml: {}", model_name, e));
                            }
                        }
                    }
                }

                // Report any errors
                if !response.errors.is_empty() {
                    println!("\n⚠️  Some models had errors:");
                    for (model_name, error) in response.errors {
                        println!("❌ {}: {}", model_name, error);
                    }
                }
            }
            Err(e) => {
                progress.log_error(&format!("API call failed: {}", e));
                return Err(anyhow::anyhow!("Failed to generate YAML files: {}", e));
            }
        }
        
        Ok(())
    }

    async fn handle_buster_yml(&self) -> Result<BusterConfig> {
        let buster_yml_path = self.destination_path.join("buster.yml");

        if buster_yml_path.exists() {
            println!("✅ Found existing buster.yml");
            let content = fs::read_to_string(&buster_yml_path)?;
            let mut config: BusterConfig = serde_yaml::from_str(&content)?;
            
            // Validate required fields
            let mut missing_fields = Vec::new();
            if config.data_source_name.is_none() {
                missing_fields.push("data_source_name");
            }
            if config.schema.is_none() {
                missing_fields.push("schema");
            }

            if !missing_fields.is_empty() {
                return Err(anyhow::anyhow!(
                    "Existing buster.yml is missing required fields: {}",
                    missing_fields.join(", ")
                ));
            }

            // Validate exclude patterns if present
            if let Err(e) = config.validate_exclude_patterns() {
                return Err(anyhow::anyhow!("Invalid exclude_files configuration: {}", e));
            }

            // Log exclude patterns if present
            if let Some(patterns) = &config.exclude_files {
                println!("ℹ️  Found {} exclude pattern(s):", patterns.len());
                for pattern in patterns {
                    println!("   - {}", pattern);
                }
            }

            Ok(config)
        } else {
            println!("ℹ️  No buster.yml found, creating new configuration");
            
            // Use command line args if provided, otherwise prompt
            let data_source_name = self.data_source_name.clone().unwrap_or_else(|| {
                Text::new("Enter data source name:")
                    .with_validator(required!())
                    .prompt()
                    .unwrap_or_else(|_| String::new())
            });

            let schema = self.schema.clone().unwrap_or_else(|| {
                Text::new("Enter schema name:")
                    .with_validator(required!())
                    .prompt()
                    .unwrap_or_else(|_| String::new())
            });

            let database = self.database.clone().or_else(|| {
                let input = Text::new("Enter database name (optional):")
                    .prompt()
                    .unwrap_or_else(|_| String::new());
                if input.is_empty() { None } else { Some(input) }
            });

            let config = BusterConfig {
                data_source_name: Some(data_source_name),
                schema: Some(schema),
                database,
                exclude_files: None,
            };

            // Write the config to file
            let yaml = serde_yaml::to_string(&config)?;
            fs::write(&buster_yml_path, yaml)?;
            
            println!("✅ Created new buster.yml configuration");
            Ok(config)
        }
    }

    async fn process_sql_files(&self, progress: &mut GenerateProgress) -> Result<Vec<ModelName>> {
        let mut names = Vec::new();
        let mut seen_names: HashMap<String, PathBuf> = HashMap::new();
        let mut errors = Vec::new();

        // Compile glob patterns once
        let exclude_patterns: Vec<glob::Pattern> = if let Some(patterns) = &self.config.exclude_files {
            println!("🔍 Found exclude patterns: {:?}", patterns);
            patterns.iter()
                .filter_map(|p| match glob::Pattern::new(p) {
                    Ok(pattern) => {
                        println!("✅ Compiled pattern: {}", p);
                        Some(pattern)
                    }
                    Err(e) => {
                        progress.log_warning(&format!("Invalid exclude pattern '{}': {}", p, e));
                        None
                    }
                })
                .collect()
        } else {
            println!("ℹ️  No exclude patterns found");
            Vec::new()
        };

        // Get list of SQL files first to set total
        let sql_files: Vec<_> = fs::read_dir(&self.source_path)?
            .filter_map(|entry| entry.ok())
            .filter(|entry| {
                entry.path().extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext| ext.to_lowercase() == "sql")
                    .unwrap_or(false)
            })
            .collect();

        progress.total_files = sql_files.len();
        progress.status = format!("Found {} SQL files to process", sql_files.len());
        progress.log_progress();

        for entry in sql_files {
            progress.processed += 1;
            let file_path = entry.path();
            
            // Get the relative path from the source directory
            let relative_path = file_path.strip_prefix(&self.source_path)
                .unwrap_or(&file_path)
                .to_string_lossy()
                .into_owned();
            
            progress.current_file = relative_path.clone();
            progress.status = "Checking exclusions...".to_string();
            progress.log_progress();

            println!("🔍 Checking file: {}", relative_path);
            // Check if file matches any exclude pattern
            if let Some(matching_pattern) = exclude_patterns.iter()
                .find(|p| {
                    let matches = p.matches(&relative_path);
                    println!("  - Testing pattern '{}' against '{}': {}", p.as_str(), relative_path, matches);
                    matches
                }) {
                println!("⛔ Excluding file: {} (matched pattern: {})", relative_path, matching_pattern.as_str());
                progress.log_excluded(&relative_path, matching_pattern.as_str());
                continue;
            }

            progress.status = "Processing file...".to_string();
            progress.log_progress();

            match self.process_single_sql_file(&file_path).await {
                Ok(model_name) => {
                    println!("📝 Processing model: {} from file: {}", model_name.name, relative_path);
                    if let Some(existing) = seen_names.get(&model_name.name) {
                        errors.push(GenerateError::DuplicateModelName {
                            name: model_name.name,
                            first_occurrence: existing.clone(),
                            duplicate_occurrence: entry.path(),
                        });
                    } else {
                        progress.log_info(&format!(
                            "Found model name: {} ({})",
                            model_name.name,
                            if model_name.is_from_alias { "from alias" } else { "from filename" }
                        ));
                        seen_names.insert(model_name.name.clone(), entry.path());
                        names.push(model_name);
                    }
                }
                Err(e) => {
                    progress.log_error(&format!("Failed to process file: {}", e));
                    errors.push(e);
                }
            }
        }

        // Print final model list for debugging
        println!("\n📋 Final model list:");
        for model in &names {
            println!("  - {} (from {})", model.name, model.source_file.display());
        }

        // Update final summary with exclusion information
        if progress.excluded > 0 {
            println!("\nℹ️  Excluded {} files based on patterns", progress.excluded);
        }

        if !errors.is_empty() {
            // Log all errors
            println!("\n❌ Encountered errors during processing:");
            for error in &errors {
                match error {
                    GenerateError::DuplicateModelName { name, first_occurrence, duplicate_occurrence } => {
                        println!("  - Duplicate model name '{}' found:", name);
                        println!("    First occurrence: {}", first_occurrence.display());
                        println!("    Duplicate: {}", duplicate_occurrence.display());
                    }
                    GenerateError::FileAccessError { path, error } => {
                        println!("  - Failed to access file {}: {}", path.display(), error);
                    }
                    GenerateError::MissingBusterYmlField { field } => {
                        println!("  - Missing required field in buster.yml: {}", field);
                    }
                }
            }
            return Err(anyhow::anyhow!("Failed to process all SQL files"));
        }

        Ok(names)
    }

    async fn process_single_sql_file(&self, path: &PathBuf) -> Result<ModelName, GenerateError> {
        // Read file content
        let content = fs::read_to_string(path)
            .map_err(|e| GenerateError::FileAccessError {
                path: path.clone(),
                error: e,
            })?;

        // Try to find alias in content
        if let Some(alias) = self.extract_alias(&content) {
            Ok(ModelName {
                name: alias,
                source_file: path.clone(),
                is_from_alias: true,
            })
        } else {
            // Use filename without extension
            let name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .map(|s| s.to_string())
                .ok_or_else(|| GenerateError::FileAccessError {
                    path: path.clone(),
                    error: std::io::Error::new(
                        std::io::ErrorKind::InvalidData,
                        "Invalid filename",
                    ),
                })?;

            Ok(ModelName {
                name,
                source_file: path.clone(),
                is_from_alias: false,
            })
        }
    }

    fn extract_alias(&self, content: &str) -> Option<String> {
        lazy_static! {
            static ref ALIAS_RE: Regex = Regex::new(
                r#"(?i)alias\s*=\s*['"]([^'"]+)['"]"#
            ).unwrap();
        }
        
        ALIAS_RE.captures(content)
            .map(|cap| cap[1].to_string())
    }
}

pub async fn generate() -> Result<()> {
    Ok(())
}
