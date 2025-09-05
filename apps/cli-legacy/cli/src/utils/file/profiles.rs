use anyhow::Result;
use dirs::home_dir;
use query_engine::credentials::{Credential, BigqueryCredentials, PostgresCredentials, RedshiftCredentials};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::fs;

use crate::utils::{buster::BusterClient, buster::PostDataSourcesRequest};

use super::{buster_credentials::BusterCredentials, project_files::get_current_project};

#[derive(Debug, Serialize, Deserialize)]
pub struct DbtProfiles {
    #[serde(flatten)]
    pub profiles: HashMap<String, Profile>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub target: String,
    pub outputs: HashMap<String, Output>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Output {
    pub threads: Option<u32>,
    // TODO: Make this a struct for each of the different db types
    #[serde(flatten)]
    pub credential: Credential,
}

// Using shared Credential enum from query_engine now
// All credential structs are imported from query_engine

pub async fn get_dbt_profiles_yml() -> Result<DbtProfiles> {
    let mut path = home_dir().unwrap_or_default();
    path.push(".dbt");
    path.push("profiles.yml");

    if !fs::try_exists(&path).await? {
        return Err(anyhow::anyhow!("File not found: {}", path.display()));
    }

    let contents = fs::read_to_string(path).await?;
    Ok(serde_yaml::from_str(&contents)?)
}

// Returns a list of tuples containing the profile name, environment, and credentials.
pub async fn get_dbt_profile_credentials(
    profile_names: &Vec<String>,
) -> Result<Vec<(String, String, Credential)>> {
    let profiles = get_dbt_profiles_yml().await?;

    let mut credentials = Vec::new();
    for name in profile_names {
        if let Some(profile) = profiles.profiles.get(name) {
            for (env, output) in &profile.outputs {
                credentials.push((name.clone(), env.clone(), output.credential.clone()));
            }
        }
    }

    Ok(credentials)
}

pub async fn upload_dbt_profiles_to_buster(
    credentials: Vec<(String, String, Credential)>,
    buster_creds: BusterCredentials,
) -> Result<()> {
    let buster = BusterClient::new(buster_creds.url, buster_creds.api_key)?;

    for (name, _env, cred) in credentials {
        let request = PostDataSourcesRequest {
            name,
            credential: cred,
        };
        let profile_name = request.name.clone();

        if let Err(e) = buster.post_data_sources(request).await {
            eprintln!("Failed to upload profile '{}': {}", profile_name, e);
        }
    }

    Ok(())
}

pub async fn get_project_profile() -> Result<(String, Profile)> {
    let project_config = get_current_project().await?;

    let dbt_profiles = get_dbt_profiles_yml().await?;

    let profile = dbt_profiles
        .profiles
        .get(&project_config.profile)
        .ok_or(anyhow::anyhow!(
            "Profile not found: {}",
            project_config.profile
        ))?;

    Ok((project_config.profile, profile.clone()))
}
