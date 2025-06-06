mod commands;
mod error;
mod types;
mod utils;

use clap::{Parser, Subcommand};
use commands::{auth::check_authentication, auth::AuthArgs, init, run};
use utils::updater::check_for_updates;
use anyhow;

pub const APP_NAME: &str = "buster";
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const BUILD_DATE: &str = env!("BUILD_DATE");
pub const GIT_HASH: &str = env!("GIT_HASH");

#[derive(Subcommand)]
#[clap(rename_all = "kebab-case")]
pub enum Commands {
    /// Initialize a new Buster project
    Init {
        /// Path to create the buster.yml file (defaults to current directory)
        #[arg(long)]
        destination_path: Option<String>,
    },
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

        /// Clear saved credentials
        #[arg(long)]
        clear: bool,

        /// Use local Buster API
        #[arg(long, group = "api_mode")]
        local: bool,

        /// Use cloud Buster API
        #[arg(long, group = "api_mode")]
        cloud: bool,
    },
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
    Deploy {
        #[arg(long)]
        path: Option<String>,
        #[arg(long, default_value_t = false)]
        dry_run: bool,
        /// Recursively search for model files in subdirectories
        #[arg(long, default_value_t = true)]
        recursive: bool,
    },
    /// Generate or update semantic model YAML definitions from dbt project
    Generate {
        /// Optional path to a specific dbt model .sql file or a directory of dbt models to process.
        /// If not provided, processes models based on 'model_paths' in buster.yml.
        #[arg(long)]
        path: Option<String>,
        /// Optional path to the semantic model YAML file to update.
        /// If not provided, uses 'semantic_models_file' from buster.yml.
        #[arg(long, short = 'o', name = "output-file")]
        // output-file as a more descriptive name for the arg
        target_semantic_file: Option<String>,
    },
    /// Parse and validate semantic model YAML definitions
    Parse {
        /// Optional path to a specific model .yml file or a directory of models to process.
        /// If not provided, processes models based on 'model_paths' in buster.yml or CWD.
        #[arg(long)]
        path: Option<String>,
    },
    /// Interactively manage LLM and Reranker configurations
    Config,
    /// Start the Buster services
    Start {
        /// Disable telemetry tracking
        #[arg(long, default_value_t = false)]
        no_track: bool,
        /// Set environment variables (can be used multiple times)
        /// Format: KEY=VALUE
        #[arg(long = "env", action = clap::ArgAction::Append)]
        env_vars: Vec<String>,
    },
    /// Stop the Buster services
    Stop,
    /// Restart the Buster services
    Reset,
}

#[derive(Parser)]
#[command(name = APP_NAME, version = VERSION, about = "Buster CLI - manage your semantic models and interact with the Buster API.")]
pub struct Args {
    #[command(subcommand)]
    pub cmd: Commands,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    check_for_updates().await;

    // TODO: All commands should check for an update.
    let result = match args.cmd {
        Commands::Init { destination_path } => init(destination_path.as_deref()).await,
        Commands::Auth {
            host,
            api_key,
            no_save,
            clear,
            local,
            cloud,
        } => {
            commands::auth::auth_with_args(AuthArgs {
                host,
                api_key,
                no_save,
                clear,
                local,
                cloud,
            })
            .await
        }
        Commands::Update {
            check_only,
            force,
            no_prompt,
        } => {
            let cmd = commands::update::UpdateCommand::new(check_only, force, no_prompt);
            cmd.execute().await
        }
        Commands::Deploy {
            path,
            dry_run,
            recursive,
        } => {
            async move {
                check_authentication().await?;
                commands::deploy::deploy(path.as_deref(), dry_run, recursive).await
            }
            .await
        }
        Commands::Generate {
            path,
            target_semantic_file,
        } => commands::generate::generate_semantic_models_command(path, target_semantic_file).await,
        Commands::Parse { path } => commands::parse::parse_models_command(path).await,
        Commands::Config => commands::config::manage_settings_interactive().await.map_err(anyhow::Error::from),
        Commands::Start { no_track, env_vars } => {
            // Parse env vars from KEY=VALUE format
            let parsed_env_vars: Result<Vec<(String, String)>, _> = env_vars
                .iter()
                .map(|env_str| {
                    env_str.split_once('=')
                        .map(|(k, v)| (k.to_string(), v.to_string()))
                        .ok_or_else(|| anyhow::anyhow!("Invalid env var format '{}'. Expected KEY=VALUE", env_str))
                })
                .collect();
            
            match parsed_env_vars {
                Ok(env_pairs) => run::start(no_track, env_pairs).await.map_err(anyhow::Error::from),
                Err(e) => Err(e),
            }
        }
        Commands::Stop => run::stop().await.map_err(anyhow::Error::from),
        Commands::Reset => run::reset().await.map_err(anyhow::Error::from),
    };

    if let Err(e) = result {
        eprintln!("{}", e);
        std::process::exit(1);
    }
}
