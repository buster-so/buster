mod commands;
mod error;
mod types;
mod utils;

use clap::{Parser, Subcommand};
use commands::{auth, deploy, generate, import, init};

pub const APP_NAME: &str = "buster";

#[derive(Subcommand)]
#[clap(rename_all = "lowercase")]
pub enum Commands {
    Init,
    Auth,
    Generate,
    Import,
    Deploy,
}

#[derive(Parser)]
pub struct Args {
    #[command(subcommand)]
    pub cmd: Commands,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    // TODO: All commands should check for an update.
    let result = match args.cmd {
        Commands::Init => init().await,
        Commands::Auth => auth().await,
        Commands::Generate => generate().await,
        Commands::Import => import().await,
        Commands::Deploy => deploy().await,
    };

    if let Err(e) = result {
        eprintln!("{}", e);
        std::process::exit(1);
    }
}
