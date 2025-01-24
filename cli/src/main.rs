mod commands;
mod error;
mod types;
mod utils;

use clap::{Parser, Subcommand};
use commands::{auth, deploy, generate, import, init};

pub const APP_NAME: &str = "buster";

#[derive(Subcommand)]
#[clap(rename_all = "kebab-case")]
pub enum Commands {
    Init,
    Auth,
    Generate,
    Import,
    Deploy {
        #[arg(long)]
        skip_dbt: bool,
        #[arg(long)]
        path: Option<String>,
        #[arg(long)]
        data_source_name: Option<String>,
        #[arg(long)]
        schema: Option<String>,
        #[arg(long)]
        env: Option<String>,
    },
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
        Commands::Deploy {
            skip_dbt,
            path,
            data_source_name,
            schema,
            env,
        } => deploy(skip_dbt, path.as_deref(), data_source_name.as_deref(), schema.as_deref(), env.as_deref()).await,
    };

    if let Err(e) = result {
        eprintln!("{}", e);
        std::process::exit(1);
    }
}
