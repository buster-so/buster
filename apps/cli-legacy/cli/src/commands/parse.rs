use anyhow::{Result, anyhow};
use std::path::{Path, PathBuf};
use colored::*;

use crate::utils::{
    config::{BusterConfig, ProjectContext},
    find_yml_files, ExclusionManager,
    // Assuming ProgressTracker might be useful for logging, similar to deploy
    // If not, it can be removed.
    ProgressTracker,
};
use crate::commands::deploy::deploy::{parse_model_file, resolve_model_configurations};
use semantic_layer::models::Model;

// A simple progress tracker for the parse command
#[derive(Debug, Default)]
struct ParseProgress {
    total_files: usize,
    processed_files: usize,
    excluded_files: usize,
    current_file: String,
    errors: Vec<(String, String, Vec<String>)>, // file, model_name, errors
    successes: Vec<(String, String)>, // file, model_name
}

impl ParseProgress {
    fn new() -> Self {
        Default::default()
    }

    fn log_status(&self) {
        if !self.current_file.is_empty() {
            println!("[{}/{}] Parsing: {}", self.processed_files, self.total_files, self.current_file.cyan());
        }
    }

    fn log_summary(&self) {
        println!("\n{}", "📊 Parse Command Summary".bold().blue());
        println!("======================================");
        println!("Total files scanned                 : {}", self.total_files);
        println!("Files processed                   : {}", self.processed_files);
        println!("Files excluded (due to patterns)  : {}", self.excluded_files.to_string().yellow());
        println!("Models successfully parsed        : {}", self.successes.len().to_string().green());
        println!("Models with errors                : {}", self.errors.len().to_string().red());

        if !self.successes.is_empty() {
            println!("\n✅ Successfully parsed models:");
            for (file, model_name) in &self.successes {
                println!("  - {} (in file: {})", model_name.purple(), file.dimmed());
            }
        }

        if !self.errors.is_empty() {
            println!("\n❌ Models with errors:");
            for (file, model_name, errors) in &self.errors {
                println!("  - File: {} (Model: {}):", file.cyan(), model_name.purple());
                for error in errors {
                    println!("    - {}", error.red());
                }
            }
        }
        println!("======================================");
        if self.errors.is_empty() {
            println!("{}", "🎉 All specified model files parsed successfully!".bold().green());
        } else {
            println!("{}", "⚠️ Some model files had parsing/validation errors. Please check the output above.".bold().yellow());
        }
    }
}

impl ProgressTracker for ParseProgress {
    fn log_excluded_file(&mut self, path: &str, pattern: &str) {
        self.excluded_files += 1;
        println!("⛔ Excluding file: {} (matched pattern: {})", path.yellow(), pattern.dimmed());
    }

    fn log_excluded_tag(&mut self, path: &str, tag: &str) {
        self.excluded_files += 1;
        println!(
            "⛔ Excluding file: {} (matched excluded tag: {})",
            path.yellow(),
            tag.dimmed()
        );
    }
}

