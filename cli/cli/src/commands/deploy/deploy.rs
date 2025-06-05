use anyhow::{anyhow, Result};
use colored::*;
use std::fs;
use std::path::{Path, PathBuf};

use crate::commands::auth::check_authentication;
use crate::utils::{
    buster::{
        BusterClient, DeployDatasetsColumnsRequest, DeployDatasetsEntityRelationshipsRequest,
        DeployDatasetsRequest, DeployDatasetsResponse,
    },
    config::{BusterConfig, ProjectContext},
    file::buster_credentials::get_and_validate_buster_credentials,
};
use crate::utils::{find_yml_files, ExclusionManager, ProgressTracker};

// Import the semantic layer models
use semantic_layer::models::{Dimension, Measure, Model, Relationship};

#[derive(Debug, Default)]
pub struct DeployResult {
    success: Vec<(String, String, String)>, // (filename, model_name, data_source)
    failures: Vec<(String, String, Vec<String>)>, // (filename, model_name, errors)
    updated: Vec<(String, String, String)>, // (filename, model_name, data_source) - For models that were updated
    no_change: Vec<(String, String, String)>, // (filename, model_name, data_source) - For models that had no change
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
            self.processed,
            self.total_files,
            self.current_file.cyan()
        );
        if !self.status.is_empty() {
            println!("Status: {}", self.status.dimmed());
        }
    }

    fn log_error(&self, error: &str) {
        eprintln!(
            "❌ Error processing {}: {}",
            self.current_file.cyan(),
            error.red()
        );
    }

    fn log_success(&self) {
        println!(
            "✅ Successfully processed and validated: {}",
            self.current_file.cyan()
        );
    }

    fn log_validating(&self, validation_data: (&str, &str, &str)) {
        println!("\n🔍 Validating model: {}", validation_data.0.purple());
        println!("   Data Source: {}", validation_data.1.cyan());
        println!("   Schema: {}", validation_data.2.cyan());
    }

    fn log_excluded(&mut self, reason: &str) {
        self.excluded += 1;
        println!(
            "⚠️  Skipping {} ({})",
            self.current_file.cyan(),
            reason.yellow()
        );
    }

    fn log_summary(&self, result: &DeployResult) {
        println!("\n{}", "📊 Deployment Summary".bold().green());
        println!("======================================");
        println!(
            "Successfully deployed (new or updated): {} models",
            (result.success.len() + result.updated.len())
                .to_string()
                .green()
        );
        if !result.success.is_empty() {
            println!(
                "   ✨ New models deployed: {}",
                result.success.len().to_string().green()
            );
        }
        if !result.updated.is_empty() {
            println!(
                "   🔄 Models updated: {}",
                result.updated.len().to_string().cyan()
            );
        }
        if !result.no_change.is_empty() {
            println!(
                "   ➖ Models with no changes: {}",
                result.no_change.len().to_string().dimmed()
            );
        }

        if self.excluded > 0 {
            println!(
                "⛔ Excluded: {} models (due to patterns or tags)",
                self.excluded.to_string().yellow()
            );
        }

        if !result.failures.is_empty() {
            println!(
                "\n❌ Failed deployments: {} models",
                result.failures.len().to_string().red()
            );
            println!("--------------------------------------");
            for (file, model_name, errors) in &result.failures {
                println!(
                    "   - File: {} (Model: {})",
                    file.cyan(),
                    model_name.purple()
                );
                for error in errors {
                    println!("     Error: {}", error.red());
                }
            }
            println!("--------------------------------------");
        }
        println!("======================================");
        if result.failures.is_empty() {
            println!(
                "{}",
                "🎉 All specified models processed successfully!"
                    .bold()
                    .green()
            );
        } else {
            println!(
                "{}",
                "⚠️ Some models failed to deploy. Please check the errors above."
                    .bold()
                    .yellow()
            );
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
        println!(
            "⛔ Excluding file: {} (matched excluded tag: {})",
            path, tag
        );
    }
}

/// Parse a YAML model file into semantic_layer::Model structs
pub fn parse_model_file(file_path: &Path) -> Result<Vec<Model>> {
    let yml_content = std::fs::read_to_string(file_path)?;

    // First try parsing as a SemanticLayerSpec (with top-level 'models' key)
    match serde_yaml::from_str::<Model>(&yml_content) {
        Ok(model) => Ok(vec![model]),
        Err(_) => {
            // If that fails, try parsing as a single Model
            match serde_yaml::from_str::<Model>(&yml_content) {
                Ok(model) => Ok(vec![model]),
                Err(e) => Err(anyhow!(
                    "Failed to parse model file {}: {}",
                    file_path.display(),
                    e
                )),
            }
        }
    }
}

