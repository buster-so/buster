mod commands;
mod error;
mod types;
mod utils;

use clap::{Parser, Subcommand};
use colored::*;
use commands::{auth::AuthArgs, deploy_v2, import, init};

pub const APP_NAME: &str = "buster";
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const BUILD_DATE: &str = env!("BUILD_DATE");
pub const GIT_HASH: &str = env!("GIT_HASH");

#[derive(Subcommand)]
#[clap(rename_all = "kebab-case")]
pub enum Commands {
    Init,
    /// Authenticate with Buster API
    Auth {
        /// The Buster API host URL
        #[arg(long, env = "BUSTER_HOST")]
        host: Option<String>,

        /// Your Buster API key
        #[arg(long, env = "BUSTER_API_KEY")]
        api_key: Option<String>,

        /// Don't save credentials to disk
        #[arg(long)]
        no_save: bool,
    },
    /// Display version information
    Version,
    /// Update buster-cli to the latest version
    Update {
        /// Only check if an update is available
        #[arg(long)]
        check_only: bool,
        /// Force update even if already on latest version
        #[arg(long)]
        force: bool,
        /// Skip update confirmation prompt
        #[arg(short = 'y')]
        no_prompt: bool,
    },
    Generate {
        #[arg(long)]
        source_path: Option<String>,
        #[arg(long)]
        destination_path: Option<String>,
        #[arg(long)]
        data_source_name: Option<String>,
        #[arg(long)]
        schema: Option<String>,
        #[arg(long)]
        database: Option<String>,
        /// Output YML files in a flat structure instead of maintaining directory hierarchy
        #[arg(long, default_value_t = false)]
        flat_structure: bool,
    },
    Import,
    Deploy {
        #[arg(long)]
        path: Option<String>,
        #[arg(long, default_value_t = false)]
        dry_run: bool,
        /// Recursively search for model files in subdirectories
        #[arg(long, default_value_t = true)]
        recursive: bool,
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
        Commands::Auth {
            host,
            api_key,
            no_save,
        } => {
            commands::auth::auth_with_args(AuthArgs {
                host,
                api_key,
                no_save,
            })
            .await
        }
        Commands::Version => {
            println!("{} v{}", APP_NAME.bold(), VERSION);
            println!("Build Date: {}", BUILD_DATE);
            println!("Git Commit: {}", GIT_HASH);

            // Check for updates
            match commands::version::check_latest_version().await {
                Ok(Some(latest_version)) => {
                    if commands::version::is_update_available(VERSION, &latest_version) {
                        println!("\n{}", "Update available!".yellow().bold());
                        println!("Latest version: {}", latest_version.green());
                        println!("Run {} to update", "buster update".cyan());
                    } else {
                        println!("\n{}", "You are using the latest version".green());
                    }
                }
                Ok(None) => println!("\n{}", "Unable to check for updates".yellow()),
                Err(e) => println!("\n{}: {}", "Error checking for updates".red(), e),
            }
            Ok(())
        }
        Commands::Update {
            check_only,
            force,
            no_prompt,
        } => {
            let cmd = commands::update::UpdateCommand::new(check_only, force, no_prompt);
            cmd.execute().await
        }
        Commands::Generate {
            source_path,
            destination_path,
            data_source_name,
            schema,
            database,
            flat_structure,
        } => {
            commands::generate(
                source_path.as_deref(),
                destination_path.as_deref(),
                data_source_name,
                schema,
                database,
                flat_structure,
            )
            .await
        }
        Commands::Import => import().await,
        Commands::Deploy {
            path,
            dry_run,
            recursive,
        } => deploy_v2(path.as_deref(), dry_run, recursive).await,
    };

    if let Err(e) = result {
        eprintln!("{}", e);
        std::process::exit(1);
    }
}