pub async fn parse_models_command(path_arg: Option<String>) -> Result<()> {
    println!("\n{}", "🚀 Starting Buster Model Parser...".bold().blue());
    let current_dir = std::env::current_dir()?;
    let buster_config_load_dir = path_arg.as_ref().map(PathBuf::from).unwrap_or_else(|| current_dir.clone());

    let mut progress = ParseProgress::new();

    println!("\n{}", "⚙️  Looking for buster.yml configuration...".dimmed());
    let buster_config = match BusterConfig::load_from_dir(&buster_config_load_dir) {
        Ok(Some(cfg)) => {
            println!("  ✅ Found buster.yml at {}", buster_config_load_dir.join("buster.yml").display());
            Some(cfg)
        }
        Ok(None) => {
            println!("  ℹ️ No buster.yml found in {}. Will parse files directly or use defaults.", buster_config_load_dir.display().to_string().yellow());
            None
        }
        Err(e) => {
            println!("  ⚠️ Error reading buster.yml: {}. Proceeding without it.", e.to_string().yellow());
            None
        }
    };

    let effective_buster_config_dir = BusterConfig::base_dir(&buster_config_load_dir.join("buster.yml")).unwrap_or(buster_config_load_dir.clone());
    println!("Effective config directory: {}", effective_buster_config_dir.display().to_string().dimmed());
    
    let exclusion_manager = if let Some(cfg) = &buster_config {
        ExclusionManager::new(cfg)?
    } else {
        ExclusionManager::empty()
    };

    // Determine search paths
    let mut files_to_parse_with_context: Vec<(PathBuf, Option<&ProjectContext>)> = Vec::new();

    if let Some(p_str) = &path_arg {
        // If a specific path is given, use it directly.
        // It could be a file or a directory.
        let specific_path = if Path::new(p_str).is_absolute() {
            PathBuf::from(p_str)
        } else {
            effective_buster_config_dir.join(p_str)
        };
        println!("\n{}", format!("🔍 Processing specified path: {}", specific_path.display()).dimmed());
        if specific_path.is_dir() {
            match find_yml_files(&specific_path, true, &exclusion_manager, Some(&mut progress)) { // Assuming recursive
                Ok(files_in_dir) => {
                    for f in files_in_dir {
                         // For direct path, we don't have a specific project context from buster.yml easily
                        files_to_parse_with_context.push((f, None));
                    }
                },
                Err(e) => eprintln!("Error finding YML files in {}: {}", specific_path.display(), format!("{}", e).red()),
            }
        } else if specific_path.is_file() && specific_path.extension().and_then(|ext| ext.to_str()) == Some("yml") {
            if specific_path.file_name().and_then(|name| name.to_str()) != Some("buster.yml") {
                files_to_parse_with_context.push((specific_path, None));
            }
        } else if !specific_path.exists() {
            return Err(anyhow!("Specified path does not exist: {}", specific_path.display()));
        } else {
            return Err(anyhow!("Specified path is not a valid .yml file or directory: {}", specific_path.display()));
        }
    } else {
        // No specific path, use buster_config (if available) or current directory
        if let Some(cfg) = &buster_config {
            let effective_paths_with_contexts = cfg.resolve_effective_semantic_model_paths(&effective_buster_config_dir);
            if !effective_paths_with_contexts.is_empty() {
                println!("\n{}", "ℹ️  Using effective semantic_model paths from buster.yml:".dimmed());
                for (path, project_ctx_opt) in effective_paths_with_contexts {
                    let context_identifier = project_ctx_opt.map_or_else(|| "Global/Default".to_string(), |ctx| ctx.identifier());
                     println!("  - Path: {}, Context: {}", path.display(), context_identifier.dimmed());
                    if path.is_dir() {
                        match find_yml_files(&path, true, &exclusion_manager, Some(&mut progress)) { // Assuming recursive
                            Ok(files_in_dir) => {
                                for f in files_in_dir {
                                    files_to_parse_with_context.push((f, project_ctx_opt));
                                }
                            },
                            Err(e) => eprintln!("Error finding YML files in {}: {}", path.display(), format!("{}", e).red()),
                        }
                    } else if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("yml") {
                         if path.file_name().and_then(|name| name.to_str()) != Some("buster.yml") {
                            files_to_parse_with_context.push((path.clone(), project_ctx_opt));
                        }
                    }
                }
            } else {
                 println!("\n{}", format!("ℹ️ No semantic_model_paths specified in buster.yml, scanning directory: {}", effective_buster_config_dir.display()).yellow());
                 match find_yml_files(&effective_buster_config_dir, true, &exclusion_manager, Some(&mut progress)) {
                    Ok(files_in_dir) => {
                        for f in files_in_dir {
                            files_to_parse_with_context.push((f, None)); // No specific project context for CWD scan unless we enhance this
                        }
                    },
                    Err(e) => eprintln!("Error finding YML files in {}: {}", effective_buster_config_dir.display(), format!("{}", e).red()),
                }
            }
        } else {
            // No buster.yml and no path_arg, scan current directory.
            println!(
                "\n{}", 
                format!("ℹ️ No buster.yml found and no specific path provided. Scanning directory: {}", effective_buster_config_dir.display()).yellow()
            );
            match find_yml_files(&effective_buster_config_dir, true, &exclusion_manager, Some(&mut progress)) {
                Ok(files_in_dir) => {
                    for f in files_in_dir {
                        files_to_parse_with_context.push((f, None));
                    }
                },
                Err(e) => eprintln!("Error finding YML files in {}: {}", effective_buster_config_dir.display(), format!("{}", e).red()),
            }
        }
    }

    progress.total_files = files_to_parse_with_context.len();
    println!("\nFound {} semantic model .yml file(s) to parse.", progress.total_files.to_string().cyan());

    if files_to_parse_with_context.is_empty() {
        println!("\n{}", "🤷 No semantic model files found to parse.".yellow());
        progress.log_summary();
        return Ok(());
    }

    println!("\n{}", "✨ Starting parsing and validation process...".dimmed());
    let default_cfg_storage;
    let global_config_for_resolution = match buster_config.as_ref() {
        Some(cfg) => cfg,
        None => {
            default_cfg_storage = BusterConfig::default();
            &default_cfg_storage
        }
    };

    for (yml_path, project_ctx_opt) in files_to_parse_with_context {
        progress.processed_files += 1;
        progress.current_file = yml_path.strip_prefix(&effective_buster_config_dir).unwrap_or(&yml_path).to_string_lossy().into_owned();
        progress.log_status();

        let parsed_models_result = parse_model_file(&yml_path);
        
        match parsed_models_result {
            Ok(parsed_models) => {
                let models_with_context: Vec<(Model, Option<&ProjectContext>)> = parsed_models.into_iter()
                    .map(|m| (m, project_ctx_opt))
                    .collect();

                match resolve_model_configurations(models_with_context, global_config_for_resolution) {
                    Ok(resolved_models) => {
                        if resolved_models.is_empty() && !yml_path.to_string_lossy().contains("empty_test") { // Guard against empty files unless for specific tests
                             println!("Warning: No semantic models found in file: {}", yml_path.display());
                             // Potentially add to errors if this is unexpected
                        }
                        for model in resolved_models {
                            let mut model_errors: Vec<String> = Vec::new();
                            // Basic validation: model name should not be empty
                            if model.name.is_empty() {
                                model_errors.push("Model name is empty.".to_string());
                            }
                            // Further validation could be added here, e.g., checking for data_source_name and schema after resolution
                            if model.data_source_name.is_none() {
                                model_errors.push("data_source_name could not be resolved.".to_string());
                            }
                            if model.schema.is_none() {
                                model_errors.push("schema could not be resolved.".to_string());
                            }

                            // Check for placeholder description in the model itself
                            if let Some(desc) = &model.description {
                                if desc.contains("{DESCRIPTION_NEEDED}") {
                                    model_errors.push("Model description contains placeholder '{DESCRIPTION_NEEDED}'. Please provide a description.".to_string());
                                }
                            }

                            // Check descriptions in dimensions
                            for dimension in &model.dimensions {
                                if let Some(desc) = &dimension.description {
                                    if desc.contains("{DESCRIPTION_NEEDED}") {
                                        model_errors.push(format!("Dimension '{}' description contains placeholder '{{DESCRIPTION_NEEDED}}'. Please provide a description.", dimension.name));
                                    }
                                }
                            }

                            // Check descriptions in measures
                            for measure in &model.measures {
                                if let Some(desc) = &measure.description {
                                    if desc.contains("{DESCRIPTION_NEEDED}") {
                                        model_errors.push(format!("Measure '{}' description contains placeholder '{{DESCRIPTION_NEEDED}}'. Please provide a description.", measure.name));
                                    }
                                }
                            }

                            // Check descriptions in metrics
                            for metric in &model.metrics {
                                if let Some(desc) = &metric.description {
                                    if desc.contains("{DESCRIPTION_NEEDED}") {
                                        model_errors.push(format!("Metric '{}' description contains placeholder '{{DESCRIPTION_NEEDED}}'. Please provide a description.", metric.name));
                                    }
                                }
                            }

                            // Check descriptions in filters
                            for filter in &model.filters {
                                if let Some(desc) = &filter.description {
                                    if desc.contains("{DESCRIPTION_NEEDED}") {
                                        model_errors.push(format!("Filter '{}' description contains placeholder '{{DESCRIPTION_NEEDED}}'. Please provide a description.", filter.name));
                                    }
                                }
                            }

                            if !model_errors.is_empty() {
                                progress.errors.push((
                                    progress.current_file.clone(),
                                    if model.name.is_empty() { "<Unnamed Model>".to_string() } else { model.name.clone() },
                                    model_errors,
                                ));
                            } else {
                                println!("  ✅ Parsed & validated: {}", model.name.purple());
                                progress.successes.push((progress.current_file.clone(), model.name.clone()));
                            }
                        }
                    }
                    Err(e) => {
                        println!("  ❌ Error resolving configurations for models in {}: {}", yml_path.display(), e.to_string().red());
                        progress.errors.push((
                            progress.current_file.clone(),
                            format!("<File-level Resolution Error>"), 
                            vec![e.to_string()]
                        ));
                    }
                }
            }
            Err(e) => {
                println!("  ❌ Error parsing semantic model file {}: {}", yml_path.display(), e.to_string().red());
                progress.errors.push((
                    progress.current_file.clone(),
                    "<Parse Error>".to_string(),
                    vec![e.to_string()],
                ));
            }
        }
    }

    progress.log_summary();

    if !progress.errors.is_empty() {
        return Err(anyhow!("Found errors during parsing and validation. Please check the output above."));
    }

    Ok(())
} 