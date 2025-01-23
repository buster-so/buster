use anyhow::Result;

use crate::utils::{
    buster_credentials::get_and_validate_buster_credentials,
    command::{check_dbt_installation, dbt_command},
    model_files::{get_model_files, upload_model_files},
    text::print_error,
};

use super::auth;

pub async fn deploy(skip_dbt: bool) -> Result<()> {
    if let Err(e) = check_dbt_installation().await {
        print_error("Error: Failed to check dbt installation");
        return Err(anyhow::anyhow!("Failed to check dbt installation: {}", e));
    }

    // Get buster credentials
    let buster_creds = match get_and_validate_buster_credentials().await {
        Ok(buster_creds) => Some(buster_creds),
        Err(_) => {
            print_error("No Buster credentials found. Beginning authentication flow...");
            None
        }
    };

    // If no buster credentials, go through auth flow.
    let buster_creds = if let Some(buster_creds) = buster_creds {
        buster_creds
    } else {
        match auth().await {
            Ok(_) => match get_and_validate_buster_credentials().await {
                Ok(buster_creds) => buster_creds,
                Err(e) => {
                    print_error("Error: Authentication failed during credential validation");
                    return Err(anyhow::anyhow!("Failed to authenticate: {}", e));
                }
            },
            Err(e) => {
                print_error("Error: Authentication process failed");
                return Err(anyhow::anyhow!("Failed to authenticate: {}", e));
            }
        }
    };

    if !skip_dbt {
        if let Err(e) = dbt_command("run").await {
            print_error("Error: Failed to run dbt project");
            return Err(anyhow::anyhow!("Failed to run dbt project: {}", e));
        }
        println!("Successfully deployed dbt project");
    }

    let model_objects = get_model_files().await?;

    if let Err(e) = upload_model_files(model_objects, buster_creds).await {
        print_error("Error: Failed to upload model files to Buster");
        return Err(anyhow::anyhow!(
            "Failed to upload model files to Buster: {}",
            e
        ));
    };

    Ok(())
}
