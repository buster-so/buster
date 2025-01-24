use std::collections::HashMap;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use tokio::fs;

#[derive(Serialize, Deserialize)]
pub struct BusterProjectConfig {
    pub name: String,
    pub version: String,
    pub profile: String,
    #[serde(rename = "model-paths")]
    pub model_paths: Vec<String>,
    #[serde(rename = "analysis-paths")]
    pub analysis_paths: Vec<String>,
    #[serde(rename = "test-paths")]
    pub test_paths: Vec<String>,
    #[serde(rename = "seed-paths")]
    pub seed_paths: Vec<String>,
    #[serde(rename = "macro-paths")]
    pub macro_paths: Vec<String>,
    #[serde(rename = "snapshot-paths")]
    pub snapshot_paths: Vec<String>,
    #[serde(rename = "clean-targets")]
    pub clean_targets: Vec<String>,
    pub models: HashMap<String, HashMap<String, String>>,
}

#[derive(Serialize, Deserialize)]
pub struct ModelConfig {
    #[serde(rename = "+materialized")]
    pub materialized: String,
}

// Right now, the buster project file is the same as the dbt project file.
#[derive(Serialize, Deserialize)]
pub struct DbtProjectConfig {
    pub name: String,
    pub version: String,
    pub profile: String,
    #[serde(rename = "model-paths")]
    pub model_paths: Vec<String>,
    #[serde(rename = "analysis-paths")]
    pub analysis_paths: Vec<String>,
    #[serde(rename = "test-paths")]
    pub test_paths: Vec<String>,
    #[serde(rename = "seed-paths")]
    pub seed_paths: Vec<String>,
    #[serde(rename = "macro-paths")]
    pub macro_paths: Vec<String>,
    #[serde(rename = "snapshot-paths")]
    pub snapshot_paths: Vec<String>,
    #[serde(rename = "clean-targets")]
    pub clean_targets: Vec<String>,
    pub models: HashMap<String, HashMap<String, ModelConfig>>,
}

pub async fn create_buster_from_dbt_project_yml(dbt_project_yml_path: &str) -> Result<()> {
    let contents = fs::read_to_string(dbt_project_yml_path).await?;
    let dbt_config: DbtProjectConfig = serde_yaml::from_str(&contents)?;

    let buster_config = BusterProjectConfig {
        name: dbt_config.name,
        version: dbt_config.version,
        profile: dbt_config.profile,
        model_paths: dbt_config.model_paths,
        analysis_paths: dbt_config.analysis_paths,
        test_paths: dbt_config.test_paths,
        seed_paths: dbt_config.seed_paths,
        macro_paths: dbt_config.macro_paths,
        snapshot_paths: dbt_config.snapshot_paths,
        clean_targets: dbt_config.clean_targets,
        models: HashMap::new(),
    };

    fs::write("buster_project.yml", serde_yaml::to_string(&buster_config)?).await?;
    Ok(())
}

pub async fn find_dbt_projects() -> Result<Vec<String>> {
    let mut dbt_projects = Vec::new();

    let mut entries = tokio::fs::read_dir(".").await?;
    while let Some(entry) = entries.next_entry().await? {
        if entry.file_type().await?.is_dir() {
            let dir_name = entry.file_name();
            let dir_name = dir_name.to_string_lossy().to_string();

            let project_path = format!("{}/dbt_project.yml", dir_name);
            if tokio::fs::try_exists(&project_path).await? {
                dbt_projects.push(dir_name);
            }
        }
    }

    Ok(dbt_projects)
}

pub async fn get_current_project() -> Result<BusterProjectConfig> {
    let project_path = std::path::Path::new("dbt_project.yml");

    if !project_path.exists() {
        anyhow::bail!("No dbt_project.yml found in current directory");
    }

    let contents = fs::read_to_string(project_path)
        .await
        .map_err(|e| anyhow::anyhow!("Failed to read dbt_project.yml: {}", e))?;

    let config: BusterProjectConfig = serde_yaml::from_str(&contents)?;
    Ok(config)
}
