use anyhow::Result;

use serde::{Deserialize, Serialize};
use tokio::fs;

use crate::utils::{
    BusterClient, DeployDatasetsColumnsRequest, DeployDatasetsEntityRelationshipsRequest,
    DeployDatasetsRequest,
};

use super::{
    buster_credentials::BusterCredentials,
    profiles::{get_project_profile, Profile},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct BusterModelObject {
    pub sql_definition: String,
    pub model_file: BusterModel,
    pub yml_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BusterModel {
    pub version: i32,
    pub models: Vec<Model>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Model {
    pub name: String,
    pub description: String,
    pub model: Option<String>,
    pub schema: Option<String>,
    pub entities: Vec<Entity>,
    pub dimensions: Vec<Dimension>,
    pub measures: Vec<Measure>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Entity {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub entity_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Dimension {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub dimension_type: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Measure {
    pub name: String,
    pub expr: String,
    pub agg: String,
    pub description: String,
}

pub async fn get_model_files(dir_path: Option<&str>) -> Result<Vec<BusterModelObject>> {
    let mut model_objects = Vec::new();
    let path = match dir_path {
        Some(p) => std::path::Path::new("models").join(p),
        None => std::path::Path::new("models").to_path_buf(),
    };
    
    if !path.exists() {
        return Err(anyhow::anyhow!("Directory not found: {}", path.display()));
    }
    
    process_directory(&path, &mut model_objects).await?;
    Ok(model_objects)
}

async fn process_directory(
    dir_path: &std::path::Path,
    model_objects: &mut Vec<BusterModelObject>,
) -> Result<()> {
    println!("📂 Processing directory: {}", dir_path.display());
    let mut dir = tokio::fs::read_dir(dir_path).await?;

    while let Some(entry) = dir.next_entry().await? {
        let path = entry.path();

        if path.is_dir() {
            Box::pin(process_directory(&path, model_objects)).await?;
            continue;
        }

        if let Some(ext) = path.extension() {
            if ext == "yml" {
                println!("📄 Found YAML file: {}", path.display());
                let sql_path = path.with_extension("sql");
                
                if !sql_path.exists() {
                    println!("⚠️  Skipping {} - No matching SQL file found at {}", path.display(), sql_path.display());
                    continue;
                }

                let sql_definition = match tokio::fs::read_to_string(&sql_path).await {
                    Ok(content) => content,
                    Err(e) => {
                        println!("❌ Failed to read SQL file {}: {}", sql_path.display(), e);
                        continue;
                    }
                };
                    
                let yaml_content = match fs::read_to_string(&path).await {
                    Ok(content) => content,
                    Err(e) => {
                        println!("❌ Failed to read YAML file {}: {}", path.display(), e);
                        continue;
                    }
                };
                    
                let model: BusterModel = match serde_yaml::from_str(&yaml_content) {
                    Ok(model) => model,
                    Err(e) => {
                        println!("❌ Failed to parse YAML file {}: {}", path.display(), e);
                        continue;
                    }
                };

                println!("✅ Successfully processed model file: {}", path.display());
                model_objects.push(BusterModelObject {
                    sql_definition,
                    model_file: model,
                    yml_content: yaml_content,
                });
            }
        }
    }
    println!("✨ Finished processing directory: {}", dir_path.display());
    Ok(())
}

pub async fn upload_model_files(
    model_objects: Vec<BusterModelObject>,
    buster_creds: BusterCredentials,
    dir_path: Option<&str>,
    data_source_name: Option<&str>,
    schema: Option<&str>,
    env: Option<&str>,
) -> Result<()> {
    println!("Uploading model files to Buster");
    if let Some(path) = dir_path {
        println!("📂 Only uploading models from: {}", path);
    }

    // Get profile info only if no data_source_name is provided
    let (profile_name, schema_name) = if let Some(ds_name) = data_source_name {
        (ds_name.to_string(), schema.unwrap_or_default().to_string())
    } else {
        let (name, profile) = get_project_profile().await?;
        (name, get_schema_name(&profile)?)
    };

    let mut post_datasets_req_body = Vec::new();

    // Iterate through each model object and the semantic models within. These are the datasets we want to create.
    for model in model_objects {
        for semantic_model in model.model_file.models {
            let mut columns = Vec::new();

            for column in semantic_model.dimensions {
                columns.push(DeployDatasetsColumnsRequest {
                    name: column.name,
                    description: column.description,
                    semantic_type: Some(String::from("dimension")),
                    expr: Some(column.expr),
                    type_: None,
                    agg: None,
                });
            }

            for column in semantic_model.measures {
                columns.push(DeployDatasetsColumnsRequest {
                    name: column.name,
                    description: column.description,
                    semantic_type: Some(String::from("measure")),
                    expr: Some(column.expr),
                    type_: None,
                    agg: Some(column.agg),
                });
            }

            let mut entity_relationships = Vec::new();

            for entity in semantic_model.entities {
                entity_relationships.push(DeployDatasetsEntityRelationshipsRequest {
                    name: entity.name,
                    expr: entity.expr,
                    type_: entity.entity_type,
                });
            }

            let dataset = DeployDatasetsRequest {
                data_source_name: profile_name.clone(),
                env: env.map(String::from).unwrap_or_else(|| semantic_model.schema.unwrap_or_else(|| "default".to_string())),
                name: semantic_model.name,
                model: semantic_model.model,
                schema: schema_name.clone(),
                description: semantic_model.description,
                sql_definition: Some(model.sql_definition.clone()),
                entity_relationships: Some(entity_relationships),
                columns,
                yml_file: Some(model.yml_content.clone()),
                id: None,
                type_: String::from("view"),
            };

            post_datasets_req_body.push(dataset);
        }
    }

    let buster = BusterClient::new(buster_creds.url, buster_creds.api_key)?;

    if let Err(e) = buster.deploy_datasets(post_datasets_req_body).await {
        return Err(anyhow::anyhow!(
            "Failed to upload model files to Buster: {}",
            e
        ));
    };

    Ok(())
}

fn get_schema_name(profile: &Profile) -> Result<String> {
    let credentials = profile
        .outputs
        .get(&profile.target)
        .ok_or(anyhow::anyhow!("Target not found: {}", profile.target))?;

    Ok(credentials.credential.get_schema())
}