/// Resolve configurations for a model using the precedence:
/// 1. Values in the model itself
/// 2. Values from the project context
/// 3. Values from the global config
pub fn resolve_model_configurations(
    models_with_context: Vec<(Model, Option<&ProjectContext>)>,
    global_buster_config: &BusterConfig,
) -> Result<Vec<Model>> {
    let mut resolved_models = Vec::new();

    for (mut model, proj_config_opt) in models_with_context {
        // Resolve data_source_name
        let resolved_ds_name = model
            .data_source_name
            .clone()
            .or_else(|| proj_config_opt.and_then(|pc| pc.data_source_name.clone()))
            .or_else(|| global_buster_config.data_source_name.clone());

        // Resolve schema
        let resolved_schema = model
            .schema
            .clone()
            .or_else(|| proj_config_opt.and_then(|pc| pc.schema.clone()))
            .or_else(|| global_buster_config.schema.clone());

        // Resolve database
        let resolved_database = model
            .database
            .clone()
            .or_else(|| proj_config_opt.and_then(|pc| pc.database.clone()))
            .or_else(|| global_buster_config.database.clone());

        // Validation: schema and data_source_name are essential for API processing
        if resolved_ds_name.is_none() {
            return Err(anyhow!(
                "Model '{}': data_source_name could not be resolved.",
                model.name
            ));
        }
        if resolved_schema.is_none() {
            return Err(anyhow!(
                "Model '{}': schema could not be resolved.",
                model.name
            ));
        }

        model.data_source_name = resolved_ds_name;
        model.schema = resolved_schema;
        model.database = resolved_database;

        // CLI Validations
        if model.name.is_empty() {
            return Err(anyhow!("Found a model with an empty name."));
        }

        resolved_models.push(model);
    }
    Ok(resolved_models)
}

/// Check if a file should be excluded based on tags in SQL content
fn check_excluded_tags(sql_path: &Option<PathBuf>, exclude_tags: &[String]) -> Result<bool> {
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
        model_paths: None,
        projects: None,
        semantic_model_paths: None,
    };

    let manager = ExclusionManager::new(&temp_config)?;
    let (should_exclude, _) = manager.should_exclude_by_tags(&content);

    Ok(should_exclude)
}

/// Find the associated SQL file for a model by searching configured model_paths.
fn find_sql_file_in_model_paths(
    model_name: &str,
    config: Option<&BusterConfig>,
    project_ctx: Option<&ProjectContext>,
    base_dir_for_model_paths: &Path,
) -> Option<PathBuf> {
    let mut search_paths_str: Vec<String> = Vec::new();

    // Prefer project-specific model_paths if available
    if let Some(pc) = project_ctx {
        if let Some(ref paths) = pc.model_paths {
            search_paths_str.extend(paths.iter().cloned());
        }
    }

    // If no project-specific paths, or if they were empty, try global model_paths
    if search_paths_str.is_empty() {
        if let Some(cfg) = config {
            if let Some(ref paths) = cfg.model_paths {
                search_paths_str.extend(paths.iter().cloned());
            }
        }
    }

    if search_paths_str.is_empty() {
        // No model_paths configured to search in.
        return None;
    }

    for path_str in search_paths_str {
        let dir_path = base_dir_for_model_paths.join(&path_str); // path_str is relative to buster.yml dir
        if dir_path.is_dir() {
            let sql_file_name = format!("{}.sql", model_name);
            let sql_file_path = dir_path.join(&sql_file_name);
            if sql_file_path.is_file() {
                // is_file() checks for existence and that it's a file
                println!(
                    "   {} Found SQL file for model '{}' at: {}",
                    "➡️".dimmed(),
                    model_name.purple(),
                    sql_file_path.display().to_string().dimmed()
                );
                return Some(sql_file_path);
            }
        } else {
            // Log if a configured model_path is not a directory, as we expect directories here.
            // However, model_paths can also point to specific YML files for model discovery,
            // so this might be noisy if not distinguished. For SQL lookup, we need dirs.
            // For now, let's assume model_paths used for SQL search should be directories.
            // println!("Configured model_path '{}' (resolved to '{}') is not a directory, skipping for SQL search.", path_str, dir_path.display());
        }
    }
    None
}

/// Generate default SQL content for a model when no SQL file is found
fn generate_default_sql(model: &Model) -> String {
    format!(
        "SELECT * FROM {}{}.{}",
        model
            .database
            .as_ref()
            .map(|db| format!("{}.", db))
            .unwrap_or_default(),
        model
            .schema
            .as_ref()
            .expect("Schema should be resolved by resolve_model_configurations"),
        model.name
    )
}

/// Get SQL content for a model.
/// It first tries to find a {model_name}.sql file in configured `model_paths`.
/// If not found, it generates a default "SELECT * FROM ..." query.
fn get_sql_content_for_model(
    model: &Model,
    buster_config: Option<&BusterConfig>,
    project_ctx_opt: Option<&ProjectContext>,
    effective_buster_config_dir: &Path, // Base directory for resolving model_paths from config
    yml_path_of_model: &Path, // Path of the .yml file that defined this model, for context in warnings
) -> Result<String> {
    // Attempt 1: Search in model_paths
    if let Some(sql_path) = find_sql_file_in_model_paths(
        &model.name,
        buster_config,
        project_ctx_opt,
        effective_buster_config_dir,
    ) {
        return fs::read_to_string(&sql_path).map_err(|e| {
            anyhow!(
                "Found SQL file for model '{}' at {} but failed to read it: {}",
                model.name,
                sql_path.display(),
                e
            )
        });
    }

    // If not found via model_paths or if model_paths were not configured:
    println!(
        "   {} No .sql file found for model '{}' in configured model_paths (searched relative to '{}'). File defining model: {}. {}",
        "⚠️".yellow(),
        model.name.yellow(),
        effective_buster_config_dir.display().to_string().dimmed(),
        yml_path_of_model.display().to_string().dimmed(),
        "Generating default SQL.".yellow()
    );
    Ok(generate_default_sql(model))
}

