use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// Configuration struct for chat command
#[derive(Serialize, Deserialize, Debug, Default)]
pub struct ChatConfig {
    pub base_url: Option<String>,
    pub api_key: Option<String>,
}

const CONFIG_APP_NAME: &str = "buster";
const CONFIG_FILE_NAME: &str = "chat";

/// Loads chat configuration using confy.
/// Returns default config if file doesn't exist or is invalid.
pub fn load_chat_config() -> Result<ChatConfig> {
    confy::load(CONFIG_APP_NAME, Some(CONFIG_FILE_NAME))
        .context("Failed to load chat configuration")
}

/// Saves chat configuration using confy.
pub fn save_chat_config(config: &ChatConfig) -> Result<()> {
    confy::store(CONFIG_APP_NAME, Some(CONFIG_FILE_NAME), config)
        .context("Failed to save chat configuration")
}

/// Gets the path where the config file is expected to be stored.
pub fn get_config_path() -> Result<PathBuf> {
    confy::get_configuration_file_path(CONFIG_APP_NAME, Some(CONFIG_FILE_NAME))
        .context("Failed to determine chat configuration path")
} 