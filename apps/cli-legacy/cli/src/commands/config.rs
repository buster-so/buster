use crate::error::BusterError;
use dirs;
use std::fs;
use std::path::PathBuf;
use crate::commands::config_utils;

async fn get_app_base_dir() -> Result<PathBuf, BusterError> {
    let home_dir = dirs::home_dir().ok_or_else(|| {
        BusterError::CommandError(
            "Failed to get home directory. Cannot determine app directory for config reset.".to_string(),
        )
    })?;
    Ok(home_dir.join(".buster"))
}

pub async fn reset_llm_settings() -> Result<(), BusterError> {
    let app_base_dir = get_app_base_dir().await?;

    println!("Resetting LLM and Reranker configurations...");

    let files_to_delete = [
        ".openai_api_key",
        ".reranker_provider",
        ".reranker_api_key",
        ".reranker_model",
        ".reranker_base_url",
    ];

    let mut all_successful = true;
    let mut any_deleted = false;

    for file_name in files_to_delete.iter() {
        let file_path = app_base_dir.join(file_name);
        if file_path.exists() {
            match fs::remove_file(&file_path) {
                Ok(_) => {
                    println!("Successfully deleted {}", file_path.display());
                    any_deleted = true;
                }
                Err(e) => {
                    eprintln!("Failed to delete {}: {}. Please remove it manually.", file_path.display(), e);
                    all_successful = false;
                }
            }
        }
    }

    if !any_deleted && all_successful {
        println!("No cached LLM or Reranker configurations found to reset.");
    } else if all_successful {
        println!("LLM and Reranker configurations have been reset successfully.");
        println!("You will be prompted to enter them again on the next relevant command (e.g., buster start).");
    } else {
        println!("Some configurations could not be automatically reset. Please check messages above.");
    }

    Ok(())
}

// Function to get current LLM API key (from cache or .env as a fallback display)
fn get_current_llm_api_key_display(app_base_dir: &PathBuf) -> Result<String, BusterError> {
    match config_utils::get_cached_value(app_base_dir, ".openai_api_key")? {
        Some(key) => Ok(if key.len() > 4 { format!("...{}", &key[key.len()-4..]) } else { "****".to_string() }),
        None => Ok("Not set".to_string()), // Or try to read from .env if complex display needed
    }
}

// Function to get current Reranker config display (from cache or .env)
fn get_current_reranker_config_display(app_base_dir: &PathBuf) -> Result<String, BusterError> {
    let provider = config_utils::get_cached_value(app_base_dir, ".reranker_provider")?;
    let model = config_utils::get_cached_value(app_base_dir, ".reranker_model")?;
    if let (Some(p), Some(m)) = (provider, model) {
        Ok(format!("Provider: {}, Model: {}", p, m))
    } else {
        Ok("Not fully set".to_string())
    }
}

pub async fn manage_settings_interactive() -> Result<(), BusterError> {
    let app_base_dir = config_utils::get_app_base_dir().map_err(|e| {
        BusterError::CommandError(format!("Failed to get app base directory: {}", e))
    })?;
    let target_dotenv_path = app_base_dir.join(".env");

    println!("--- Buster Interactive Configuration ---");

    // Manage OpenAI API Key
    let current_llm_key_display = get_current_llm_api_key_display(&app_base_dir)?;
    let update_llm = config_utils::prompt_for_input(
        &format!("Current OpenAI API Key: {}. Update? (y/n)", current_llm_key_display),
        Some("n"),
        false
    )?.to_lowercase();

    let mut llm_api_key_to_set: Option<String> = None;
    if update_llm == "y" {
        // Call with force_prompt = true, but the function itself will ask for confirmation if a key exists
        // For a cleaner flow here, we handle the top-level decision to update.
        let new_key = config_utils::prompt_for_input("Enter new OpenAI API Key:", None, true)?;
        config_utils::cache_value(&app_base_dir, ".openai_api_key", &new_key)?;
        llm_api_key_to_set = Some(new_key);
        println!("OpenAI API Key updated and cached.");
    } else {
        // If not updating, we still need the current key for .env update
        llm_api_key_to_set = config_utils::get_cached_value(&app_base_dir, ".openai_api_key")?;
    }

    // Manage Reranker Settings
    let current_reranker_display = get_current_reranker_config_display(&app_base_dir)?;
    let update_reranker = config_utils::prompt_for_input(
        &format!("Current Reranker settings: {}. Update? (y/n)", current_reranker_display),
        Some("n"),
        false
    )?.to_lowercase();

    let mut reranker_config_to_set: Option<config_utils::RerankerConfig> = None;
    if update_reranker == "y" {
        // This function internally handles its own detailed prompting flow
        let new_reranker_config = config_utils::prompt_and_manage_reranker_settings(&app_base_dir, true)?;
        reranker_config_to_set = Some(new_reranker_config);
        println!("Reranker settings updated and cached.");
    } else {
        // If not updating, get current cached values for .env update
        let p = config_utils::get_cached_value(&app_base_dir, ".reranker_provider")?;
        let k = config_utils::get_cached_value(&app_base_dir, ".reranker_api_key")?;
        let m = config_utils::get_cached_value(&app_base_dir, ".reranker_model")?;
        let u = config_utils::get_cached_value(&app_base_dir, ".reranker_base_url")?;
        if let (Some(provider), Some(api_key), Some(model), Some(base_url)) = (p,k,m,u) {
            reranker_config_to_set = Some(config_utils::RerankerConfig { provider, api_key, model, base_url });
        }
    }

    // Update .env file with the (potentially new) settings
    // We need to ensure we have values for all fields update_env_file expects, 
    // even if only some were updated in this session.
    let final_llm_api_key = llm_api_key_to_set.clone();
    
    let final_rerank_api_key = reranker_config_to_set.as_ref().map(|c| c.api_key.clone());
    let final_rerank_model = reranker_config_to_set.as_ref().map(|c| c.model.clone());
    let final_rerank_base_url = reranker_config_to_set.as_ref().map(|c| c.base_url.clone());

    // Default LLM_BASE_URL if not set (important if .env is created from scratch)
    // The update_env_file function also has a fallback for this.
    let llm_base_url_default = "https://api.openai.com/v1".to_string();
    let current_llm_base_url = if target_dotenv_path.exists() {
        let env_content = std::fs::read_to_string(&target_dotenv_path).map_err(|e| {
            BusterError::CommandError(format!("Failed to read .env file: {}", e))
        })?;
        env_content.lines().find(|line| line.starts_with("LLM_BASE_URL=")).map_or(None, |line| line.split_once('=').map(|(_,v)| v.trim_matches('"').to_string()))
    } else { None }; 

    config_utils::update_env_file(
        &target_dotenv_path,
        final_llm_api_key.as_deref(),
        final_rerank_api_key.as_deref(),
        final_rerank_model.as_deref(),
        final_rerank_base_url.as_deref(),
        current_llm_base_url.as_deref().or(Some(&llm_base_url_default)), // Ensure LLM_BASE_URL is present
        None,
    )?;

    println!("Configuration saved to {}.", target_dotenv_path.display());
    Ok(())
} 