/// Convert the semantic_layer::Model to BusterClient's DeployDatasetsRequest
fn to_deploy_request(model: &Model, sql_content: String) -> DeployDatasetsRequest {
    let mut columns = Vec::new();

    // Convert dimensions to columns
    for dim in &model.dimensions {
        columns.push(DeployDatasetsColumnsRequest {
            name: dim.name.clone(),
            description: dim.description.clone().unwrap_or_default(),
            semantic_type: Some("dimension".to_string()),
            expr: None, // Dimension doesn't have a direct `expr` in semantic_layer::Model that maps here
            type_: dim.type_.clone(),
            agg: None, // Dimensions typically don't have aggregation functions
            searchable: dim.searchable,
        });
    }

    // Convert measures to columns
    for measure in &model.measures {
        columns.push(DeployDatasetsColumnsRequest {
            name: measure.name.clone(),
            description: measure.description.clone().unwrap_or_default(),
            semantic_type: Some("measure".to_string()),
            expr: None, // Measure doesn't have a direct `expr` in semantic_layer::Model that maps here, measures are typically simple column references or aggregations defined by their type/agg
            type_: measure.type_.clone(),
            // Measures might have an implicit aggregation (like SUM, AVG) based on their type or usage,
            // but semantic_layer::Measure doesn't explicitly store an `agg` field like `DeployDatasetsColumnsRequest` expects.
            // This might need further refinement based on how `agg` should be derived for measures.
            agg: None,         // Placeholder for now
            searchable: false, // Measures are typically not directly searched upon like free-text dimensions
        });
    }

    // Note: Relationships are now preserved in the yml_file field rather than being converted to entity_relationships.
    // This allows the full semantic model structure (including relationships with all their metadata like 
    // cardinality, descriptions, etc.) to be preserved and processed by the backend.

    let data_source_name = model.data_source_name.clone()
        .expect("data_source_name missing after validation, should be resolved by resolve_model_configurations");
    let schema = model.schema.clone().expect(
        "schema missing after validation, should be resolved by resolve_model_configurations",
    );

    // Serialize the input Model to YAML to be stored in the yml_file field of the request.
    // This captures the full semantic definition as sent, including relationships with all their metadata.
    let yml_content_for_request = serde_yaml::to_string(&model).unwrap_or_else(|e| {
        eprintln!(
            "Error serializing model {} to YAML for deploy request: {}. Using empty string.",
            model.name, e
        );
        String::new()
    });

    DeployDatasetsRequest {
        id: None,
        data_source_name,
        env: "dev".to_string(), // Assuming "dev" environment for now, might need configuration
        type_: "view".to_string(), // Assuming models are deployed as views, might need configuration
        name: model.name.clone(),
        model: Some(model.name.clone()), // Use the model's name for the 'model' field
        schema,
        database: model.database.clone(),
        description: model.description.clone().unwrap_or_default(),
        sql_definition: Some(sql_content),
        entity_relationships: None, // Relationships are now preserved in yml_file instead
        columns,
        yml_file: Some(yml_content_for_request), // Store the YAML of the model being deployed
    }
}

