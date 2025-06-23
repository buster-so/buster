pub mod args;
pub mod config;
pub mod completion;
pub mod logic;
pub mod state;
pub mod ui;

use anyhow::Result;
pub use args::ChatArgs;
pub use config::{get_config_path, load_chat_config, save_chat_config, ChatConfig};
pub use logic::run_chat;

/// Public entry point for the chat command.
pub async fn chat_command(args: ChatArgs) -> Result<()> {
    logic::run_chat(args).await
}
