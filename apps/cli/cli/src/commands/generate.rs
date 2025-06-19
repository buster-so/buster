use anyhow::{anyhow, Context, Result};
use colored::*;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
// use std::time::Duration; // Duration seems unused here now

use crate::utils::config::BusterConfig;
use crate::commands::init::{YamlModel, YamlDimension, YamlMeasure, is_measure_type};

// Use new struct names from dbt_utils
use dbt_utils::models::{DbtCatalog, CatalogNode, ColumnMetadata, TableMetadata}; // CatalogMetadata might not be directly used here
use dbt_utils::{run_dbt_docs_generate, load_and_parse_catalog};

use indicatif::{ProgressBar, ProgressStyle}; // Keep for progress spinners if any remain or are added
use inquire::Confirm;
use glob::{glob, Pattern};


pub async fn generate_semantic_models_command(
    path_arg: Option<String>,
    target_output_dir_arg: Option<String>, // This argument determines the *base* output dir if specified
) -> Result<()> {
    println!("{}", "🚀 Starting semantic model generation/update...".bold().blue());

    let buster_config_dir = std::env::current_dir().context("Failed to get current directory")?;
    let buster_config = BusterConfig::load_from_dir(&buster_config_dir)?.ok_or_else(|| {
        anyhow!("❌ buster.yml not found in {}. Please run 'buster init' first.", buster_config_dir.display())
    })?;

    // --- 1. Load Catalog & Build Lookup Map ---
    println!("\n{}", "🔍 Loading dbt catalog...".dimmed());
    let catalog_json_path = buster_config_dir.join("target").join("catalog.json");
    if Confirm::new("Run 'dbt docs generate' to refresh dbt catalog (catalog.json)?")
        .with_default(true)
        .prompt()?
    {
        match run_dbt_docs_generate(&buster_config_dir).await {
            Ok(_) => {},
            Err(e) => eprintln!("{}", format!("⚠️ 'dbt docs generate' error. Proceeding with existing catalog. Error: {}", e).yellow()),
        }
    } else {
        println!("{}", "ℹ️ Skipping 'dbt docs generate'. Using existing catalog.json.".dimmed());
    }

    if !catalog_json_path.exists() {
        eprintln!("{}", format!("❌ catalog.json not found at {}. Cannot generate/update models.", catalog_json_path.display()).red());
        return Ok(());
    }
    let dbt_catalog = match load_and_parse_catalog(&catalog_json_path) {
        Ok(catalog) => {
            println!("{}", "✅ Successfully parsed catalog.json.".green());
            catalog
        }
        Err(e) => {
            eprintln!("{}", format!("❌ Error loading/parsing catalog.json: {}. Cannot generate/update.", e).red());
            return Ok(());
        }
    };

    // Enhance catalog node lookup to use path information from unique_id
let mut catalog_nodes_lookup: HashMap<String, &CatalogNode> = HashMap::new();

// Function to extract path components from unique_id
fn extract_path_components(unique_id: &str) -> Option<(String, String, String)> {
    let parts: Vec<&str> = unique_id.split('.').collect();
    // Format: model.project_name.directory_path.model_name
    // Or: source.project_name.schema.table
    if parts.len() >= 4 {
        let resource_type = parts[0].to_string();
        let project_name = parts[1].to_string();

        // For models, combine all middle parts as directory path
        // For sources, use the schema
        let schema_or_path = if resource_type == "model" && parts.len() > 4 {
            parts[2..parts.len()-1].join(".")
        } else {
            parts[2].to_string()
        };

        // Last part is always the model/table name
        let name = parts[parts.len()-1].to_string();

        return Some((project_name, schema_or_path, name));
    }
    None
}

// Populate the lookup table with multiple keys for each node
for (unique_id, node) in &dbt_catalog.nodes {
    // Always include the full unique_id as a lookup key
    catalog_nodes_lookup.insert(unique_id.clone(), node);

    if let Some((project, path_or_schema, name)) = extract_path_components(unique_id) {
        // Add project.path.name as a lookup key
        let project_path_key = format!("{}.{}.{}", project, path_or_schema, name);
        catalog_nodes_lookup.insert(project_path_key, node);

        // Add project.name as a lookup key
        let project_name_key = format!("{}.{}", project, name);
        catalog_nodes_lookup.insert(project_name_key, node);

        // Add path.name as a lookup key
        let path_name_key = format!("{}.{}", path_or_schema, name);
        catalog_nodes_lookup.insert(path_name_key, node);
    }

    // For backward compatibility, also index by simple name
    if let Some(derived_name) = &node.derived_model_name_from_file {
        // Check if this name already exists in the lookup to avoid collisions
        if !catalog_nodes_lookup.contains_key(derived_name) {
            catalog_nodes_lookup.insert(derived_name.clone(), node);
        } else {
            println!("{}", format!("⚠️ Warning: Multiple models with name '{}' found in catalog. Using path information for disambiguation.", derived_name).yellow());
        }
    }
}

    if catalog_nodes_lookup.is_empty() {
        println!("{}", "ℹ️ No models found in dbt catalog. Nothing to generate/update.".yellow());
        return Ok(());
    }

    // Helper function to extract path components from SQL file paths
    fn extract_sql_file_path_components(
        sql_file_path: &Path,
        project_root: &Path,
        model_roots: &[PathBuf]
    ) -> Vec<String> {
        // First try to strip the project root to get a relative path
        if let Ok(rel_path) = sql_file_path.strip_prefix(project_root) {
            // Now try to strip any of the model roots to find the most specific path
            for model_root in model_roots {
                // Handle both absolute and relative model roots
                let abs_model_root = if model_root.is_absolute() {
                    model_root.clone()
                } else {
                    project_root.join(model_root)
                };

                // Try to strip the model root from the SQL file path
                if let Ok(path_from_model_root) = rel_path.strip_prefix(&model_root) {
                    // Split the remaining path into components
                    let components: Vec<String> = path_from_model_root
                        .parent()
                        .map(|p| p.components().map(|c| c.as_os_str().to_string_lossy().into_owned()).collect())
                        .unwrap_or_default();

                    // If we found components, add the model name (filename without extension)
                    let mut result = components;
                    if let Some(file_name) = sql_file_path.file_stem() {
                        result.push(file_name.to_string_lossy().into_owned());
                    }
                    return result;
                }

                // Try with absolute model root as well
                if let Ok(path_from_abs_model_root) = sql_file_path.strip_prefix(&abs_model_root) {
                    let components: Vec<String> = path_from_abs_model_root
                        .parent()
                        .map(|p| p.components().map(|c| c.as_os_str().to_string_lossy().into_owned()).collect())
                        .unwrap_or_default();

                    let mut result = components;
                    if let Some(file_name) = sql_file_path.file_stem() {
                        result.push(file_name.to_string_lossy().into_owned());
                    }
                    return result;
                }
            }
        }

        // Fallback: Just return the file name without extension
        sql_file_path.file_stem()
            .map(|s| vec![s.to_string_lossy().into_owned()])
            .unwrap_or_default()
    }

    // --- 2. Process Each Project Separately ---
    println!("\n{}", "⚙️ Processing projects...".dimmed());
    
    let mut total_models_generated_count = 0;
    let mut total_models_updated_count = 0;
    let mut total_columns_added_count = 0;
    let mut total_columns_updated_count = 0;
    let mut total_columns_removed_count = 0;
    let mut total_sql_models_successfully_processed_from_catalog_count = 0;

    // Get projects to process
    let projects_to_process = if let Some(projects) = &buster_config.projects {
        projects.clone()
    } else {
        println!("{}", "ℹ️ No projects found in buster.yml. Nothing to process.".yellow());
        return Ok(());
    };

    // Helper function to find the best matching catalog node
    fn find_matching_catalog_node<'a>(
        lookup: &'a HashMap<String, &'a CatalogNode>,
        project_name: &str,
        path_components: &[String],
        model_name: &str
    ) -> Option<(&'a CatalogNode, String, String)> {
        // If path components are available, try increasingly specific lookups
        if !path_components.is_empty() {
            // Try most specific lookup first: full path with project
            // Format: project.path1.path2.name
            if path_components.len() > 1 {
                let path_without_name = &path_components[0..path_components.len()-1];
                let path_str = path_without_name.join(".");
                let full_key = format!("{}.{}.{}", project_name, path_str, model_name);
                if let Some(node) = lookup.get(&full_key) {
                    return Some((node, "full path".to_string(), full_key));
                }

                // Try with just the path and name (no project prefix)
                let path_name_key = format!("{}.{}", path_str, model_name);
                if let Some(node) = lookup.get(&path_name_key) {
                    return Some((node, "path and name".to_string(), path_name_key));
                }
            }

            // Try with direct parent directory and name
            if path_components.len() > 1 {
                let direct_parent = &path_components[path_components.len()-2];
                let parent_name_key = format!("{}.{}", direct_parent, model_name);
                if let Some(node) = lookup.get(&parent_name_key) {
                    return Some((node, "parent directory and name".to_string(), parent_name_key));
                }
            }

            // Try project and name without middle path
            let project_name_key = format!("{}.{}", project_name, model_name);
            if let Some(node) = lookup.get(&project_name_key) {
                return Some((node, "project and name".to_string(), project_name_key));
            }
        }

        // Try wildcard lookup: find any key ending with .model_name
        let model_suffix = format!(".{}", model_name);
        for (key, &node) in lookup {
            if key.ends_with(&model_suffix) {
                return Some((node, "wildcard match".to_string(), key.clone()));
            }
        }

        // Fallback to simple name lookup
        lookup.get(model_name).map(|&node|
            (node, "simple name".to_string(), model_name.to_string())
        )
    }

    // Process each project
    for (project_index, project_config) in projects_to_process.iter().enumerate() {
        let project_name = project_config.name.as_deref().unwrap_or("unnamed_project");
        println!("\n{}", format!("🔄 Processing project: {}", project_name).bold().cyan());
        
        // Get dbt project model roots for path stripping
        let dbt_project_model_roots_for_stripping = crate::commands::init::parse_dbt_project_file_content(&buster_config_dir)?.as_ref()
            .map(|c| c.model_paths.iter().map(PathBuf::from).collect::<Vec<PathBuf>>())
            .unwrap_or_else(|| vec![PathBuf::from("models")]);
        
        // --- 2a. Determine SQL Files for this Project ---
        let mut sql_files_to_process: HashSet<PathBuf> = HashSet::new();
        
        if let Some(pa_str) = &path_arg {
            // If path_arg is specified, only process files from that path (for any project that contains it)
            let target_path = buster_config_dir.join(pa_str);
            if target_path.is_file() && target_path.extension().map_or(false, |ext| ext == "sql") {
                // Check if this file is within any of this project's model_paths
                let should_include = if let Some(model_paths) = &project_config.model_paths {
                    model_paths.iter().any(|model_path| {
                        let abs_model_path = if Path::new(model_path).is_absolute() {
                            PathBuf::from(model_path)
                        } else {
                            buster_config_dir.join(model_path)
                        };
                        target_path.starts_with(&abs_model_path)
                    })
                } else {
                    false
                };
                
                if should_include {
                    sql_files_to_process.insert(target_path);
                }
            } else if target_path.is_dir() {
                let glob_pattern = target_path.join("**/*.sql");
                match glob(&glob_pattern.to_string_lossy()) {
                    Ok(paths) => {
                        for entry in paths {
                            if let Ok(path) = entry {
                                if path.is_file() {
                                    // Check if this file is within any of this project's model_paths
                                    let should_include = if let Some(model_paths) = &project_config.model_paths {
                                        model_paths.iter().any(|model_path| {
                                            let abs_model_path = if Path::new(model_path).is_absolute() {
                                                PathBuf::from(model_path)
                                            } else {
                                                buster_config_dir.join(model_path)
                                            };
                                            path.starts_with(&abs_model_path)
                                        })
                                    } else {
                                        false
                                    };
                                    
                                    if should_include {
                                        sql_files_to_process.insert(path);
                                    }
                                }
                            }
                        }
                    },
                    Err(e) => eprintln!("{}", format!("Error globbing '{}': {}", glob_pattern.display(), e).yellow()),
                }
            }
        } else {
            // Use project's model_paths
            if let Some(config_model_paths) = &project_config.model_paths {
                if !config_model_paths.is_empty() {
                    println!("{}", format!("  ℹ️ Scanning model_paths: {:?}", config_model_paths).dimmed());
                    for path_entry_from_config in config_model_paths {
                        if path_entry_from_config.trim().is_empty() {
                            continue;
                        }
                        
                        let base_path_for_glob = if Path::new(path_entry_from_config).is_absolute() {
                            PathBuf::from(path_entry_from_config)
                        } else {
                            buster_config_dir.join(path_entry_from_config)
                        };

                        let final_glob_pattern_str = if path_entry_from_config.contains('*') || 
                            path_entry_from_config.contains('?') || 
                            path_entry_from_config.contains('[') {
                            base_path_for_glob.to_string_lossy().into_owned()
                        } else {
                            base_path_for_glob.join("**/*.sql").to_string_lossy().into_owned()
                        };

                        match glob(&final_glob_pattern_str) {
                            Ok(paths) => {
                                for entry in paths {
                                    if let Ok(p) = entry {
                                        if p.is_file() && p.extension().map_or(false, |e| e == "sql") {
                                            sql_files_to_process.insert(p);
                                        }
                                    }
                                }
                            },
                            Err(e) => eprintln!("{}", format!("  Glob pattern error for path '{}': {}", final_glob_pattern_str, e).yellow()),
                        }
                    }
                } else {
                    println!("{}", format!("  ℹ️ Project '{}' has empty model_paths, skipping", project_name).dimmed());
                    continue;
                }
            } else {
                println!("{}", format!("  ℹ️ Project '{}' has no model_paths configured, skipping", project_name).dimmed());
                continue;
            }
        }

        if sql_files_to_process.is_empty() {
            println!("{}", format!("  ℹ️ No SQL files found for project '{}'", project_name).dimmed());
            continue;
        }
        
        println!("{}", format!("  ✅ Found {} SQL file(s) for project '{}'", sql_files_to_process.len(), project_name).dimmed());

        // --- 2b. Determine Output Directory for this Project ---
        let semantic_models_base_dir_path_str = target_output_dir_arg.as_ref().cloned().or_else(|| 
            project_config.semantic_model_paths.as_ref()
                .and_then(|paths| paths.first().cloned())
        ).unwrap_or_else(|| String::new());

        let (is_side_by_side_generation, semantic_output_base_abs_dir) = if semantic_models_base_dir_path_str.is_empty() {
            (true, buster_config_dir.clone())
        } else {
            let abs_path = if Path::new(&semantic_models_base_dir_path_str).is_absolute() {
                PathBuf::from(&semantic_models_base_dir_path_str)
            } else {
                buster_config_dir.join(&semantic_models_base_dir_path_str)
            };
            fs::create_dir_all(&abs_path).context(format!("Failed to create semantic models output dir: {}", abs_path.display()))?;
            (false, abs_path)
        };

        // --- 2c. Process SQL Files for this Project ---
        println!("{}", format!("  ✨ Processing SQL files for project '{}'...", project_name).dimmed());
        let mut models_generated_count = 0;
        let mut models_updated_count = 0;
        let mut columns_added_count = 0;
        let mut columns_updated_count = 0;
        let mut columns_removed_count = 0;
        let mut sql_models_successfully_processed_from_catalog_count = 0;

        // Get project-specific defaults
        let proj_default_ds_name = project_config.data_source_name.as_deref();
        let proj_default_database = project_config.database.as_deref();
        let proj_default_schema = project_config.schema.as_deref();

        for sql_file_abs_path in sql_files_to_process {
            let model_name_from_filename = sql_file_abs_path.file_stem().map_or_else(String::new, |s| s.to_string_lossy().into_owned());
            if model_name_from_filename.is_empty() {
                eprintln!("{}", format!("    ⚠️ Warning: Could not get model name from file {}. Skipping.", sql_file_abs_path.display()).yellow());
                continue;
            }

            // Extract path components from SQL file path
            let path_components = extract_sql_file_path_components(
                &sql_file_abs_path,
                &buster_config_dir,
                &dbt_project_model_roots_for_stripping
            );

            // Try to find the matching catalog node using a prioritized approach
            let catalog_node = match find_matching_catalog_node(
                &catalog_nodes_lookup,
                project_name,
                &path_components,
                &model_name_from_filename
            ) {
                Some((node, match_type, key)) => {
                    node
                },
                None => {
                    eprintln!("{}", format!("    ℹ️ Info: SQL model file '{}' found, but no corresponding entry in dbt catalog. Skipping.\nTried looking up with components: {:?}",
                        sql_file_abs_path.display(), path_components).dimmed());
                    continue;
                }
            };

            let Some(ref table_meta) = catalog_node.metadata else {
                eprintln!("{}", format!("    ⚠️ Warning: Catalog entry for '{}' (file: {}) is missing metadata. Skipping.", model_name_from_filename, sql_file_abs_path.display()).yellow());
                continue;
            };
            
            let actual_model_name_in_yaml = table_meta.name.clone();
            sql_models_successfully_processed_from_catalog_count += 1;

            let individual_semantic_yaml_path: PathBuf = if is_side_by_side_generation {
                sql_file_abs_path.with_extension("yml")
            } else {
                // Write directly to semantic_model_paths without preserving directory structure
                semantic_output_base_abs_dir.join(format!("{}.yml", model_name_from_filename))
            };
            
            if let Some(p) = individual_semantic_yaml_path.parent() { 
                fs::create_dir_all(p)?; 
            }

            // --- Reconciliation Logic (Create or Update) ---
            let existing_yaml_model_opt: Option<YamlModel> = if individual_semantic_yaml_path.exists() {
                fs::read_to_string(&individual_semantic_yaml_path)
                    .ok()
                    .and_then(|content| serde_yaml::from_str::<YamlModel>(&content).ok())
            } else { None };

            match existing_yaml_model_opt {
                Some(mut existing_model) => {
                    // --- Reconciliation Logic for Existing Model ---
                    let mut model_updated = false;

                    // Get the set of column names from the dbt catalog for this model
                    let catalog_column_names: HashSet<String> = catalog_node.columns
                        .keys()
                        .cloned()
                        .collect();

                    // Remove dimensions that are no longer in the catalog
                    existing_model.dimensions.retain(|dim| {
                        let keep = catalog_column_names.contains(&dim.name);
                        if !keep {
                            columns_removed_count += 1;
                            model_updated = true;
                            println!("      - Removing dimension '{}' (not in catalog)", dim.name.yellow());
                        }
                        keep
                    });

                    // Remove measures that are no longer in the catalog
                    existing_model.measures.retain(|measure| {
                        let keep = catalog_column_names.contains(&measure.name);
                        if !keep {
                            columns_removed_count += 1;
                            model_updated = true;
                            println!("      - Removing measure '{}' (not in catalog)", measure.name.yellow());
                        }
                        keep
                    });

                    if model_updated {
                        let yaml_string = serde_yaml::to_string(&existing_model)?;
                        fs::write(&individual_semantic_yaml_path, yaml_string)?;
                        models_updated_count += 1;
                        println!("     {} Updated existing semantic model: {}", "🔄".cyan(), individual_semantic_yaml_path.display().to_string().cyan());
                    }
                }
                None => { 
                    // New semantic model
                    let mut dimensions = Vec::new();
                    let mut measures = Vec::new();
                    for (_col_name, col_meta) in &catalog_node.columns {
                        if crate::commands::init::is_measure_type(&col_meta.type_) {
                            measures.push(YamlMeasure { 
                                name: col_meta.name.clone(), 
                                description: col_meta.comment.as_ref().filter(|s| !s.is_empty()).cloned().or_else(|| Some("{DESCRIPTION_NEEDED}.".to_string())), 
                                type_: Some(col_meta.type_.clone()) 
                            });
                        } else {
                            dimensions.push(YamlDimension { 
                                name: col_meta.name.clone(), 
                                description: col_meta.comment.as_ref().filter(|s| !s.is_empty()).cloned().or_else(|| Some("{DESCRIPTION_NEEDED}.".to_string())), 
                                type_: Some(col_meta.type_.clone()), 
                                searchable: false,
                                options: None 
                            });
                        }
                    }
                    let new_model = YamlModel {
                        name: actual_model_name_in_yaml,
                        description: table_meta.comment.clone(),
                        data_source_name: None,
                        database: {
                            let model_db_from_catalog = &table_meta.database;
                            model_db_from_catalog.as_ref()
                                .filter(|catalog_db_str_ref| proj_default_database != Some(catalog_db_str_ref.as_str()))
                                .cloned()
                        },
                        schema: {
                            let model_schema_from_catalog = &table_meta.schema;
                            if proj_default_schema.as_deref() == Some(model_schema_from_catalog.as_str()) {
                                None
                            } else {
                                Some(model_schema_from_catalog.clone())
                            }
                        },
                        dimensions,
                        measures,
                    };
                    let yaml_string = serde_yaml::to_string(&new_model)?;
                    fs::write(&individual_semantic_yaml_path, yaml_string)?;
                    models_generated_count += 1;
                    println!("     {} Generated new semantic model: {}", "✨".green(), individual_semantic_yaml_path.display().to_string().green());
                }
            }
        }

        // Project summary
        println!("\n{}", format!("  📊 Project '{}' Summary:", project_name).bold().blue());
        println!("    SQL models processed with catalog entry: {}", sql_models_successfully_processed_from_catalog_count.to_string().cyan());
        println!("    New semantic models generated        : {}", models_generated_count.to_string().green());
        println!("    Existing semantic models updated     : {}", models_updated_count.to_string().cyan());
        println!("    Columns removed from existing models : {}", columns_removed_count.to_string().red());

        // Add to totals
        total_models_generated_count += models_generated_count;
        total_models_updated_count += models_updated_count;
        total_columns_added_count += columns_added_count;
        total_columns_updated_count += columns_updated_count;
        total_columns_removed_count += columns_removed_count;
        total_sql_models_successfully_processed_from_catalog_count += sql_models_successfully_processed_from_catalog_count;
    }

    println!("\n{}", "📊 Overall Summary:".bold().green());
    println!("  --------------------------------------------------");
    println!("  Total SQL models processed with catalog entry: {}", total_sql_models_successfully_processed_from_catalog_count.to_string().cyan()); 
    println!("  Total new semantic models generated        : {}", total_models_generated_count.to_string().green());
    println!("  Total existing semantic models updated     : {}", total_models_updated_count.to_string().cyan());
    println!("  Total columns added to existing models     : {}", total_columns_added_count.to_string().green());
    println!("  Total columns updated in existing models   : {}", total_columns_updated_count.to_string().cyan());
    println!("  Total columns removed from existing models : {}", total_columns_removed_count.to_string().red());
    println!("  --------------------------------------------------");
    if total_sql_models_successfully_processed_from_catalog_count == 0 && total_models_generated_count == 0 && total_models_updated_count == 0 {
        println!("{}", "ℹ️ No models were generated or updated.".yellow());
    } else {
        println!("🎉 Semantic model generation/update complete for all projects.");
    }

    Ok(())
} 