pub async fn deploy(path: Option<&str>, dry_run: bool, recursive: bool) -> Result<()> {
    check_authentication().await?;

    let current_dir = std::env::current_dir()?;
    println!(
        "\n{}",
        "🚀 Starting Buster Deployment Process...".bold().blue()
    );
    println!(
        "Working directory: {}",
        current_dir.display().to_string().dimmed()
    );

    let buster_config_load_dir = path
        .map(PathBuf::from)
        .unwrap_or_else(|| current_dir.clone());

    let mut progress = DeployProgress::new(0);
    let mut result = DeployResult::default();

    let client = if !dry_run {
        let creds = get_and_validate_buster_credentials().await?;
        Some(BusterClient::new(creds.url, creds.api_key)?)
    } else {
        None
    };

    progress.status = "Looking for buster.yml configuration...".to_string();
    progress.log_progress();

    let buster_config = match BusterConfig::load_from_dir(&buster_config_load_dir) {
        Ok(Some(cfg)) => {
            println!(
                "✅ Found buster.yml configuration at {}",
                buster_config_load_dir.join("buster.yml").display()
            );
            Some(cfg)
        }
        Ok(None) => {
            println!("ℹ️  No buster.yml found in {}, will require full configuration in model files or use defaults.", buster_config_load_dir.display().to_string().yellow());
            None
        }
        Err(e) => {
            println!(
                "⚠️  Error reading buster.yml: {}. Proceeding without it.",
                e.to_string().yellow()
            );
            None
        }
    };

    let effective_buster_config_dir =
        BusterConfig::base_dir(&buster_config_load_dir.join("buster.yml"))
            .unwrap_or(buster_config_load_dir.clone());

    let mut deploy_requests_final: Vec<DeployDatasetsRequest> = Vec::new();
    let mut model_mappings_final: Vec<ModelMapping> = Vec::new();
    let mut processed_models_from_spec = false;

    // --- PRIMARY PATH: Iterate through projects and use semantic_models_file if available ---
    if let Some(ref cfg) = buster_config {
        if let Some(ref projects) = cfg.projects {
            for project_ctx in projects {
                if let Some(ref semantic_model_dirs) = project_ctx.semantic_model_paths {
                    for semantic_models_dir_str in semantic_model_dirs {
                        println!(
                            "\n{}",
                            format!(
                                "🔍 Scanning semantic model directory for project '{}': {}",
                                project_ctx.identifier().cyan(),
                                semantic_models_dir_str.cyan()
                            )
                            .dimmed()
                        );
                        let semantic_models_dir_path =
                            effective_buster_config_dir.join(semantic_models_dir_str);

                        if !semantic_models_dir_path.is_dir() {
                            let error_msg = format!("Specified semantic model path is not a directory or does not exist for project '{}': {}", project_ctx.identifier(), semantic_models_dir_path.display());
                            eprintln!("❌ {}", error_msg.red());
                            result.failures.push((
                                semantic_models_dir_path.to_string_lossy().into_owned(),
                                format!("project_{}_dir_not_found", project_ctx.identifier()),
                                vec![error_msg],
                            ));
                            continue; // Continue to the next directory or project
                        }

                        // Scan this directory for .yml files
                        // Using a temporary ExclusionManager as deploy_individual_yml_files does, or simplify if not needed here.
                        let exclusion_manager = ExclusionManager::new(cfg)
                            .unwrap_or_else(|_| ExclusionManager::empty());
                        let yml_files_in_dir = match find_yml_files(
                            &semantic_models_dir_path,
                            true,
                            &exclusion_manager,
                            Some(&mut progress),
                        ) {
                            // Assuming recursive scan for now
                            Ok(files) => files,
                            Err(e) => {
                                progress.log_error(&format!("Failed to scan for YML files in directory '{}' for project '{}': {}", semantic_models_dir_path.display(), project_ctx.identifier(), e));
                                result.failures.push((
                                    semantic_models_dir_path.to_string_lossy().into_owned(),
                                    format!("project_{}_scan_failed", project_ctx.identifier()),
                                    vec![e.to_string()],
                                ));
                                continue; // Next directory or project
                            }
                        };

                        if yml_files_in_dir.is_empty() {
                            println!(
                                "ℹ️  No .yml files found in directory: {}",
                                semantic_models_dir_path.display().to_string().dimmed()
                            );
                            continue;
                        }

                        processed_models_from_spec = true; // Mark that we are processing based on config
                        progress.total_files += yml_files_in_dir.len();

                        for yml_file_path in yml_files_in_dir {
                            progress.current_file = yml_file_path
                                .strip_prefix(&effective_buster_config_dir)
                                .unwrap_or(&yml_file_path)
                                .to_string_lossy()
                                .into_owned();
                            progress.status = format!(
                                "Parsing models from '{}' in project '{}'...",
                                yml_file_path
                                    .file_name()
                                    .unwrap_or_default()
                                    .to_string_lossy(),
                                project_ctx.identifier().cyan()
                            );
                            progress.log_progress();

                            let parsed_models = match parse_model_file(&yml_file_path) {
                                Ok(m) => m,
                                Err(e) => {
                                    progress.log_error(&format!(
                                        "Failed to parse model file '{}': {}",
                                        yml_file_path.display(),
                                        e
                                    ));
                                    result.failures.push((
                                        progress.current_file.clone(),
                                        "parse_failed".to_string(),
                                        vec![e.to_string()],
                                    ));
                                    continue;
                                }
                            };

                            let models_with_context: Vec<(Model, Option<&ProjectContext>)> =
                                parsed_models
                                    .into_iter()
                                    .map(|m| (m, Some(project_ctx)))
                                    .collect();

                            let resolved_models =
                                match resolve_model_configurations(models_with_context, cfg) {
                                    Ok(models) => models,
                                    Err(e) => {
                                        progress.log_error(&format!(
                                            "Config resolution for '{}': {}",
                                            yml_file_path.display(),
                                            e
                                        ));
                                        result.failures.push((
                                            progress.current_file.clone(),
                                            "config_resolution_failed".to_string(),
                                            vec![e.to_string()],
                                        ));
                                        continue;
                                    }
                                };

                            for model in resolved_models {
                                progress.processed += 1;
                                progress.current_file = format!(
                                    "{} (from {} in project '{}')",
                                    model.name.purple(),
                                    yml_file_path
                                        .file_name()
                                        .unwrap_or_default()
                                        .to_string_lossy(),
                                    project_ctx.identifier().cyan()
                                );
                                progress.status =
                                    format!("Resolving SQL for model '{}'", model.name.purple());
                                progress.log_progress();

                                let sql_content = match get_sql_content_for_model(
                                    &model,
                                    Some(cfg),
                                    Some(project_ctx),
                                    &effective_buster_config_dir,
                                    &yml_file_path,
                                ) {
                                    Ok(content) => content,
                                    Err(e) => {
                                        progress.log_error(&format!(
                                            "Failed to get SQL for model {}: {}",
                                            model.name.purple(),
                                            e
                                        ));
                                        result.failures.push((
                                            progress.current_file.clone(),
                                            model.name.clone(),
                                            vec![e.to_string()],
                                        ));
                                        continue;
                                    }
                                };

                                model_mappings_final.push(ModelMapping {
                                    file: yml_file_path
                                        .file_name()
                                        .unwrap_or_default()
                                        .to_string_lossy()
                                        .into_owned(),
                                    model_name: model.name.clone(),
                                });
                                deploy_requests_final.push(to_deploy_request(&model, sql_content));
                                println!(
                                    "   {} Model '{}' prepared for deployment.",
                                    "👍".green(),
                                    model.name.purple()
                                );
                            }
                        }
                    }
                } else {
                    // This project_ctx has no semantic_model_paths defined.
                    // It will be handled by the fallback mechanism if no other projects define paths.
                }
            }
        }
    }

    // --- FALLBACK or ADDITIONAL: Scan for individual .yml files ---
    if !processed_models_from_spec {
        // Check if any project *attempted* to specify paths, to adjust message
        let any_project_had_paths_configured = buster_config.as_ref().map_or(false, |cfg| {
            cfg.projects.as_ref().map_or(false, |p_vec| {
                p_vec.iter().any(|pc| {
                    pc.semantic_model_paths
                        .as_ref()
                        .map_or(false, |paths| !paths.is_empty())
                })
            })
        });

        if any_project_had_paths_configured {
            println!("⚠️  Semantic model paths were specified in buster.yml project(s) but may have failed to yield models or directories were empty/inaccessible. Now attempting to scan for individual .yml files based on broader model_paths configuration.");
        } else if buster_config.is_some() {
            println!("ℹ️  No specific semantic_model_paths found or processed from projects in buster.yml. Falling back to scanning for individual .yml files based on model_paths.");
        } else {
            println!("ℹ️  No buster.yml loaded. Scanning current/target directory for individual .yml files.");
        }

        deploy_individual_yml_files(
            buster_config.as_ref(),
            &effective_buster_config_dir, // Use effective_buster_config_dir as the base for resolving model_paths
            recursive,
            &mut progress,
            &mut result,
            &mut deploy_requests_final,
            &mut model_mappings_final,
        )
        .await?;
    } else {
        println!("{}", "\nℹ️  Processed models from semantic_model_paths specified in buster.yml. Skipping scan for individual .yml files.".dimmed());
    }

    // --- DEPLOYMENT TO API (remains largely the same, uses deploy_requests_final and model_mappings_final) ---
    if !deploy_requests_final.is_empty() {
        if dry_run {
            println!(
                "\n{}",
                "🔍 Dry Run Mode Activated. No changes will be made."
                    .bold()
                    .yellow()
            );
            println!(
                "📦 Would attempt to deploy {} models:",
                deploy_requests_final.len()
            );
            for request in &deploy_requests_final {
                println!("  -------------------------------------");
                println!("  Model Name:      {}", request.name.purple());
                println!("  Data Source:   {}", request.data_source_name.cyan());
                println!("  Schema:          {}", request.schema.cyan());
                if let Some(db) = &request.database {
                    println!("  Database:        {}", db.cyan());
                }
                println!("  Description:     {}", request.description.dimmed());
                println!("  Columns:         {}", request.columns.len());
                if request
                    .entity_relationships
                    .as_ref()
                    .map_or(false, |er| !er.is_empty())
                {
                    println!(
                        "  Relationships:   {}",
                        request.entity_relationships.as_ref().unwrap().len()
                    );
                }
                // Optionally print SQL or YML content if needed for dry run, but can be verbose
                // println!("  SQL Definition:\n{}", request.sql_definition.as_deref().unwrap_or("N/A"));
                // println!("  YML Content:\n{}", request.yml_file.as_deref().unwrap_or("N/A"));
            }
            println!("  -------------------------------------");
            println!("{}", "✅ Dry run validation complete.".green());
            return Ok(());
        }

        println!(
            "\n{}",
            format!(
                "🚀 Deploying {} models to Buster Cloud...",
                deploy_requests_final.len()
            )
            .bold()
            .blue()
        );
        let client = client.expect("BusterClient should be initialized for non-dry run");
        // ... (rest of deployment logic, calling client.deploy_datasets(deploy_requests_final).await ...)
        // ... (handle_deploy_response(&response, &mut result, &model_mappings_final, &progress)) ...
        match client.deploy_datasets(deploy_requests_final).await {
            Ok(response) => {
                handle_deploy_response(&response, &mut result, &model_mappings_final, &progress)
            }
            Err(e) => {
                eprintln!(
                    "❌ Critical error during deployment API call: {}\nDetailed error: {:?}",
                    e.to_string().red(),
                    e
                );
                // Populate failures for all models that were attempted if a general API error occurs
                for mapping in model_mappings_final {
                    result.failures.push((
                        mapping.file.clone(),
                        mapping.model_name.clone(),
                        vec![format!("API deployment failed: {}", e)],
                    ));
                }
            }
        }
    } else {
        println!("\n{}", "🤷 No models found to deploy.".yellow());
    }

    progress.log_summary(&result);
    if !result.failures.is_empty() {
        return Err(anyhow!("Some models failed to deploy"));
    }
    Ok(())
}

