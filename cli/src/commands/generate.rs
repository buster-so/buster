use crate::utils::{
    buster_credentials::get_and_validate_buster_credentials, file_finder::find_sql_files,
    yaml_diff_merger::YamlDiffMerger, BusterClient, BusterConfig, ExclusionManager,
    GenerateApiRequest, ProgressTracker,
};
use anyhow::Result;
use colored::*;
use inquire::{required, Text};
use lazy_static::lazy_static;
use regex::Regex;
use std::collections::HashMap;
use std::fmt;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug)]
pub struct GenerateCommand {
    source_path: PathBuf,
    destination_path: PathBuf,
    data_source_name: Option<String>,
    schema: Option<String>,
    database: Option<String>,
    config: BusterConfig,
    maintain_directory_structure: bool,
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
    FileExcluded {
        path: PathBuf,
        reason: String,
    },
}

impl fmt::Display for GenerateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            GenerateError::DuplicateModelName {
                name,
                first_occurrence,
                duplicate_occurrence,
            } => {
                write!(
                    f,
                    "Duplicate model name '{}' found. First occurrence: {}, Duplicate: {}",
                    name,
                    first_occurrence.display(),
                    duplicate_occurrence.display()
                )
            }
            GenerateError::MissingBusterYmlField { field } => {
                write!(f, "Missing required field in buster.yml: {}", field)
            }
            GenerateError::FileAccessError { path, error } => {
                write!(f, "Failed to access file {}: {}", path.display(), error)
            }
            GenerateError::FileExcluded { path, reason } => {
                write!(f, "File {} is excluded: {}", path.display(), reason)
            }
        }
    }
}

struct GenerateProgress {
    total_files: usize,
    processed: usize,
    excluded_files: usize,
    excluded_tags: usize,
    current_file: String,
    status: String,
}

