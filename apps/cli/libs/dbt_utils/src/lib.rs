use anyhow::{Context, Result, anyhow};
use colored::*;
use indicatif::{ProgressBar, ProgressStyle};
use std::fs;
use std::path::Path;
use std::process::Command as StdCommand;
use std::time::Duration;

pub mod models;
use models::{CatalogNode, DbtCatalog};

/// Runs the `dbt docs generate` command for the specified dbt project path.
pub async fn run_dbt_docs_generate(dbt_project_path: &Path) -> Result<()> {
    println!(
        "{}",
        format!("Running 'dbt clean && dbt docs generate' for project at: {}", dbt_project_path.display()).dimmed()
    );
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .context("Failed to create progress style for dbt docs generate spinner")? // Added context
    );
    
    // First run dbt clean
    spinner.set_message("Executing dbt clean...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    let clean_output = tokio::process::Command::new("dbt")
        .arg("clean")
        .arg("--project-dir")
        .arg(dbt_project_path.as_os_str())
        .output()
        .await
        .with_context(|| format!("Failed to execute 'dbt clean' command for project: {}", dbt_project_path.display()))?;

    if !clean_output.status.success() {
        eprintln!(
            "{}",
            format!(
                "⚠️ 'dbt clean' failed but continuing. Status: {}.\nStdout: {}\nStderr: {}",
                clean_output.status,
                String::from_utf8_lossy(&clean_output.stdout),
                String::from_utf8_lossy(&clean_output.stderr)
            )
            .yellow()
        );
    }

    // Then run dbt docs generate
    spinner.set_message("Executing dbt docs generate...");

    let output = tokio::process::Command::new("dbt") // Switched to tokio::process::Command for async
        .arg("docs")
        .arg("generate")
        .arg("--project-dir")
        
        .arg(dbt_project_path.as_os_str())
        .output()
        .await
        .with_context(|| format!("Failed to execute 'dbt docs generate' command for project: {}", dbt_project_path.display()))?;

    spinner.finish_and_clear();

    if output.status.success() {
        println!(
            "{}",
            "✓ 'dbt clean && dbt docs generate' completed successfully.".green()
        );
        // It might be useful to check if catalog.json was actually created/updated here, 
        // but for now, we assume success means it's likely fine.
        Ok(())
    } else {
        eprintln!(
            "{}",
            format!(
                "✗ 'dbt docs generate' failed. Status: {}.\nProject Path: {}\nStdout: {}\nStderr: {}",
                output.status,
                dbt_project_path.display(),
                String::from_utf8_lossy(&output.stdout),
                String::from_utf8_lossy(&output.stderr)
            )
            .red()
        );
        Err(anyhow!(
            "'dbt docs generate' command failed with status: {}",
            output.status
        ))
    }
}

/// Loads and parses the dbt `catalog.json` file from the given path.
/// Also performs post-processing to derive convenience fields on CatalogNode.
pub fn load_and_parse_catalog(catalog_json_path: &Path) -> Result<DbtCatalog> {
    println!(
        "{}",
        format!("Loading dbt catalog from: {}", catalog_json_path.display()).dimmed()
    );
    if !catalog_json_path.exists() {
        return Err(anyhow!(
            "dbt catalog.json not found at {}. Please ensure 'dbt docs generate' was run successfully.",
            catalog_json_path.display()
        ));
    }
    let catalog_content = fs::read_to_string(catalog_json_path)
        .with_context(|| format!("Failed to read catalog.json from {}", catalog_json_path.display()))?;
    
    let mut catalog: DbtCatalog = serde_json::from_str(&catalog_content)
        .map_err(|e| {
            // Log the detailed serde error
            eprintln!("Detailed parsing error for {}: {:#?}", catalog_json_path.display(), e);
            anyhow!(
                "Failed to parse catalog.json from {}. Error: {}. Ensure it matches expected dbt catalog structure (v1 tested).",
                catalog_json_path.display(),
                e // e.to_string() will give a concise error message from serde
            )
        })?;

    // Post-process nodes to derive resource_type and a display name
    for (_node_key, node) in catalog.nodes.iter_mut() { // node_key is the unique_id string from the JSON map key
        if let Some(ref unique_id_val) = node.unique_id { // unique_id is Option<String>
            let parts: Vec<&str> = unique_id_val.splitn(2, '.').collect();
            if !parts.is_empty() {
                let potential_type = parts[0];
                if ["model", "source", "seed", "snapshot", "test"].contains(&potential_type) {
                    node.derived_resource_type = Some(potential_type.to_string());
                }
            }
            // Derive a node name (often the last part of unique_id, or from metadata.name)
            if let Some(metadata) = &node.metadata {
                 // metadata.name is String, so it should exist if metadata block exists.
                node.derived_model_name_from_file = Some(metadata.name.clone()); 
            } else if let Some(last_part) = unique_id_val.split('.').last() {
                if !last_part.is_empty() {
                     // Fallback to last part of unique_id if metadata.name is somehow not accessible
                    node.derived_model_name_from_file = Some(last_part.to_string());
                }
            }
        } else {
            // If unique_id itself is None, we can't do much derivation from it.
            // We could try to use the node_key (which *is* the unique_id from the JSON structure)
            // but node.unique_id inside the struct being None is strange for a valid catalog.
        }
    }
    // Similar post-processing for sources if needed
    for (_source_key, source_node) in catalog.sources.iter_mut() {
        if let Some(ref unique_id_val) = source_node.unique_id {
            let parts: Vec<&str> = unique_id_val.splitn(2, '.').collect();
            if !parts.is_empty() && parts[0] == "source" {
                source_node.derived_resource_type = Some("source".to_string());
            }
             if let Some(metadata) = &source_node.metadata {
                source_node.derived_model_name_from_file = Some(metadata.name.clone()); 
            } else if let Some(last_part) = unique_id_val.split('.').last() {
                if !last_part.is_empty() {
                    source_node.derived_model_name_from_file = Some(last_part.to_string());
                }
            }
        }
    }

    Ok(catalog)
}

pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
} 