// New helper function for the fallback logic (deploying individual YML files)
async fn deploy_individual_yml_files(
    buster_config: Option<&BusterConfig>,
    base_search_dir: &Path, // Base directory to search for YMLs or use from config's model_paths
    recursive: bool,
    progress: &mut DeployProgress,
    result: &mut DeployResult,
    deploy_requests_final: &mut Vec<DeployDatasetsRequest>,
    model_mappings_final: &mut Vec<ModelMapping>,
) -> Result<()> {
    let exclusion_manager = if let Some(cfg) = buster_config {
        ExclusionManager::new(cfg)?
    } else {
        ExclusionManager::empty()
    };

    // Collect all files to process, associating them with their project context if found.
    let mut files_to_process_with_context: Vec<(PathBuf, Option<&ProjectContext>)> = Vec::new();

    if let Some(cfg) = buster_config {
        let effective_paths_with_contexts = cfg.resolve_effective_model_paths(base_search_dir);
        if !effective_paths_with_contexts.is_empty() {
            println!(
                "\n{}",
                "ℹ️  Using effective model paths for individual .yml scan:".dimmed()
            );
            for (path, project_ctx_opt) in effective_paths_with_contexts {
                // Log the path and its associated project context identifier if available
                let context_identifier = project_ctx_opt
                    .map_or_else(|| "Global/Default".to_string(), |ctx| ctx.identifier());
                println!(
                    "   - Path: {}, Context: {}",
                    path.display(),
                    context_identifier.dimmed()
                );

                if path.is_dir() {
                    match find_yml_files(&path, recursive, &exclusion_manager, Some(progress)) {
                        Ok(files_in_dir) => {
                            for f in files_in_dir {
                                files_to_process_with_context.push((f, project_ctx_opt));
                            }
                        }
                        Err(e) => eprintln!(
                            "Error finding YML files in {}: {}",
                            path.display(),
                            format!("{}", e).red()
                        ),
                    }
                } else if path.is_file()
                    && path.extension().and_then(|ext| ext.to_str()) == Some("yml")
                {
                    if path.file_name().and_then(|name| name.to_str()) != Some("buster.yml") {
                        files_to_process_with_context.push((path.clone(), project_ctx_opt));
                    }
                }
            }
        } else {
            // No effective paths from config, scan base_search_dir with no specific project context.
            match find_yml_files(
                base_search_dir,
                recursive,
                &exclusion_manager,
                Some(progress),
            ) {
                Ok(files_in_dir) => {
                    for f in files_in_dir {
                        files_to_process_with_context.push((f, None));
                    }
                }
                Err(e) => eprintln!(
                    "Error finding YML files in {}: {}",
                    base_search_dir.display(),
                    format!("{}", e).red()
                ),
            }
        }
    } else {
        // No buster_config at all, scan base_search_dir with no project context.
        match find_yml_files(
            base_search_dir,
            recursive,
            &exclusion_manager,
            Some(progress),
        ) {
            Ok(files_in_dir) => {
                for f in files_in_dir {
                    files_to_process_with_context.push((f, None));
                }
            }
            Err(e) => eprintln!(
                "Error finding YML files in {}: {}",
                base_search_dir.display(),
                format!("{}", e).red()
            ),
        }
    };

    println!(
        "\nFound {} individual model .yml files to process.",
        files_to_process_with_context.len().to_string().cyan()
    );
    progress.total_files = files_to_process_with_context.len(); // Reset total files for this phase
    progress.processed = 0; // Reset processed for this phase

    for (yml_path, project_ctx_opt) in files_to_process_with_context {
        progress.processed += 1;
        progress.current_file = yml_path
            .strip_prefix(base_search_dir)
            .unwrap_or(&yml_path)
            .to_string_lossy()
            .into_owned();
        progress.status = "Parsing individual model file...".to_string();
        progress.log_progress();

        let parsed_models = match parse_model_file(&yml_path) {
            // parse_model_file handles single or multi-model in one yml
            Ok(models) => models,
            Err(e) => {
                progress.log_error(&format!("Failed to parse model file: {}", e));
                result.failures.push((
                    progress.current_file.clone(),
                    "unknown".to_string(),
                    vec![e.to_string()],
                ));
                continue;
            }
        };

        let models_with_context: Vec<(Model, Option<&ProjectContext>)> = parsed_models
            .into_iter()
            .map(|m| (m, project_ctx_opt))
            .collect();

        let resolved_models = match resolve_model_configurations(
            models_with_context,
            buster_config.unwrap_or(&BusterConfig::default()),
        ) {
            Ok(models) => models,
            Err(e) => {
                progress.log_error(&format!("Configuration resolution failed: {}", e));
                result.failures.push((
                    progress.current_file.clone(),
                    "multiple".to_string(),
                    vec![e.to_string()],
                ));
                continue;
            }
        };

        for model in resolved_models {
            // Use effective_buster_config_dir for resolving SQL paths if original_file_path is used
            // For find_sql_file, yml_path is the context
            let sql_content = match get_sql_content_for_model(
                &model,
                buster_config,
                project_ctx_opt,
                base_search_dir,
                &yml_path,
            ) {
                Ok(content) => content,
                Err(e) => {
                    progress.log_error(&format!(
                        "Failed to get SQL for model {}: {}",
                        model.name.purple(),
                        e
                    ));
                    result.failures.push((
                        progress.current_file.clone(),
                        model.name.clone(),
                        vec![e.to_string()],
                    ));
                    continue;
                }
            };
            model_mappings_final.push(ModelMapping {
                file: progress.current_file.clone(),
                model_name: model.name.clone(),
            });
            deploy_requests_final.push(to_deploy_request(&model, sql_content));
            println!(
                "   {} Model '{}' prepared from individual file.",
                "👍".green(),
                model.name.purple()
            );
        }
    }
    Ok(())
}