impl GenerateProgress {
    fn new(total_files: usize) -> Self {
        Self {
            total_files,
            processed: 0,
            excluded_files: 0,
            excluded_tags: 0,
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

    fn log_excluded_file(&mut self, file: &str, pattern: &str) {
        self.excluded_files += 1;
        println!("⛔ Excluding file: {} (matched pattern: {})", file, pattern);
    }

    fn log_excluded_tag(&mut self, file: &str, tag: &str) {
        self.excluded_tags += 1;
        println!(
            "⛔ Excluding file: {} (matched excluded tag: {})",
            file, tag
        );
    }

    fn log_summary(&self) {
        println!("\n📊 Processing Summary");
        println!("==================");
        println!(
            "✅ Successfully processed: {} files",
            self.processed - self.excluded_files - self.excluded_tags
        );

        // Only show exclusion details if files were excluded
        if self.excluded_files > 0 || self.excluded_tags > 0 {
            println!(
                "\n⛔ Excluded files: {} total",
                self.excluded_files + self.excluded_tags
            );
            if self.excluded_files > 0 {
                println!("  - {} files excluded by pattern", self.excluded_files);
            }
            if self.excluded_tags > 0 {
                println!("  - {} files excluded by tag", self.excluded_tags);
            }
        }
    }
}

// Implement ProgressTracker trait for GenerateProgress
impl ProgressTracker for GenerateProgress {
    fn log_excluded_file(&mut self, path: &str, pattern: &str) {
        self.excluded_files += 1;
        println!("⛔ Excluding file: {} (matched pattern: {})", path, pattern);
    }

    fn log_excluded_tag(&mut self, path: &str, tag: &str) {
        self.excluded_tags += 1;
        println!(
            "⛔ Excluding file: {} (matched excluded tag: {})",
            path, tag
        );
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
            exclude_tags: None,
            model_paths: None,
        };

        Self {
            source_path,
            destination_path,
            data_source_name,
            schema,
            database,
            config,
            maintain_directory_structure: true, // Default to maintaining directory structure
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
            config, // Use the loaded config
            maintain_directory_structure: self.maintain_directory_structure,
        };

        let model_names = cmd.process_sql_files(&mut progress).await?;

        // Print results
        println!("\n✅ Successfully processed all files");
        println!("\nFound {} model names:", model_names.len());
        for model in &model_names {
            println!(
                "  - {} ({})",
                model.name,
                if model.is_from_alias {
                    "from alias"
                } else {
                    "from filename"
                }
            );
        }

        // Create API client
        progress.status = "Connecting to Buster API...".to_string();
        progress.log_progress();

        let creds = get_and_validate_buster_credentials().await?;
        let client = BusterClient::new(creds.url, creds.api_key)?;

        // Prepare API request
        let request = GenerateApiRequest {
            data_source_name: cmd
                .config
                .data_source_name
                .expect("data_source_name is required"),
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
                    // Find the source file for this model
                    let source_file = model_names
                        .iter()
                        .find(|m| m.name == model_name)
                        .map(|m| m.source_file.clone())
                        .unwrap_or_else(|| {
                            self.destination_path.join(format!("{}.sql", model_name))
                        });

                    // Determine output path based on source file
                    let file_path = self.get_output_path(&model_name, &source_file);

                    // Create parent directories if they don't exist
                    if let Some(parent) = file_path.parent() {
                        fs::create_dir_all(parent)?;
                    }

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
                                        println!("✅ Updated {}", file_path.display());
                                    }
                                    Err(e) => {
                                        progress.log_error(&format!(
                                            "Failed to update {}: {}",
                                            file_path.display(),
                                            e
                                        ));
                                    }
                                }
                            }
                            Err(e) => {
                                progress.log_error(&format!(
                                    "Failed to compute diff for {}: {}",
                                    file_path.display(),
                                    e
                                ));
                            }
                        }
                    } else {
                        // Create new file for models that don't exist yet
                        match fs::write(&file_path, yml_content) {
                            Ok(_) => {
                                progress.log_success();
                                println!("✅ Created new file {}", file_path.display());
                            }
                            Err(e) => {
                                progress.log_error(&format!(
                                    "Failed to write {}: {}",
                                    file_path.display(),
                                    e
                                ));
                            }
                        }
                    }
                }

                // Report any errors
                if !response.errors.is_empty() {
                    println!("\n⚠️  Some models had errors:");
                    for (model_name, error) in response.errors {
                        println!("❌ {}: {}", model_name, error.message);
                        if let Some(error_type) = error.error_type {
                            println!("   Error type: {}", error_type);
                        }
                        if let Some(context) = error.context {
                            println!("   Context: {}", context);
                        }
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

            // Use our unified config loader
            let config = BusterConfig::load_from_dir(&self.destination_path)?
                .ok_or_else(|| anyhow::anyhow!("Failed to load buster.yml"))?;

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
                if input.is_empty() {
                    None
                } else {
                    Some(input)
                }
            });

            // Ask if user wants to specify model paths
            let add_model_paths = inquire::Confirm::new("Do you want to specify model paths?")
                .with_default(false)
                .prompt()
                .unwrap_or(false);

            let model_paths = if add_model_paths {
                let input =
                    Text::new("Enter comma-separated model paths (e.g., models,shared/models):")
                        .prompt()
                        .unwrap_or_else(|_| String::new());

                if input.is_empty() {
                    None
                } else {
                    // Split by comma and trim each path
                    let paths: Vec<String> = input
                        .split(',')
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty())
                        .collect();

                    if paths.is_empty() {
                        None
                    } else {
                        Some(paths)
                    }
                }
            } else {
                None
            };

            let config = BusterConfig {
                data_source_name: Some(data_source_name),
                schema: Some(schema),
                database,
                exclude_files: None,
                exclude_tags: None,
                model_paths,
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

        // Create exclusion manager from config
        let exclusion_manager = ExclusionManager::new(&self.config)?;

        progress.status = format!("Initializing exclusion manager...");
        progress.log_progress();

        // Use the model_paths from config if specified
        let mut all_files = Vec::new();
        let has_model_paths = self.config.model_paths.is_some();

        if let Some(ref model_paths) = self.config.model_paths {
            progress.status = "Using model paths from config...".to_string();
            progress.log_progress();

            // Process each model path
            for path_pattern in model_paths {
                progress.status = format!("Processing directory: {}", path_pattern);
                progress.log_progress();

                // Get the absolute base directory (where buster.yml is)
                let base_dir = self.destination_path.canonicalize()?;
                
                // Resolve the directory path relative to the base directory
                let search_dir = if path_pattern.starts_with("../") {
                    base_dir.join(path_pattern)
                } else {
                    PathBuf::from(path_pattern)
                };

                println!("🔍 Looking for SQL files in directory: {}", search_dir.display());

                // Ensure the search directory exists
                if !search_dir.exists() {
                    progress.log_warning(&format!("Directory does not exist: {}", search_dir.display()));
                    continue;
                }

                // Walk the directory and find all SQL files
                for entry in walkdir::WalkDir::new(&search_dir)
                    .follow_links(true)
                    .into_iter()
                    .filter_map(|e| e.ok()) {
                    if entry.path().extension().and_then(|ext| ext.to_str()) == Some("sql") {
                        let path = entry.path().to_path_buf();
                        println!("   Found SQL file: {}", path.display());
                        all_files.push(path);
                    }
                }
            }
        }

        // Only fall back to source_path if no files found through model_paths
        if all_files.is_empty() && has_model_paths {
            progress.log_warning("No SQL files found in specified model paths");
            return Ok(names);
        } else if all_files.is_empty() {
            // No model_paths specified, use source_path
            all_files = find_sql_files(&self.source_path, true, &exclusion_manager, Some(progress))?;
        }

        let sql_files = all_files;
        progress.total_files = sql_files.len();
        progress.status = format!("Found {} SQL files to process", sql_files.len());
        progress.log_progress();

        for file_path in sql_files {
            progress.processed += 1;
            
            // Get the relative path from the source directory
            let relative_path = file_path.strip_prefix(&self.source_path)
                .unwrap_or(&file_path)
                .to_string_lossy()
                .into_owned();
            
            progress.current_file = relative_path.clone();
            progress.status = "Processing file...".to_string();
            progress.log_progress();

            match self.process_single_sql_file(&file_path).await {
                Ok(model_name) => {
                    println!("📝 Processing model: {} from file: {}", model_name.name, relative_path);
                    if let Some(existing) = seen_names.get(&model_name.name) {
                        errors.push(GenerateError::DuplicateModelName {
                            name: model_name.name,
                            first_occurrence: existing.clone(),
                            duplicate_occurrence: file_path.clone(),
                        });
                    } else {
                        progress.log_info(&format!(
                            "Found model name: {} ({})",
                            model_name.name,
                            if model_name.is_from_alias { "from alias" } else { "from filename" }
                        ));
                        seen_names.insert(model_name.name.clone(), file_path.clone());
                        names.push(model_name);
                    }
                }
                Err(e) => match e {
                    GenerateError::FileExcluded { path, reason } => {
                        // Handle excluded files by updating progress
                        if reason.starts_with("matched pattern:") {
                            let pattern = reason.trim_start_matches("matched pattern: ");
                            progress.log_excluded_file(&relative_path, pattern);
                        } else if reason.starts_with("matched tag:") {
                            let tag = reason.trim_start_matches("matched tag: ");
                            progress.log_excluded_tag(&relative_path, tag);
                        }
                        // Don't add excluded files to errors list
                    }
                    _ => {
                        progress.log_error(&format!("Failed to process file: {}", e));
                        errors.push(e);
                    }
                }
            }
        }

        // Print final model list for debugging
        println!("\n📋 Final model list:");
        for model in &names {
            println!("  - {} (from {})", model.name, model.source_file.display());
        }

        // Print processing summary including exclusions
        progress.log_summary();

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
                    GenerateError::FileExcluded { path, reason } => {
                        println!("  - File {} is excluded: {}", path.display(), reason);
                    }
                }
            }
            return Err(anyhow::anyhow!("Failed to process all SQL files"));
        }

        Ok(names)
    }

    async fn process_single_sql_file(&self, path: &PathBuf) -> Result<ModelName, GenerateError> {
        // Check exclusions first
        let content = fs::read_to_string(path).map_err(|e| GenerateError::FileAccessError {
            path: path.clone(),
            error: e,
        })?;

        // Create exclusion manager and check both file pattern and tags
        let exclusion_manager = ExclusionManager::new(&self.config).map_err(|e| GenerateError::FileAccessError {
            path: path.clone(),
            error: std::io::Error::new(std::io::ErrorKind::Other, e.to_string()),
        })?;
        let (should_exclude_by_pattern, pattern) =
            exclusion_manager.should_exclude_file(path, &self.source_path);
        let (should_exclude_by_tags, tag) = exclusion_manager.should_exclude_by_tags(&content);

        if should_exclude_by_pattern {
            return Err(GenerateError::FileExcluded {
                path: path.clone(),
                reason: format!("matched pattern: {}", pattern.unwrap_or_default()),
            });
        }

        if should_exclude_by_tags {
            return Err(GenerateError::FileExcluded {
                path: path.clone(),
                reason: format!("matched tag: {}", tag.unwrap_or_default()),
            });
        }

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
                    error: std::io::Error::new(std::io::ErrorKind::InvalidData, "Invalid filename"),
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
            static ref ALIAS_RE: Regex = Regex::new(r#"(?i)alias\s*=\s*['"]([^'"]+)['"]"#).unwrap();
        }

        ALIAS_RE.captures(content).map(|cap| cap[1].to_string())
    }

    // Add a method to determine the output path for a model
    fn get_output_path(&self, model_name: &str, source_file: &Path) -> PathBuf {
        if self.maintain_directory_structure {
            // Always try to get the full relative path structure from the source
            let source_str = source_file.to_string_lossy();

            // Look for "models/semantic" in the path and keep everything after it
            if let Some(idx) = source_str.find("models/semantic") {
                let relative_path = Path::new(&source_str[idx..])
                    .parent() // Get the directory part
                    .unwrap_or(Path::new("")); // Fallback to empty path if no parent

                // Join with destination and add the yml filename
                self.destination_path
                    .join(relative_path)
                    .join(format!("{}.yml", model_name))
            } else {
                // If we can't find the expected structure, fall back to just the immediate parent
                let parent = source_file.parent().unwrap_or(Path::new(""));
                self.destination_path
                    .join(parent.file_name().unwrap_or_default())
                    .join(format!("{}.yml", model_name))
            }
        } else {
            // Flat structure - all files in the destination directory
            self.destination_path.join(format!("{}.yml", model_name))
        }
    }
}

