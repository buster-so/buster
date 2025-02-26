use anyhow::Result;
use regex;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use tokio::task;
use walkdir::WalkDir;

use crate::utils::{
    buster_credentials::get_and_validate_buster_credentials, BusterClient,
    DeployDatasetsColumnsRequest, DeployDatasetsEntityRelationshipsRequest, DeployDatasetsRequest,
    ValidationError, ValidationErrorType, ValidationResult, BusterConfig, ExclusionManager,
    find_yml_files, ProgressTracker,
};

// Use the unified BusterConfig from exclusion.rs instead
// This BusterConfig struct is now deprecated and replaced by the one from utils::exclusion
// #[derive(Debug, Deserialize, Serialize, Clone)]
// pub struct BusterConfig {
//     pub data_source_name: Option<String>,
//     pub schema: Option<String>,
//     pub database: Option<String>,
//     pub exclude_tags: Option<Vec<String>>,
// }

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct BusterModel {
    #[serde(default)]
    version: i32, // Optional, only used for DBT models
    models: Vec<Model>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Model {
    name: String,
    data_source_name: Option<String>,
    schema: Option<String>,
    database: Option<String>,
    description: String,
    model: Option<String>,
    #[serde(default)]
    entities: Vec<Entity>,
    #[serde(default)]
    dimensions: Vec<Dimension>,
    #[serde(default)]
    measures: Vec<Measure>,
}

#[derive(Debug, Deserialize, Serialize, Clone, Eq, PartialEq, Hash)]
pub struct Entity {
    name: String,
    #[serde(default)]
    ref_: Option<String>,
    expr: String,
    #[serde(rename = "type")]
    entity_type: String,
    description: String,
    #[serde(default)]
    project_path: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Dimension {
    name: String,
    expr: String,
    #[serde(rename = "type")]
    dimension_type: String,
    description: String,
    #[serde(default = "bool::default")]
    searchable: bool,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Measure {
    name: String,
    expr: String,
    agg: String,
    description: String,
    #[serde(rename = "type")]
    measure_type: Option<String>,
}

#[derive(Debug)]
struct ModelFile {
    yml_path: PathBuf,
    sql_path: Option<PathBuf>,
    model: BusterModel,
    config: Option<BusterConfig>, // Store the global config
}

#[derive(Debug, Default)]
pub struct DeployResult {
    success: Vec<(String, String, String)>, // (filename, model_name, data_source)
    failures: Vec<(String, String, Vec<String>)>, // (filename, model_name, errors)
}

// Track mapping between files and their models
#[derive(Debug)]
struct ModelMapping {
    file: String,
    model_name: String,
}

#[derive(Debug)]
struct DeployProgress {
    total_files: usize,
    processed: usize,
    excluded: usize,
    current_file: String,
    status: String,
}

impl DeployProgress {
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

    fn log_validating(&self, validation: &ValidationResult) {
        println!("\n🔍 Validating {}", validation.model_name);
        println!("   Data Source: {}", validation.data_source_name);
        println!("   Schema: {}", validation.schema);
    }

    fn log_validation_errors(&self, validation: &ValidationResult) {
        println!("\n❌ Validation failed for {}", validation.model_name);
        println!("   Data Source: {}", validation.data_source_name);
        println!("   Schema: {}", validation.schema);

        if !validation.errors.is_empty() {
            println!("\nErrors:");
            for error in &validation.errors {
                println!("   - {:?}: {}", error.error_type, error.message);
                if let Some(col) = &error.column_name {
                    println!("     Column: {}", col);
                }
            }

            // Print suggestions if any
            let suggestions: Vec<_> = validation
                .errors
                .iter()
                .filter_map(|e| e.suggestion.as_ref())
                .collect();

            if !suggestions.is_empty() {
                println!("\n💡 Suggestions:");
                for suggestion in suggestions {
                    println!("   - {}", suggestion);
                }
            }
        }
    }

    pub fn log_validation_success(&self, validation: &ValidationResult) {
        println!("\n✅ Validation passed for {}", validation.model_name);
        println!("   Data Source: {}", validation.data_source_name);
        println!("   Schema: {}", validation.schema);
    }

    fn log_excluded(&mut self, reason: &str) {
        self.excluded += 1;
        println!("⚠️  Skipping {} ({})", self.current_file, reason);
    }
    
    fn log_summary(&self, result: &DeployResult) {
        // Print final summary with more details
        println!("\n📊 Deployment Summary");
        println!("==================");
        println!("✅ Successfully deployed: {} models", result.success.len());
        if self.excluded > 0 {
            println!(
                "⛔ Excluded: {} models (due to patterns or tags)",
                self.excluded
            );
        }
        if !result.success.is_empty() {
            println!("\nSuccessful deployments:");
            for (file, model_name, data_source) in &result.success {
                println!(
                    "   - {} (Model: {}, Data Source: {})",
                    file, model_name, data_source
                );
            }
        }

        if !result.failures.is_empty() {
            println!("\n❌ Failed deployments: {} models", result.failures.len());
            println!("\nFailures:");
            for (file, model_name, errors) in &result.failures {
                println!(
                    "   - {} (Model: {}, Errors: {})",
                    file,
                    model_name,
                    errors.join(", ")
                );
            }
        }
    }
}

// Implement ProgressTracker trait for DeployProgress
impl ProgressTracker for DeployProgress {
    fn log_excluded_file(&mut self, path: &str, pattern: &str) {
        self.excluded += 1;
        println!("⛔ Excluding file: {} (matched pattern: {})", path, pattern);
    }

    fn log_excluded_tag(&mut self, path: &str, tag: &str) {
        self.excluded += 1;
        println!("⛔ Excluding file: {} (matched excluded tag: {})", path, tag);
    }
}

impl ModelFile {
    fn new(yml_path: PathBuf, config: Option<BusterConfig>) -> Result<Self> {
        let yml_content = std::fs::read_to_string(&yml_path)?;
        let model: BusterModel = serde_yaml::from_str(&yml_content)?;

        Ok(Self {
            yml_path: yml_path.clone(),
            sql_path: Self::find_sql(&yml_path),
            model,
            config,
        })
    }

    fn check_excluded_tags(
        &self,
        sql_path: &Option<PathBuf>,
        exclude_tags: &[String],
    ) -> Result<bool> {
        if exclude_tags.is_empty() || sql_path.is_none() {
            return Ok(false);
        }

        let sql_path = sql_path.as_ref().unwrap();
        if !sql_path.exists() {
            return Ok(false);
        }

        let content = std::fs::read_to_string(sql_path)?;
        
        // Create temporary exclusion manager just for tag checking
        let mut temp_config = BusterConfig {
            data_source_name: None,
            schema: None,
            database: None,
            exclude_files: None,
            exclude_tags: Some(exclude_tags.to_vec()),
        };
        
        let manager = ExclusionManager::new(&temp_config)?;
        let (should_exclude, _) = manager.should_exclude_by_tags(&content);
        
        Ok(should_exclude)
    }

    fn find_sql(yml_path: &Path) -> Option<PathBuf> {
        // Get the file stem (name without extension)
        let file_stem = yml_path.file_stem()?;

        // Look one directory up
        let parent_dir = yml_path.parent()?.parent()?;
        let sql_path = parent_dir.join(format!("{}.sql", file_stem.to_str()?));

        if sql_path.exists() {
            Some(sql_path)
        } else {
            None
        }
    }

    fn get_config(dir: &Path) -> Result<Option<BusterConfig>> {
        // Use the new unified config loader
        BusterConfig::load_from_dir(dir)
    }

    fn validate_model_exists(
        entity_name: &str,
        current_dir: &Path,
        current_model: &str,
    ) -> Result<(), ValidationError> {
        let target_file = current_dir.join(format!("{}.yml", entity_name));

        if !target_file.exists() {
            return Err(ValidationError {
                error_type: ValidationErrorType::ModelNotFound,
                message: format!(
                    "Model '{}' references non-existent model '{}' - file {}.yml not found",
                    current_model, entity_name, entity_name
                ),
                column_name: None,
                suggestion: Some(format!(
                    "Create {}.yml file with model definition",
                    entity_name
                )),
            });
        }

        // Quick verification that model exists in file
        if let Ok(content) = std::fs::read_to_string(&target_file) {
            if let Ok(model_def) = serde_yaml::from_str::<BusterModel>(&content) {
                if !model_def.models.iter().any(|m| m.name == entity_name) {
                    return Err(ValidationError {
                        error_type: ValidationErrorType::ModelNotFound,
                        message: format!(
                            "Model '{}' references model '{}' but no model with that name found in {}.yml",
                            current_model, entity_name, entity_name
                        ),
                        column_name: None,
                        suggestion: Some(format!(
                            "Add model definition for '{}' in {}.yml",
                            entity_name, entity_name
                        )),
                    });
                }
            }
        }

        Ok(())
    }

    async fn validate(&self, config: Option<&BusterConfig>) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();

        // Basic validation first
        if self.model.models.is_empty() {
            errors.push("At least one model is required".to_string());
            return Err(errors);
        }

        let mut model_names = std::collections::HashSet::new();

        // First pass: collect all model names
        for model in &self.model.models {
            if !model_names.insert(model.name.clone()) {
                errors.push(format!("Duplicate model name: {}", model.name));
                continue;
            }
        }

        // Second pass: validate model references
        for model in &self.model.models {
            for entity in &model.entities {
                if entity.entity_type == "foreign" {
                    // Get the model reference from ref_ field if present, otherwise use name
                    let referenced_model = entity.ref_.as_ref().unwrap_or(&entity.name);

                    // If project_path specified, use cross-project validation
                    if entity.project_path.is_some() {
                        if let Err(validation_errors) =
                            self.validate_cross_project_references(config).await
                        {
                            errors.extend(validation_errors.into_iter().map(|e| e.message));
                        }
                    } else {
                        // Same-project validation using file-based check
                        let current_dir = self.yml_path.parent().unwrap_or(Path::new("."));
                        if let Err(e) =
                            Self::validate_model_exists(referenced_model, current_dir, &model.name)
                        {
                            errors.push(e.message);
                        }
                    }
                }
            }
        }

        // Warnings
        for model in &self.model.models {
            if model.description.is_empty() {
                println!("⚠️  Warning: Model '{}' has no description", model.name);
            }
            if model.dimensions.is_empty() && model.measures.is_empty() {
                println!(
                    "⚠️  Warning: Model '{}' has no dimensions or measures",
                    model.name
                );
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    fn generate_default_sql(&self, model: &Model) -> String {
        format!(
            "select * from {}.{}",
            model.schema.as_ref().map(String::as_str).unwrap_or(""),
            model.name
        )
    }

    fn get_sql_content(&self, model: &Model) -> Result<String> {
        if let Some(ref sql_path) = self.sql_path {
            Ok(std::fs::read_to_string(sql_path)?)
        } else {
            Ok(self.generate_default_sql(model))
        }
    }

    fn resolve_model_config(
        &self,
        model: &Model,
        config: Option<&BusterConfig>,
    ) -> (Option<String>, Option<String>, Option<String>) {
        let data_source_name = model
            .data_source_name
            .clone()
            .or_else(|| config.and_then(|c| c.data_source_name.clone()));

        let schema = model
            .schema
            .clone()
            .or_else(|| config.and_then(|c| c.schema.clone()));

        let database = model
            .database
            .clone()
            .or_else(|| config.and_then(|c| c.database.clone()));

        (data_source_name, schema, database)
    }

    fn to_deploy_request(&self, model: &Model, sql_content: String) -> DeployDatasetsRequest {
        let mut columns = Vec::new();

        // Convert dimensions to columns
        for dim in &model.dimensions {
            columns.push(DeployDatasetsColumnsRequest {
                name: dim.name.clone(),
                description: dim.description.clone(),
                semantic_type: Some("dimension".to_string()),
                expr: Some(dim.expr.clone()),
                type_: Some(dim.dimension_type.clone()),
                agg: None,
                searchable: dim.searchable,
            });
        }

        // Convert measures to columns
        for measure in &model.measures {
            columns.push(DeployDatasetsColumnsRequest {
                name: measure.name.clone(),
                description: measure.description.clone(),
                semantic_type: Some("measure".to_string()),
                expr: Some(measure.expr.clone()),
                type_: measure.measure_type.clone(),
                agg: Some(measure.agg.clone()),
                searchable: false,
            });
        }

        // Convert entity relationships
        let entity_relationships = model
            .entities
            .iter()
            .map(|entity| DeployDatasetsEntityRelationshipsRequest {
                name: entity.name.clone(),
                expr: entity.expr.clone(),
                type_: entity.entity_type.clone(),
            })
            .collect();

        // Resolve configuration with global config
        let (data_source_name, schema, database) =
            self.resolve_model_config(model, self.config.as_ref());

        // Unwrap with error if missing - this should never happen since we validate earlier
        let data_source_name = data_source_name.expect("data_source_name missing after validation");
        let schema = schema.expect("schema missing after validation");

        // Debug log for database field
        if let Some(db) = &database {
            println!("DATABASE DETECTED for model {}: {}", model.name, db);
        } else if let Some(config) = &self.config {
            if let Some(db) = &config.database {
                println!(
                    "Using database from buster.yml for model {}: {}",
                    model.name, db
                );
            }
        }

        // Create a modified model with resolved database and schema
        let mut modified_model = model.clone();
        modified_model.database = database.clone();
        modified_model.schema = Some(schema.clone());
        // Don't set data_source_name on the model itself for the yml content

        // Create a modified BusterModel with the updated model
        let mut modified_buster_model = self.model.clone();
        for i in 0..modified_buster_model.models.len() {
            if modified_buster_model.models[i].name == model.name {
                modified_buster_model.models[i] = modified_model.clone();
                break;
            }
        }

        // Serialize the modified BusterModel to YAML
        let yml_content = serde_yaml::to_string(&modified_buster_model).unwrap_or_default();

        let request = DeployDatasetsRequest {
            id: None,
            data_source_name,
            env: "dev".to_string(),
            type_: "view".to_string(),
            name: model.name.clone(),
            model: model.model.clone(),
            schema,
            database, // This is already Option<String>
            description: model.description.clone(),
            sql_definition: Some(sql_content),
            entity_relationships: Some(entity_relationships),
            columns,
            yml_file: Some(yml_content),
        };

        request
    }

    async fn validate_cross_project_references(
        &self,
        config: Option<&BusterConfig>,
    ) -> Result<(), Vec<ValidationError>> {
        let mut errors = Vec::new();
        let mut validation_tasks = Vec::new();
        let current_data_source = self.resolve_data_source(config)?;

        // Collect all unique project references
        let mut project_refs = HashSet::new();
        for model in &self.model.models {
            for entity in &model.entities {
                if entity.entity_type == "foreign" && entity.project_path.is_some() {
                    project_refs.insert((model.name.clone(), entity.clone()));
                }
            }
        }

        // Validate each project reference in parallel
        for (model_name, entity) in project_refs {
            let project_path = entity.project_path.as_ref().unwrap();
            let current_dir = self.yml_path.parent().unwrap().to_path_buf();
            let target_path = current_dir.join(project_path);
            let project_path_display = project_path.clone();

            // Spawn validation task
            let current_data_source = current_data_source.clone();
            let validation_task = task::spawn(async move {
                let mut validation_errors = Vec::new();

                // Check if project exists
                if !target_path.exists() {
                    validation_errors.push(ValidationError {
                        error_type: ValidationErrorType::ProjectNotFound,
                        message: format!(
                            "Project not found at '{}' referenced by model '{}'",
                            project_path_display, model_name
                        ),
                        column_name: None,
                        suggestion: Some(format!(
                            "Verify the project_path '{}' is correct",
                            project_path_display
                        )),
                    });
                    return (model_name, validation_errors);
                }

                // Check for buster.yml
                let buster_yml_path = target_path.join("buster.yml");
                if !buster_yml_path.exists() {
                    validation_errors.push(ValidationError {
                        error_type: ValidationErrorType::InvalidBusterYml,
                        message: format!(
                            "buster.yml not found in project '{}' referenced by model '{}'",
                            project_path_display, model_name
                        ),
                        column_name: None,
                        suggestion: Some(
                            "Add a buster.yml file to the referenced project".to_string(),
                        ),
                    });
                    return (model_name, validation_errors);
                }

                // Parse and validate buster.yml
                match std::fs::read_to_string(&buster_yml_path) {
                    Ok(content) => {
                        match serde_yaml::from_str::<BusterConfig>(&content) {
                            Ok(project_config) => {
                                // Check data source match
                                if let Some(project_ds) = project_config.data_source_name {
                                    if project_ds != current_data_source {
                                        validation_errors.push(ValidationError {
                                            error_type: ValidationErrorType::DataSourceMismatch,
                                            message: format!(
                                                "Data source mismatch: model '{}' uses '{}' but referenced project '{}' uses '{}'",
                                                model_name, current_data_source, project_path_display, project_ds
                                            ),
                                            column_name: None,
                                            suggestion: Some("Ensure both projects use the same data source".to_string()),
                                        });
                                    }

                                    // Validate referenced model exists
                                    let model_files = std::fs::read_dir(&target_path)
                                        .ok()
                                        .into_iter()
                                        .flatten()
                                        .filter_map(|entry| entry.ok())
                                        .filter(|entry| {
                                            let path = entry.path();
                                            path.extension()
                                                .and_then(|ext| ext.to_str())
                                                .map(|ext| ext == "yml")
                                                .unwrap_or(false)
                                                && path
                                                    .file_name()
                                                    .and_then(|name| name.to_str())
                                                    .map(|name| name != "buster.yml")
                                                    .unwrap_or(false)
                                        })
                                        .collect::<Vec<_>>();

                                    println!(
                                        "🔍 Searching for model '{}' in directory: {}",
                                        entity.ref_.as_ref().unwrap_or(&entity.name),
                                        target_path.display()
                                    );
                                    println!("   Found {} YAML files to search", model_files.len());

                                    let mut found_model = false;
                                    for model_file in model_files {
                                        println!(
                                            "   Checking file: {}",
                                            model_file.path().display()
                                        );
                                        if let Ok(content) =
                                            std::fs::read_to_string(model_file.path())
                                        {
                                            match serde_yaml::from_str::<BusterModel>(&content) {
                                                Ok(model_def) => {
                                                    // Get the model reference from ref_ field if present, otherwise use name
                                                    let referenced_model = entity
                                                        .ref_
                                                        .as_ref()
                                                        .unwrap_or(&entity.name);
                                                    println!(
                                                        "     - Found {} models in file",
                                                        model_def.models.len()
                                                    );
                                                    for m in &model_def.models {
                                                        println!(
                                                            "     - Checking model: {}",
                                                            m.name
                                                        );
                                                    }
                                                    if model_def
                                                        .models
                                                        .iter()
                                                        .any(|m| m.name == *referenced_model)
                                                    {
                                                        found_model = true;
                                                        println!("     ✅ Found matching model!");
                                                        break;
                                                    }
                                                }
                                                Err(e) => {
                                                    println!(
                                                        "     ⚠️  Failed to parse YAML content: {}",
                                                        e
                                                    );
                                                    println!("     Content:\n{}", content);
                                                }
                                            }
                                        } else {
                                            println!("     ⚠️  Failed to read file content");
                                        }
                                    }

                                    if !found_model {
                                        validation_errors.push(ValidationError {
                                            error_type: ValidationErrorType::ModelNotFound,
                                            message: format!(
                                                "Referenced model '{}' not found in project '{}'",
                                                entity.ref_.as_ref().unwrap_or(&entity.name),
                                                project_path_display
                                            ),
                                            column_name: None,
                                            suggestion: Some(format!(
                                                "Verify that the model '{}' exists in the target project",
                                                entity.ref_.as_ref().unwrap_or(&entity.name)
                                            )),
                                        });
                                    }
                                } else {
                                    validation_errors.push(ValidationError {
                                        error_type: ValidationErrorType::InvalidBusterYml,
                                        message: format!(
                                            "Missing data_source_name in buster.yml of project '{}' referenced by model '{}'",
                                            project_path_display, model_name
                                        ),
                                        column_name: None,
                                        suggestion: Some("Add data_source_name to the referenced project's buster.yml".to_string()),
                                    });
                                }
                            }
                            Err(e) => {
                                validation_errors.push(ValidationError {
                                    error_type: ValidationErrorType::InvalidBusterYml,
                                    message: format!(
                                        "Invalid buster.yml in project '{}' referenced by model '{}': {}",
                                        project_path_display, model_name, e
                                    ),
                                    column_name: None,
                                    suggestion: Some("Fix the YAML syntax in the referenced project's buster.yml".to_string()),
                                });
                            }
                        }
                    }
                    Err(e) => {
                        validation_errors.push(ValidationError {
                            error_type: ValidationErrorType::InvalidBusterYml,
                            message: format!(
                                "Failed to read buster.yml in project '{}' referenced by model '{}': {}",
                                project_path_display, model_name, e
                            ),
                            column_name: None,
                            suggestion: Some("Check file permissions and encoding".to_string()),
                        });
                    }
                }

                (model_name, validation_errors)
            });

            validation_tasks.push(validation_task);
        }

        // Collect all validation results
        for task in validation_tasks {
            let (model_name, task_errors) = task.await.unwrap();
            errors.extend(task_errors);
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    fn resolve_data_source(
        &self,
        config: Option<&BusterConfig>,
    ) -> Result<String, Vec<ValidationError>> {
        // Try to get data source from first model (they should all be the same after basic validation)
        if let Some(model) = self.model.models.first() {
            if let Some(ds) = &model.data_source_name {
                return Ok(ds.clone());
            }
        }

        // Fall back to global config
        if let Some(config) = config {
            if let Some(ds) = &config.data_source_name {
                return Ok(ds.clone());
            }
        }

        Err(vec![ValidationError {
            error_type: ValidationErrorType::InvalidBusterYml,
            message: "No data_source_name found in model or buster.yml".to_string(),
            column_name: None,
            suggestion: Some("Add data_source_name to your model or buster.yml".to_string()),
        }])
    }
}

pub async fn deploy(path: Option<&str>, dry_run: bool, recursive: bool) -> Result<()> {
    let target_path = PathBuf::from(path.unwrap_or("."));
    let mut progress = DeployProgress::new(0);
    let mut result = DeployResult::default();

    // Only create client if not in dry-run mode
    let client = if !dry_run {
        // Create API client without explicit auth check
        let creds = get_and_validate_buster_credentials().await?;
        Some(BusterClient::new(creds.url, creds.api_key)?)
    } else {
        None
    };

    // Try to load buster.yml first
    progress.status = "Looking for buster.yml configuration...".to_string();
    progress.log_progress();

    let config = match ModelFile::get_config(&target_path) {
        Ok(Some(config)) => {
            println!("✅ Found buster.yml configuration");
            if let Some(ds) = &config.data_source_name {
                println!("   - Default data source: {}", ds);
            }
            if let Some(schema) = &config.schema {
                println!("   - Default schema: {}", schema);
            }
            if let Some(database) = &config.database {
                println!("   - Default database: {}", database);
            }
            Some(config)
        }
        Ok(None) => {
            println!("ℹ️  No buster.yml found, will require configuration in model files");
            None
        }
        Err(e) => {
            println!("⚠️  Error reading buster.yml: {}", e);
            None
        }
    };

    // Find all .yml files
    progress.status = "Discovering model files...".to_string();
    progress.log_progress();

    let yml_files: Vec<PathBuf> = if target_path.is_file() {
        vec![target_path.clone()]
    } else if recursive {
        find_yml_files_recursively(&target_path, config.as_ref(), Some(&mut progress))?
    } else {
        // Non-recursive mode - only search in the specified directory
        std::fs::read_dir(&target_path)?
            .filter_map(|entry| entry.ok())
            .filter(|entry| {
                let path = entry.path();
                path.extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext| ext == "yml")
                    .unwrap_or(false)
                    && path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .map(|name| name != "buster.yml")
                        .unwrap_or(false)
            })
            .map(|entry| entry.path())
            .collect()
    };

    println!(
        "Found {} model files in {}",
        yml_files.len(),
        target_path.display()
    );
    progress.total_files = yml_files.len();

    let mut deploy_requests = Vec::new();
    let mut model_mappings = Vec::new();

    // Process each file
    for yml_path in yml_files {
        progress.processed += 1;
        progress.current_file = yml_path
            .strip_prefix(&target_path)
            .unwrap_or(&yml_path)
            .to_string_lossy()
            .to_string();

        progress.status = "Loading model file...".to_string();
        progress.log_progress();

        // Load and validate model
        let model_file = match ModelFile::new(yml_path.clone(), config.clone()) {
            Ok(mf) => mf,
            Err(e) => {
                progress.log_error(&format!("Failed to load model: {}", e));
                result.failures.push((
                    progress.current_file.clone(),
                    "unknown".to_string(),
                    vec![format!("Failed to load model: {}", e)],
                ));
                continue;
            }
        };

        // Check for excluded tags
        if let Some(ref cfg) = config {
            if let Some(ref exclude_tags) = cfg.exclude_tags {
                if !exclude_tags.is_empty() {
                    match model_file.check_excluded_tags(&model_file.sql_path, exclude_tags) {
                        Ok(true) => {
                            // Model has excluded tag, skip it
                            let tag_info = exclude_tags.join(", ");
                            progress.log_excluded(&format!(
                                "Skipping model due to excluded tag(s): {}",
                                tag_info
                            ));
                            continue;
                        }
                        Err(e) => {
                            progress.log_error(&format!("Error checking tags: {}", e));
                        }
                        _ => {}
                    }
                }
            }
        }

        progress.status = "Validating model...".to_string();
        progress.log_progress();

        if let Err(errors) = model_file.validate(config.as_ref()).await {
            for error in &errors {
                progress.log_error(error);
            }
            result
                .failures
                .push((progress.current_file.clone(), "unknown".to_string(), errors));
            continue;
        }

        // Process each model in the file
        for model in &model_file.model.models {
            let (data_source_name, schema, database) =
                model_file.resolve_model_config(model, config.as_ref());

            if data_source_name.is_none() {
                progress.log_error(&format!(
                    "data_source_name is required for model {} (not found in model or buster.yml)",
                    model.name
                ));
                result.failures.push((
                    progress.current_file.clone(),
                    model.name.clone(),
                    vec![format!("Missing data_source_name for model {}", model.name)],
                ));
                continue;
            }

            if schema.is_none() {
                progress.log_error(&format!(
                    "schema is required for model {} (not found in model or buster.yml)",
                    model.name
                ));
                result.failures.push((
                    progress.current_file.clone(),
                    model.name.clone(),
                    vec![format!("Missing schema for model {}", model.name)],
                ));
                continue;
            }

            // Get SQL content
            let sql_content = match model_file.get_sql_content(model) {
                Ok(content) => content,
                Err(e) => {
                    progress.log_error(&format!("Failed to read SQL content: {}", e));
                    result.failures.push((
                        progress.current_file.clone(),
                        model.name.clone(),
                        vec![format!("Failed to read SQL content: {}", e)],
                    ));
                    continue;
                }
            };

            // Track model mapping
            model_mappings.push(ModelMapping {
                file: progress.current_file.clone(),
                model_name: model.name.clone(),
            });

            // Create deploy request
            deploy_requests.push(model_file.to_deploy_request(model, sql_content));
        }

        progress.log_success();
    }

    // Deploy to API if we have valid models and not in dry-run mode
    if !deploy_requests.is_empty() {
        if dry_run {
            println!("\n🔍 Dry run mode - validation successful!");
            println!("\n📦 Would deploy {} models:", deploy_requests.len());
            for request in &deploy_requests {
                println!("   - Model: {} ", request.name);
                println!(
                    "     Data Source: {} (env: {})",
                    request.data_source_name, request.env
                );
                println!("     Schema: {}", request.schema);
                if let Some(database) = &request.database {
                    println!("     Database: {}", database);
                }
                println!("     Columns: {}", request.columns.len());
                if let Some(rels) = &request.entity_relationships {
                    println!("     Relationships: {}", rels.len());
                }
            }
            return Ok(());
        }

        let client =
            client.expect("BusterClient should be initialized for non-dry-run deployments");
        progress.status = "Deploying models to Buster...".to_string();
        progress.log_progress();

        // Store data source name for error messages
        let data_source_name = deploy_requests[0].data_source_name.clone();

        // Log what we're trying to deploy
        println!("\n📦 Deploying {} models:", deploy_requests.len());
        for request in &deploy_requests {
            println!("   - Model: {} ", request.name);
            println!(
                "     Data Source: {} (env: {})",
                request.data_source_name, request.env
            );
            println!("     Schema: {}", request.schema);
            if let Some(database) = &request.database {
                println!("     Database: {}", database);
            }
            println!("     Columns: {}", request.columns.len());
            if let Some(rels) = &request.entity_relationships {
                println!("     Relationships: {}", rels.len());
            }
        }

        match client.deploy_datasets(deploy_requests).await {
            Ok(response) => {
                let mut has_validation_errors = false;

                // Process validation results
                for validation in &response.results {
                    // Find corresponding file from model mapping
                    let file = model_mappings
                        .iter()
                        .find(|m| m.model_name == validation.model_name)
                        .map(|m| m.file.clone())
                        .unwrap_or_else(|| "unknown".to_string());

                    if validation.success {
                        progress.log_validation_success(validation);
                        result.success.push((
                            file,
                            validation.model_name.clone(),
                            validation.data_source_name.clone(),
                        ));
                    } else {
                        has_validation_errors = true;
                        progress.log_validation_errors(validation);

                        // Collect all error messages
                        let error_messages: Vec<String> = validation
                            .errors
                            .iter()
                            .map(|e| e.message.clone())
                            .collect();

                        result
                            .failures
                            .push((file, validation.model_name.clone(), error_messages));
                    }
                }

                if has_validation_errors {
                    println!("\n❌ Deployment failed due to validation errors!");
                    println!("\n💡 Troubleshooting:");
                    println!("1. Check data source:");
                    println!("   - Verify '{}' exists in Buster", data_source_name);
                    println!("   - Confirm it has env='dev'");
                    println!("   - Check your access permissions");
                    println!("2. Check model definitions:");
                    println!("   - Validate SQL syntax");
                    println!("   - Verify column names match");
                    println!("3. Check relationships:");
                    println!("   - Ensure referenced models exist");
                    println!("   - Verify relationship types");
                    return Err(anyhow::anyhow!(
                        "Deployment failed due to validation errors"
                    ));
                }

                println!("\n✅ All models deployed successfully!");
            }
            Err(e) => {
                println!("\n❌ Deployment failed!");
                println!("Error: {}", e);
                println!("\n💡 Troubleshooting:");
                println!("1. Check data source:");
                println!("   - Verify '{}' exists in Buster", data_source_name);
                println!("   - Confirm it has env='dev'");
                println!("   - Check your access permissions");
                println!("2. Check model definitions:");
                println!("   - Validate SQL syntax");
                println!("   - Verify column names match");
                println!("3. Check relationships:");
                println!("   - Ensure referenced models exist");
                println!("   - Verify relationship types");
                return Err(anyhow::anyhow!("Failed to deploy models to Buster: {}", e));
            }
        }
    }

    // Report deployment results and return
    progress.log_summary(&result);
    
    if !result.failures.is_empty() {
        return Err(anyhow::anyhow!("Some models failed to deploy"));
    }

    Ok(())
}

// New helper function to find YML files recursively with exclusion support
fn find_yml_files_recursively(dir: &Path, config: Option<&BusterConfig>, progress: Option<&mut DeployProgress>) -> Result<Vec<PathBuf>> {
    let exclusion_manager = if let Some(cfg) = config {
        ExclusionManager::new(cfg)?
    } else {
        ExclusionManager::empty()
    };
    
    // Use our new unified file discovery function
    find_yml_files(dir, true, &exclusion_manager, progress)
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use std::fs;
    use tempfile::TempDir;

    // Helper function to create a temporary directory with test files
    async fn setup_test_dir() -> Result<TempDir> {
        let temp_dir = TempDir::new()?;
        Ok(temp_dir)
    }

    // Helper to create a test YAML file
    async fn create_test_yaml(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
        let path = dir.join(name);
        fs::write(&path, content)?;
        Ok(path)
    }

    // Helper to create a test SQL file
    async fn create_test_sql(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
        let path = dir.join(name);
        fs::write(&path, content)?;
        Ok(path)
    }

    #[tokio::test]
    async fn test_deploy_valid_project() -> Result<()> {
        let temp_dir = setup_test_dir().await?;

        // Create buster.yml
        let buster_yml = r#"
                data_source_name: "test_source"
                schema: "test_schema"
        "#;
        create_test_yaml(temp_dir.path(), "buster.yml", buster_yml).await?;

        // Create a valid model file
        let model_yml = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                entities: []
                dimensions:
                  - name: dim1
                    expr: "col1"
                    type: "string"
                    description: "First dimension"
                measures:
                  - name: measure1
                    expr: "col2"
                    agg: "sum"
                    description: "First measure"
        "#;
        create_test_yaml(temp_dir.path(), "test_model.yml", model_yml).await?;

        // Test dry run
        let result = deploy(Some(temp_dir.path().to_str().unwrap()), true, false).await;
        assert!(result.is_ok());

        Ok(())
    }

    #[tokio::test]
    async fn test_deploy_cross_project_references() -> Result<()> {
        let temp_dir = setup_test_dir().await?;

        // Create main project buster.yml
        let main_buster_yml = r#"
            data_source_name: "test_source"
            schema: "test_schema"
        "#;
        create_test_yaml(temp_dir.path(), "buster.yml", main_buster_yml).await?;

        // Create referenced project directory and buster.yml
        let ref_dir = temp_dir.path().join("referenced_project");
        fs::create_dir(&ref_dir)?;
        let ref_buster_yml = r#"
            data_source_name: "test_source"
            schema: "other_schema"
        "#;
        create_test_yaml(&ref_dir, "buster.yml", ref_buster_yml).await?;

        // Create model with cross-project reference
        let model_yml = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                entities:
                  - name: other_model
                    expr: "other_id"
                    type: "foreign"
                    description: "Reference to other model"
                    project_path: "referenced_project"
                dimensions: []
                measures: []
        "#;
        create_test_yaml(temp_dir.path(), "test_model.yml", model_yml).await?;

        // Test dry run
        let result = deploy(Some(temp_dir.path().to_str().unwrap()), true, false).await;
        assert!(result.is_ok());

        Ok(())
    }

    #[tokio::test]
    async fn test_deploy_invalid_cross_project_reference() -> Result<()> {
        let temp_dir = setup_test_dir().await?;

        // Create main project buster.yml
        let main_buster_yml = r#"
            data_source_name: "test_source"
            schema: "test_schema"
        "#;
        create_test_yaml(temp_dir.path(), "buster.yml", main_buster_yml).await?;

        // Create referenced project directory and buster.yml with different data source
        let ref_dir = temp_dir.path().join("referenced_project");
        fs::create_dir(&ref_dir)?;
        let ref_buster_yml = r#"
            data_source_name: "different_source"
            schema: "other_schema"
        "#;
        create_test_yaml(&ref_dir, "buster.yml", ref_buster_yml).await?;

        // Create model with cross-project reference
        let model_yml = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                entities:
                  - name: other_model
                    expr: "other_id"
                    type: "foreign"
                    description: "Reference to other model"
                    project_path: "referenced_project"
                dimensions: []
                measures: []
        "#;
        create_test_yaml(temp_dir.path(), "test_model.yml", model_yml).await?;

        // Test dry run - should fail due to data source mismatch
        let result = deploy(Some(temp_dir.path().to_str().unwrap()), true, false).await;
        assert!(result.is_err());

        Ok(())
    }

    #[tokio::test]
    async fn test_deploy_missing_referenced_project() -> Result<()> {
        let temp_dir = setup_test_dir().await?;

        // Create main project buster.yml
        let main_buster_yml = r#"
            data_source_name: "test_source"
            schema: "test_schema"
        "#;
        create_test_yaml(temp_dir.path(), "buster.yml", main_buster_yml).await?;

        // Create model with reference to non-existent project
        let model_yml = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                entities:
                  - name: other_model
                    expr: "other_id"
                    type: "foreign"
                    description: "Reference to other model"
                    project_path: "non_existent_project"
                dimensions: []
                measures: []
        "#;
        create_test_yaml(temp_dir.path(), "test_model.yml", model_yml).await?;

        // Test dry run - should fail due to missing project
        let result = deploy(Some(temp_dir.path().to_str().unwrap()), true, false).await;
        assert!(result.is_err());

        Ok(())
    }

    #[tokio::test]
    async fn test_deploy_multiple_models() -> Result<()> {
        let temp_dir = setup_test_dir().await?;

        // Create buster.yml
        let buster_yml = r#"
            data_source_name: "test_source"
            schema: "test_schema"
        "#;
        create_test_yaml(temp_dir.path(), "buster.yml", buster_yml).await?;

        // Create multiple model files
        for i in 1..=3 {
            let model_yml = format!(
                r#"
            version: 1
            models:
                  - name: test_model_{}
                    description: "Test model {}"
                entities: []
                dimensions:
                  - name: dim1
                    expr: "col1"
                    type: "string"
                    description: "First dimension"
                measures:
                  - name: measure1
                    expr: "col2"
                    agg: "sum"
                    description: "First measure"
            "#,
                i, i
            );
            create_test_yaml(
                temp_dir.path(),
                &format!("test_model_{}.yml", i),
                &model_yml,
            )
            .await?;
        }

        // Test dry run
        let result = deploy(Some(temp_dir.path().to_str().unwrap()), true, false).await;
        assert!(result.is_ok());

        Ok(())
    }

    #[tokio::test]
    async fn test_deploy_invalid_yaml() -> Result<()> {
        let temp_dir = setup_test_dir().await?;

        // Create buster.yml
        let buster_yml = r#"
                data_source_name: "test_source"
                schema: "test_schema"
        "#;
        create_test_yaml(temp_dir.path(), "buster.yml", buster_yml).await?;

        // Create invalid YAML file
        let invalid_yml = "this is not valid yaml: : : :";
        create_test_yaml(temp_dir.path(), "invalid_model.yml", invalid_yml).await?;

        // Test dry run - should fail due to invalid YAML
        let result = deploy(Some(temp_dir.path().to_str().unwrap()), true, false).await;
        assert!(result.is_err());

        Ok(())
    }

    #[tokio::test]
    async fn test_deploy_with_ref_field() -> Result<()> {
        let temp_dir = setup_test_dir().await?;

        // Create buster.yml
        let buster_yml = r#"
                data_source_name: "test_source"
                schema: "test_schema"
        "#;
        create_test_yaml(temp_dir.path(), "buster.yml", buster_yml).await?;

        // Create referenced model
        let referenced_model_yml = r#"
            version: 1
            models:
              - name: actual_model
                description: "Referenced model"
                entities: []
                dimensions: []
                measures: []
        "#;
        create_test_yaml(
            temp_dir.path(),
            "referenced_model.yml",
            referenced_model_yml,
        )
        .await?;

        // Create model with ref field
        let model_yml = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                entities:
                  - name: "User Model"
                    ref: "actual_model"
                    expr: "user_id"
                    type: "foreign"
                    description: "Reference to actual model"
                dimensions: []
                measures: []
        "#;
        create_test_yaml(temp_dir.path(), "test_model.yml", model_yml).await?;

        // Test dry run - should succeed because actual_model exists
        let result = deploy(Some(temp_dir.path().to_str().unwrap()), true, false).await;
        assert!(result.is_ok());

        Ok(())
    }

    #[tokio::test]
    async fn test_deploy_with_invalid_ref() -> Result<()> {
        let temp_dir = setup_test_dir().await?;

        // Create buster.yml
        let buster_yml = r#"
            data_source_name: "test_source"
                schema: "test_schema"
        "#;
        create_test_yaml(temp_dir.path(), "buster.yml", buster_yml).await?;

        // Create model with invalid ref
        let model_yml = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                entities:
                  - name: "User Model"
                    ref: "non_existent_model"
                    expr: "user_id"
                    type: "foreign"
                    description: "Reference to non-existent model"
                dimensions: []
                measures: []
        "#;
        create_test_yaml(temp_dir.path(), "test_model.yml", model_yml).await?;

        // Test dry run - should fail because referenced model doesn't exist
        let result = deploy(Some(temp_dir.path().to_str().unwrap()), true, false).await;
        assert!(result.is_err());

        Ok(())
    }
}

