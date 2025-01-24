use anyhow::Result;
use std::collections::HashMap;

use crate::utils::{
    buster_credentials::get_and_validate_buster_credentials,
    command::{check_dbt_installation, dbt_command},
    model_files::{get_model_files, upload_model_files, BusterModelObject},
    text::print_error,
};

use super::auth;

#[derive(Debug)]
struct DeployError {
    file_path: String,
    error: anyhow::Error,
}

pub async fn deploy(
    skip_dbt: bool, 
    path: Option<&str>, 
    data_source_name: Option<&str>,
    schema: Option<&str>,
    env: Option<&str>
) -> Result<()> {
    let mut errors = Vec::new();
    let mut processed_files = HashMap::new();

    // Validate required params when skipping dbt
    if skip_dbt && path.is_some() {
        if data_source_name.is_none() {
            return Err(anyhow::anyhow!("--data-source is required when skipping dbt"));
        }
        if schema.is_none() {
            return Err(anyhow::anyhow!("--schema is required when skipping dbt"));
        }
        if env.is_none() {
            return Err(anyhow::anyhow!("--env is required when skipping dbt"));
        }
    }

    // Only check DBT installation if we're not skipping DBT and not targeting a specific path
    if !skip_dbt && path.is_none() {
        if let Err(e) = check_dbt_installation().await {
            print_error("❌ Failed to check dbt installation");
            return Err(anyhow::anyhow!("Failed to check dbt installation: {}", e));
        }
    }

    // Get buster credentials with error tracking
    let buster_creds = match get_and_validate_buster_credentials().await {
        Ok(buster_creds) => Some(buster_creds),
        Err(_) => {
            print_error("⚠️ No Buster credentials found. Beginning authentication flow...");
            None
        }
    };

    // Auth flow with error tracking
    let buster_creds = if let Some(buster_creds) = buster_creds {
        buster_creds
    } else {
        match auth().await {
            Ok(_) => match get_and_validate_buster_credentials().await {
                Ok(buster_creds) => buster_creds,
                Err(e) => {
                    print_error("❌ Authentication failed during credential validation");
                    return Err(anyhow::anyhow!("Failed to authenticate: {}", e));
                }
            },
            Err(e) => {
                print_error("❌ Authentication process failed");
                return Err(anyhow::anyhow!("Failed to authenticate: {}", e));
            }
        }
    };

    // Run DBT if not skipped and no specific path
    if !skip_dbt && path.is_none() {
        if let Err(e) = dbt_command("run").await {
            print_error("❌ Failed to run dbt project");
            return Err(anyhow::anyhow!("Failed to run dbt project: {}", e));
        }
        println!("✅ Successfully ran dbt project");
    }

    // Get model files with error tracking
    let model_objects = match get_model_files(path).await {
        Ok(objects) => {
            // Track processed files
            for obj in &objects {
                if let Some(model) = obj.model_file.models.first() {
                    processed_files.insert(
                        model.name.clone(),
                        format!("SQL: {} bytes, YML: {} bytes", 
                            obj.sql_definition.len(),
                            obj.yml_content.len()
                        ),
                    );
                }
            }
            objects
        }
        Err(e) => {
            print_error("❌ Failed to read model files");
            return Err(anyhow::anyhow!("Failed to read model files: {}", e));
        }
    };

    // Upload files with error tracking
    if let Err(e) = upload_model_files(model_objects, buster_creds, path, data_source_name, schema, env).await {
        print_error("❌ Failed to upload model files to Buster");
        
        // Try to extract file-specific errors from the error message
        if let Some(error_text) = e.to_string().split('\n').next() {
            for (file_name, _) in &processed_files {
                if error_text.contains(file_name) {
                    errors.push(DeployError {
                        file_path: file_name.clone(),
                        error: anyhow::anyhow!("{}", e).context(format!("Failed to upload {}", file_name)),
                    });
                }
            }
        }

        // If we couldn't match specific files, add a generic error
        if errors.is_empty() {
            errors.push(DeployError {
                file_path: "unknown".to_string(),
                error: e,
            });
        }
    } else {
        println!("✅ Successfully uploaded model files to Buster");
    }

    // Report errors if any occurred
    if !errors.is_empty() {
        println!("\n📋 Deployment Error Summary:");
        for error in &errors {
            println!("  ❌ File: {}", error.file_path);
            println!("     Error: {}", error.error);
            if let Some(stats) = processed_files.get(&error.file_path) {
                println!("     Stats: {}", stats);
            }
        }
        return Err(anyhow::anyhow!("Deployment failed with {} errors", errors.len()));
    }

    // Report successful files
    println!("\n📋 Successfully processed files:");
    for (file_name, stats) in processed_files {
        println!("  ✅ {}: {}", file_name, stats);
    }

    Ok(())
}