// Add this function before the generate function
fn find_nearest_buster_yml(start_dir: &Path) -> Option<PathBuf> {
    let mut current_dir = start_dir.to_path_buf();
    loop {
        let buster_yml = current_dir.join("buster.yml");
        if buster_yml.exists() {
            return Some(buster_yml);
        }
        if !current_dir.pop() {
            return None;
        }
    }
}

pub async fn generate(
    source_path: Option<&str>,
    destination_path: Option<&str>,
    data_source_name: Option<String>,
    schema: Option<String>,
    database: Option<String>,
    flat_structure: bool,
) -> Result<()> {
    let source = PathBuf::from(source_path.unwrap_or("."));
    let destination = PathBuf::from(destination_path.unwrap_or("."));

    // Check for buster.yml in current or parent directories
    let buster_yml_path = find_nearest_buster_yml(&std::env::current_dir()?);
    if buster_yml_path.is_none() {
        println!("❌ No buster.yml found in the current directory or any parent directories.");
        println!("This command must be run from within a Buster project (a directory containing or under a directory with buster.yml).");
        println!(
            "To create a new Buster project, run: {}",
            "buster init".cyan()
        );
        return Err(anyhow::anyhow!(
            "No buster.yml found. Run 'buster init' to create a new project."
        ));
    }

    // If destination_path wasn't specified, use the directory containing buster.yml
    let destination = if destination_path.is_none() {
        buster_yml_path
            .as_ref()
            .unwrap()
            .parent()
            .unwrap()
            .to_path_buf()
    } else {
        destination
    };

    let mut cmd = GenerateCommand::new(source, destination, data_source_name, schema, database);

    // Set directory structure preference
    cmd.maintain_directory_structure = !flat_structure;

    cmd.execute().await
}