/// Helper function to handle the deployment response
fn handle_deploy_response(
    response: &DeployDatasetsResponse,
    result: &mut DeployResult,
    model_mappings: &[ModelMapping],
    progress: &DeployProgress,
) {
    let mut has_validation_errors = false;

    // Process validation results
    println!(
        "\n{}",
        "🔬 Processing deployment results from Buster Cloud...".dimmed()
    );
    for validation in response.results.iter() {
        // Find corresponding file from model mapping
        let file = model_mappings
            .iter()
            .find(|m| m.model_name == validation.model_name)
            .map(|m| m.file.clone())
            .unwrap_or_else(|| "<unknown file>".to_string());

        progress.log_validating((
            &validation.model_name,
            &validation.data_source_name,
            &validation.schema,
        ));

        if validation.success {
            // Check if it's a new deployment or an update based on previous state (if tracked)
            // For now, we'll simplify. If API says success, it's either new or successfully updated (no-op or actual change).
            // We can differentiate further if the API provides more info or if we compare with a previous state.

            // Let's assume for now the API doesn't tell us if it was new/update/no-change directly in this part of response.
            // We will base it on whether an ID was present in the request (implying update) or not (implying create).
            // This is a simplification as the `id` field in `DeployDatasetsRequest` is `Option<String>` and might be `None` even for updates if not managed by CLI state.
            // A more robust way would be to check if the model already existed by querying Buster first, or if the API response itself differentiates.

            // For simplicity here, we'll assume all successes from API are either new or updated.
            // The `DeployResult` struct could be enhanced to better differentiate if needed by tracking initial state or from richer API responses.

            // If we had an ID in the original request for this model, it implies it was an update attempt.
            // For now, just add to generic success. We can refine later.
            result.success.push((
                file,
                validation.model_name.clone(),
                validation.data_source_name.clone(),
            ));
        } else {
            has_validation_errors = true;
            eprintln!(
                "❌ Validation failed for model: {}",
                validation.model_name.purple()
            );

            if !validation.errors.is_empty() {
                eprintln!("   Errors:");
                for error in &validation.errors {
                    eprintln!("     - {:?}: {}", error.error_type, error.message);
                    if let Some(col) = &error.column_name {
                        eprintln!("       Column: {}", col.yellow());
                    }
                }

                // Print suggestions if any
                let suggestions: Vec<_> = validation
                    .errors
                    .iter()
                    .filter_map(|e| e.suggestion.as_ref())
                    .collect();

                if !suggestions.is_empty() {
                    eprintln!("\n💡 Suggestions:");
                    for suggestion in suggestions {
                        eprintln!("   - {}", suggestion);
                    }
                }
            }

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
        // This message is now part of the summary
        // println!("\n❌ Deployment failed due to validation errors!");
        // println!("\n💡 Troubleshooting:");
        // println!("1. Check data source");
        // println!("2. Check model definitions");
        // println!("3. Check relationships");
    } else {
        // This message is now part of the summary
        // println!("\n✅ All models deployed successfully!");
    }
}

fn parse_semantic_layer_spec(file_path: &Path) -> Result<Model> {
    let yml_content = fs::read_to_string(file_path).map_err(|e| {
        anyhow!(
            "Failed to read semantic layer spec file {}: {}",
            file_path.display(),
            e
        )
    })?;
    serde_yaml::from_str::<Model>(&yml_content).map_err(|e| {
        anyhow!(
            "Failed to parse semantic layer spec from {}: {}",
            file_path.display(),
            e
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;
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

    #[test]
    fn test_parse_model_file() -> Result<()> {
        let temp_dir = TempDir::new()?;

        let single_model_yml = r#"
name: test_model
description: "Test model"

dimensions:
  - name: dim1
    description: "First dimension"
    type: "string"
measures:
  - name: measure1
    description: "First measure"
    type: "number"
        "#;

        let single_model_path = temp_dir.path().join("single_model.yml");
        fs::write(&single_model_path, single_model_yml)?;

        let models = parse_model_file(&single_model_path)?;
        assert_eq!(models.len(), 1);
        assert_eq!(models[0].name, "test_model");

        let multi_model_yml = r#"
models:
  - name: model1
    description: "First model"
    dimensions:
      - name: dim1
        description: "First dimension"
        type: "string"
  - name: model2
    description: "Second model"
    measures:
      - name: measure1
        description: "First measure"
        type: "number"
        "#;

        let multi_model_path = temp_dir.path().join("multi_model.yml");
        fs::write(&multi_model_path, multi_model_yml)?;

        let models = parse_model_file(&multi_model_path)?;
        assert_eq!(models.len(), 2);
        assert_eq!(models[0].name, "model1");
        assert_eq!(models[1].name, "model2");

        Ok(())
    }

    #[test]
    fn test_resolve_model_configurations() -> Result<()> {
        let model1 = Model {
            name: "model1".to_string(),
            description: Some("Model 1".to_string()),
            data_source_name: Some("model1_ds".to_string()),
            database: None,
            schema: None,
            dimensions: vec![],
            measures: vec![],
            metrics: vec![],
            filters: vec![],
            relationships: vec![],
        };

        let model2 = Model {
            name: "model2".to_string(),
            description: Some("Model 2".to_string()),
            data_source_name: None,
            database: Some("model2_db".to_string()),
            schema: None,
            dimensions: vec![],
            measures: vec![],
            metrics: vec![],
            filters: vec![],
            relationships: vec![],
        };

        let model3 = Model {
            name: "model3".to_string(),
            description: Some("Model 3".to_string()),
            data_source_name: None,
            database: None,
            schema: None,
            dimensions: vec![],
            measures: vec![],
            metrics: vec![],
            filters: vec![],
            relationships: vec![],
        };

        let project_context = ProjectContext {
            data_source_name: Some("project_ds".to_string()),
            schema: Some("project_schema".to_string()),
            database: None,
            exclude_files: None,
            exclude_tags: None,
            model_paths: None,
            name: Some("Test Project".to_string()),
            semantic_model_paths: None,
        };

        let global_config = BusterConfig {
            data_source_name: Some("global_ds".to_string()),
            schema: Some("global_schema".to_string()),
            database: Some("global_db".to_string()),
            exclude_files: None,
            exclude_tags: None,
            model_paths: None,
            semantic_model_paths: None,
            projects: None,
        };

        let models_with_context = vec![
            (model1, Some(&project_context)),
            (model2, Some(&project_context)),
            (model3, None),
        ];

        let resolved_models = resolve_model_configurations(models_with_context, &global_config)?;

        assert_eq!(
            resolved_models[0].data_source_name,
            Some("model1_ds".to_string())
        );
        assert_eq!(
            resolved_models[0].schema,
            Some("project_schema".to_string())
        );
        assert_eq!(resolved_models[0].database, Some("global_db".to_string()));

        assert_eq!(
            resolved_models[1].data_source_name,
            Some("project_ds".to_string())
        );
        assert_eq!(
            resolved_models[1].schema,
            Some("project_schema".to_string())
        );
        assert_eq!(resolved_models[1].database, Some("model2_db".to_string()));

        assert_eq!(
            resolved_models[2].data_source_name,
            Some("global_ds".to_string())
        );
        assert_eq!(resolved_models[2].schema, Some("global_schema".to_string()));
        assert_eq!(resolved_models[2].database, Some("global_db".to_string()));

        Ok(())
    }

    #[test]
    fn test_to_deploy_request() -> Result<()> {
        let model = Model {
            name: "test_model".to_string(),
            description: Some("Test model".to_string()),
            data_source_name: Some("test_source".to_string()),
            database: Some("test_db".to_string()),
            schema: Some("test_schema".to_string()),
            dimensions: vec![Dimension {
                name: "dim1".to_string(),
                description: Some("First dimension".to_string()),
                type_: Some("string".to_string()),
                searchable: true, // Example value
                options: None,
            }],
            measures: vec![Measure {
                name: "measure1".to_string(),
                description: Some("First measure".to_string()),
                type_: Some("number".to_string()),
            }],
            metrics: vec![],
            filters: vec![],
            relationships: vec![],
        };

        let sql_content = "SELECT * FROM test_schema.test_model";
        let request = to_deploy_request(&model, sql_content.to_string());

        assert_eq!(request.name, "test_model");
        assert_eq!(request.columns.len(), 2); // 1 dim, 1 measure
        assert_eq!(request.columns[0].name, "dim1");
        assert_eq!(request.columns[0].searchable, true);
        assert_eq!(request.columns[1].name, "measure1");
        // The model has empty relationships, so entity_relationships should be None
        assert!(request.entity_relationships.is_none());
        let expected_yml_content = serde_yaml::to_string(&model)?;
        assert_eq!(request.yml_file, Some(expected_yml_content));

        Ok(())
    }
}
