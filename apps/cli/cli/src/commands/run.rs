use crate::commands::config_utils;
use crate::error::BusterError;
use dirs;
use indicatif::{ProgressBar, ProgressStyle};
use rust_embed::RustEmbed;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;
use colored::*;

#[derive(RustEmbed)]
#[folder = "../../"]
#[include = ".env.example"]
#[include = "docker-compose.yml"]
#[include = "supabase/.env.example"]
#[include = "supabase/**/*"]
#[exclude = "supabase/volumes/db/data/**/*"]
#[exclude = "supabase/volumes/storage/**/*"]
#[exclude = "supabase/.env"]
#[exclude = "supabase/test.http"]
#[exclude = "supabase/docker-compose.override.yml"]
struct StaticAssets;

async fn setup_persistent_app_environment(env_vars: Option<&[(String, String)]>) -> Result<PathBuf, BusterError> {
    let app_base_dir = config_utils::get_app_base_dir().map_err(|e| {
        BusterError::CommandError(format!("Failed to get app base directory: {}", e))
    })?;

    // --- Check if core config files exist --- 
    let main_dot_env_path = app_base_dir.join(".env");
    let docker_compose_path = app_base_dir.join("docker-compose.yml");
    let supabase_dot_env_path = app_base_dir.join("supabase/.env");
    let litellm_config_path = app_base_dir.join("litellm_config/config.yaml");

    let initial_setup_needed = !main_dot_env_path.exists()
        || !docker_compose_path.exists()
        || !supabase_dot_env_path.exists()
        || !litellm_config_path.exists();
    // --- End Check --- 

    if initial_setup_needed {
        println!("Performing initial setup for Buster environment in {}", app_base_dir.display());

        // --- Begin Initial Setup Block (Asset Extraction, Directory Creation) ---
        fs::create_dir_all(&app_base_dir).map_err(|e| {
            BusterError::CommandError(format!(
                "Failed to create persistent app directory at {}: {}",
                app_base_dir.display(),
                e
            ))
        })?;

        for filename_cow in StaticAssets::iter() {
            let filename = filename_cow.as_ref();
            let asset = StaticAssets::get(filename).ok_or_else(|| {
                BusterError::CommandError(format!("Failed to get embedded asset: {}", filename))
            })?;
            let target_file_path = app_base_dir.join(filename);

            if let Some(parent) = target_file_path.parent() {
                fs::create_dir_all(parent).map_err(|e| {
                    BusterError::CommandError(format!(
                        "Failed to create directory {}: {}",
                        parent.display(),
                        e
                    ))
                })?;
            }

            fs::write(&target_file_path, asset.data).map_err(|e| {
                BusterError::CommandError(format!(
                    "Failed to write embedded file {} to {}: {}",
                    filename,
                    target_file_path.display(),
                    e
                ))
            })?;
        }

        let supabase_volumes_functions_path = app_base_dir.join("supabase/volumes/functions");
        fs::create_dir_all(supabase_volumes_functions_path).map_err(|e| {
            BusterError::CommandError(format!(
                "Failed to create supabase/volumes/functions in persistent app dir: {}",
                e
            ))
        })?;

        // Initialize .env from .env.example (root)
        let example_env_src_path = app_base_dir.join(".env.example");
        if example_env_src_path.exists() {
            fs::copy(&example_env_src_path, &main_dot_env_path).map_err(|e| {
                BusterError::CommandError(format!(
                    "Failed to initialize root .env ({}) from {}: {}",
                    main_dot_env_path.display(),
                    example_env_src_path.display(),
                    e
                ))
            })?;
        } else {
            return Err(BusterError::CommandError(format!(
                "Critical setup error: Root {} not found after asset extraction. Cannot initialize main .env file.",
                example_env_src_path.display()
            )));
        }

        // Initialize supabase/.env from supabase/.env.example
        let supabase_example_env_src_path = app_base_dir.join("supabase/.env.example");
        if supabase_example_env_src_path.exists() {
            fs::copy(&supabase_example_env_src_path, &supabase_dot_env_path).map_err(|e| {
                BusterError::CommandError(format!(
                    "Failed to initialize supabase/.env ({}) from {}: {}",
                    supabase_dot_env_path.display(),
                    supabase_example_env_src_path.display(),
                    e
                ))
            })?;
        } else {
            return Err(BusterError::CommandError(format!(
                "Critical setup error: Supabase {} not found after asset extraction. Cannot initialize supabase/.env file.",
                supabase_example_env_src_path.display()
            )));
        }
        // --- End Initial Setup Block --- 

    } else {
        println!("Core configuration files found. Skipping initial asset extraction.");
    }

    // --- Configuration Checks/Updates (Always Run) ---
    // NOTE: These functions handle their own caching and prompting logic internally.
    // They also print their own headers/messages.
    let llm_api_key = config_utils::prompt_and_manage_openai_api_key(&app_base_dir, false)?;
    let reranker_config_result = config_utils::prompt_and_manage_reranker_settings(&app_base_dir, false);

    // Handle potential skip of reranker setup
    let (rerank_api_key_opt, rerank_model_opt, rerank_base_url_opt) = match reranker_config_result {
        Ok(config) => (Some(config.api_key), Some(config.model), Some(config.base_url)),
        Err(BusterError::CommandError(msg)) if msg.contains("skipped by user") => {
            println!("Reranker setup was skipped. Ensuring related .env variables are not present.");
            (None, None, None)
        },
        Err(e) => return Err(e), // Propagate other errors
    };

    // Update LiteLLM YAML config - use the confirmed LLM key, handle base URL appropriately
    // We pass None for api_base here because prompt_and_manage_openai_api_key defaults to OpenAI and doesn't handle custom base URLs yet.
    // update_env_file will handle LLM_BASE_URL if needed.
    let updated_litellm_config_path = config_utils::update_litellm_yaml(
        &app_base_dir,
        &llm_api_key,
        None, // Let .env handle LLM_BASE_URL if set
    )?;
    let litellm_config_path_str = updated_litellm_config_path.to_string_lossy();

    // Update root .env file with potentially new/confirmed keys and paths
    config_utils::update_env_file(
        &main_dot_env_path, 
        Some(&llm_api_key),
        rerank_api_key_opt.as_deref(), // Use Option::as_deref
        rerank_model_opt.as_deref(),
        rerank_base_url_opt.as_deref(),
        None, // LLM_BASE_URL not explicitly managed here, relies on .env default or user manual edit
        Some(&litellm_config_path_str),
    )
    .map_err(|e| {
        BusterError::CommandError(format!(
            "Failed to ensure .env file configurations in {}: {}",
            main_dot_env_path.display(),
            e
        ))
    })?;

    // Update arbitrary environment variables if provided
    if let Some(env_vars) = env_vars {
        if !env_vars.is_empty() {
            println!("Updating custom environment variables...");
            config_utils::update_arbitrary_env_vars(&main_dot_env_path, env_vars)
                .map_err(|e| {
                    BusterError::CommandError(format!(
                        "Failed to update custom environment variables in {}: {}",
                        main_dot_env_path.display(),
                        e
                    ))
                })?;
            
            for (key, value) in env_vars {
                println!("Set {}={}", key, if key.to_lowercase().contains("key") || key.to_lowercase().contains("password") || key.to_lowercase().contains("secret") { "***" } else { value });
            }
        }
    }

    println!("--- Configuration Setup/Check Complete ---");
    // --- END Configuration Checks/Updates --- 

    Ok(app_base_dir)
}

async fn run_docker_compose_command(
    app_base_dir: &Path,
    args: &[&str],
    operation_name: &str,
    no_track: bool,
) -> Result<(), BusterError> {
    let persistent_app_dir = app_base_dir;

    // --- BEGIN Telemetry Update --- 
    if operation_name == "Starting" && no_track {
        let main_dot_env_target_path = persistent_app_dir.join(".env");
        if main_dot_env_target_path.exists() {
            let mut content = fs::read_to_string(&main_dot_env_target_path).map_err(|e| {
                BusterError::CommandError(format!(
                    "Failed to read root .env file for telemetry update: {}",
                    e
                ))
            })?;

            let original_content = content.clone();
            content = content.replace("TELEMETRY_ENABLED=\"true\"", "TELEMETRY_ENABLED=\"false\"");
            content = content.replace("TELEMETRY_ENABLED=true", "TELEMETRY_ENABLED=false"); // Also handle without quotes

            if content != original_content {
                fs::write(&main_dot_env_target_path, content).map_err(|e| {
                    BusterError::CommandError(format!(
                        "Failed to write updated .env file for telemetry update: {}",
                        e
                    ))
                })?;
                println!("Telemetry disabled in {}", main_dot_env_target_path.display());
            }
        } else {
            println!("Warning: Root .env file not found at {}. Could not disable telemetry.", main_dot_env_target_path.display());
        }
    }
    // --- END Telemetry Update --- 

    // Handle LiteLLM config if a start or reset operation is being performed
    if operation_name == "Starting" || operation_name == "Resetting" {
        // Check if litellm_config path is in environment
        let litellm_config_path = if let Ok(path) = std::env::var("LITELLM_CONFIG_PATH") {
            Some(path)
        } else {
            // Try to read from .env file
            let env_path = persistent_app_dir.join(".env");
            if env_path.exists() {
                let content = fs::read_to_string(&env_path).map_err(|e| {
                    BusterError::CommandError(format!(
                        "Failed to read .env file at {}: {}",
                        env_path.display(),
                        e
                    ))
                })?;
                
                content.lines()
                    .find(|line| line.starts_with("LITELLM_CONFIG_PATH="))
                    .and_then(|line| {
                        line.split('=').nth(1).map(|s| {
                            s.trim_matches(|c| c == '"' || c == '\'').to_string()
                        })
                    })
            } else {
                None
            }
        };
        
        // If we have a litellm config path, modify docker-compose.yml to use it
        if let Some(config_path) = litellm_config_path {
            println!("Using custom LiteLLM configuration: {}", config_path);
            
            // Read the docker-compose.yml file
            let docker_compose_path = persistent_app_dir.join("docker-compose.yml");
            let docker_compose_content = fs::read_to_string(&docker_compose_path).map_err(|e| {
                BusterError::CommandError(format!(
                    "Failed to read docker-compose.yml: {}",
                    e
                ))
            })?;
            
            // Create a simple backup
            fs::write(
                persistent_app_dir.join("docker-compose.yml.bak"),
                &docker_compose_content,
            )
            .map_err(|e| {
                BusterError::CommandError(format!(
                    "Failed to create backup of docker-compose.yml: {}",
                    e
                ))
            })?;
            
            // Replace the litellm config path
            let modified_content = docker_compose_content
                .replace(
                    "      - ./litellm_vertex_config.yaml:/litellm_vertex_config.yaml",
                    &format!("      - {}:/litellm_config.yaml", config_path)
                )
                .replace(
                    "    command: [\"--config\", \"/litellm_vertex_config.yaml\", \"--port\", \"4001\"]",
                    "    command: [\"--config\", \"/litellm_config.yaml\", \"--port\", \"4001\"]"
                );
            
            // Write the modified docker-compose.yml
            fs::write(&docker_compose_path, modified_content).map_err(|e| {
                BusterError::CommandError(format!(
                    "Failed to update docker-compose.yml with custom LiteLLM config: {}",
                    e
                ))
            })?;
        }
    }

    let data_db_path = persistent_app_dir.join("supabase/volumes/db/data");
    fs::create_dir_all(&data_db_path).map_err(|e| {
        BusterError::CommandError(format!(
            "Failed to create persistent data directory at {}: {}",
            data_db_path.display(),
            e
        ))
    })?;

    let data_storage_path = persistent_app_dir.join("supabase/volumes/storage");
    fs::create_dir_all(&data_storage_path).map_err(|e| {
        BusterError::CommandError(format!(
            "Failed to create persistent data directory at {}: {}",
            data_storage_path.display(),
            e
        ))
    })?;

    let pb = ProgressBar::new_spinner();
    pb.enable_steady_tick(Duration::from_millis(120));
    pb.set_style(
        ProgressStyle::default_spinner()
            .tick_strings(&["▹▹▹▹▹", "▸▹▹▹▹", "▹▸▹▹▹", "▹▹▸▹▹", "▹▹▹▸▹", "▹▹▹▹▸", "✔"])
            .template("{spinner:.blue} {msg}")
            .expect("Failed to set progress bar style"),
    );
    if operation_name == "Starting" {
        pb.set_message(format!(
            "{} Buster services... (this may take a few minutes)",
            operation_name
        ));
    } else {
        pb.set_message(format!("{} Buster services...", operation_name));
    }

    let mut cmd = Command::new("docker");
    cmd.current_dir(&persistent_app_dir);
    cmd.arg("compose")
        .arg("-p")
        .arg("buster")
        .arg("-f")
        .arg("docker-compose.yml")
        .args(args);

    let output = cmd.output().map_err(|e| {
        BusterError::CommandError(format!(
            "Failed to execute docker compose {}: {}",
            args.join(" "),
            e
        ))
    })?;

    if output.status.success() {
        pb.finish_with_message(format!(
            "Buster services {} successfully.",
            operation_name.to_lowercase()
        ));
        // Add port information specifically after starting
        if operation_name == "Starting" {
            println!("\n{}", format!("✅ Buster is now available at: {}", "http://localhost:3000".cyan()).bold());
        }
        Ok(())
    } else {
        let err_msg = format!(
            "docker compose {} failed (status: {}). Logs:\nWorking directory: {}\nStdout:\n{}\nStderr:\n{}",
            args.join(" "),
            output.status,
            persistent_app_dir.display(),
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        pb.abandon_with_message(format!(
            "Error: docker compose {} failed. See console for details.",
            args.join(" ")
        ));
        println!("\nDocker Compose Error Details:\n{}", err_msg);
        Err(BusterError::CommandError(err_msg))
    }
}

pub async fn start(no_track: bool, env_vars: Vec<(String, String)>) -> Result<(), BusterError> {
    // First, run the setup/check which includes printing headers/prompts if needed
    let env_vars_option = if env_vars.is_empty() { None } else { Some(env_vars.as_slice()) };
    let app_base_dir = setup_persistent_app_environment(env_vars_option).await?;
    // Then, run the docker command in that directory
    run_docker_compose_command(&app_base_dir, &["up", "-d"], "Starting", no_track).await
}

pub async fn stop() -> Result<(), BusterError> {
    // Get the app dir path directly, skipping setup/checks
    let app_base_dir = config_utils::get_app_base_dir().map_err(|e| {
        BusterError::CommandError(format!("Failed to get app base directory: {}", e))
    })?;
    // Run the docker command in that directory
    run_docker_compose_command(&app_base_dir, &["down"], "Stopping", false).await
}

pub async fn reset() -> Result<(), BusterError> {
    println!("WARNING: This command will stop all Buster services, attempt to remove their current images, and then restart them from scratch.");
    println!(
        "This can lead to a complete wipe of the Buster database and any other local service data."
    );
    println!("The ~/.buster directory will be wiped, except for ~/.buster/credentials.yml if it exists.");
    println!("This action is irreversible.");
    print!("Are you sure you want to proceed with resetting? (y/n): ");
    io::stdout()
        .flush()
        .map_err(|e| BusterError::CommandError(format!("Failed to flush stdout: {}", e)))?;

    let mut confirmation = String::new();
    io::stdin()
        .read_line(&mut confirmation)
        .map_err(|e| BusterError::CommandError(format!("Failed to read user input: {}", e)))?;

    if confirmation.trim().to_lowercase() != "y" {
        println!("Reset cancelled by user.");
        return Ok(());
    }

    // Get app_base_dir directly at the start
    let app_base_dir = config_utils::get_app_base_dir().map_err(|e| {
        BusterError::CommandError(format!("Failed to get app base directory: {}", e))
    })?;
    println!("Target application directory for reset: {}", app_base_dir.display());

    // Backup credentials if they exist (uses app_base_dir)
    let credentials_path = app_base_dir.join("credentials.yml");
    let credentials_backup = fs::read(&credentials_path).ok();
    if credentials_backup.is_some() {
        println!("Found credentials.yml at {}, will attempt to preserve it.", credentials_path.display());
    } else {
        println!("No credentials.yml found at {} to preserve.", credentials_path.display());
    }

    // Ensure app_base_dir exists and temporary docker-compose.yml for commands
    fs::create_dir_all(&app_base_dir).map_err(|e| BusterError::CommandError(format!("Failed to create app base directory {}: {}", app_base_dir.display(), e)))?;
    let dc_filename = "docker-compose.yml";
    // Ensure docker-compose.yml exists for the down command, even if basic
    if !app_base_dir.join(dc_filename).exists() {
        let dc_asset = StaticAssets::get(dc_filename)
            .ok_or_else(|| BusterError::CommandError(format!("Failed to get embedded asset: {}", dc_filename)))?;
        fs::write(app_base_dir.join(dc_filename), dc_asset.data.as_ref()).map_err(|e| BusterError::CommandError(format!("Failed to write temporary {}: {}", dc_filename, e)))?;
    }
    // Ensure supabase/.env exists for docker-compose down (can be empty)
    let supabase_dir = app_base_dir.join("supabase");
    fs::create_dir_all(&supabase_dir).map_err(|e| BusterError::CommandError(format!("Failed to create supabase directory in app base dir: {}", e)))?;
    if !supabase_dir.join(".env").exists() {
        fs::write(supabase_dir.join(".env"), "").map_err(|e| BusterError::CommandError(format!("Failed to write temporary supabase/.env: {}",e)))?;
    }

    let pb = ProgressBar::new_spinner();
    pb.enable_steady_tick(Duration::from_millis(120));
    pb.set_style(
        ProgressStyle::default_spinner()
            .tick_strings(&["▹▹▹▹▹", "▸▹▹▹▹", "▹▸▹▹▹", "▹▹▸▹▹", "▹▹▹▸▹", "▹▹▹▹▸", "✔"])
            .template("{spinner:.blue} {msg}")
            .expect("Failed to set progress bar style"),
    );

    // Step 1: Stop services (Execute docker compose down directly)
    pb.set_message("Resetting Buster services (1/3): Stopping services...");
    let mut down_cmd = Command::new("docker");
    down_cmd
        .current_dir(&app_base_dir) // Use the obtained app_base_dir
        .arg("compose")
        .arg("-p")
        .arg("buster")
        .arg("-f")
        .arg("docker-compose.yml") // Relative to app_base_dir
        .arg("down");

    let down_output = down_cmd.output().map_err(|e| {
        BusterError::CommandError(format!("Failed to execute docker compose down: {}", e))
    })?;
    if !down_output.status.success() {
        let err_msg = format!(
            "docker compose down failed (status: {}). Logs:\nWorking directory: {}\nStdout:\n{}\nStderr:\n{}",
            down_output.status,
            app_base_dir.display(),
            String::from_utf8_lossy(&down_output.stdout),
            String::from_utf8_lossy(&down_output.stderr)
        );
        pb.println(format!("Warning: {} - Proceeding with reset.", err_msg));
    } else {
        pb.println("Services stopped successfully.");
    }

    // Step 2: Identify and Remove service images (uses app_base_dir)
    pb.set_message("Resetting Buster services (2/3): Removing service images...");
    let mut config_images_cmd = Command::new("docker");
    config_images_cmd
        .current_dir(&app_base_dir) // Use the obtained app_base_dir
        .arg("compose")
        .arg("-p")
        .arg("buster")
        .arg("-f")
        .arg("docker-compose.yml") // Relative to app_base_dir
        .arg("config")
        .arg("--images");

    let config_images_output = config_images_cmd.output().map_err(|e| {
        BusterError::CommandError(format!(
            "Failed to execute docker compose config --images: {}",
            e
        ))
    })?;

    let mut image_list_str;
    if !config_images_output.status.success() {
        let err_msg = format!(
            "docker compose config --images failed (status: {}). Logs:
Working directory: {}
Stdout:
{}
Stderr:
{}",
            config_images_output.status,
            app_base_dir.display(),
            String::from_utf8_lossy(&config_images_output.stdout),
            String::from_utf8_lossy(&config_images_output.stderr)
        );
        pb.println(format!("Warning: {} - Skipping image removal and proceeding with reset.", err_msg));
        image_list_str = String::new(); // Ensure image_names is empty
    } else {
        image_list_str = String::from_utf8_lossy(&config_images_output.stdout).to_string();
    }

    let image_names: Vec<&str> = image_list_str
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect();

    if image_names.is_empty() {
        pb.println(
            "No images identified by docker-compose config --images. Skipping image removal.",
        );
    } else {
        pb.println(format!("Found {} image(s) to remove.", image_names.len()));
        for (index, image_name) in image_names.iter().enumerate() {
            let current_image_name = image_name.trim();
            if current_image_name.is_empty() {
                continue;
            }
            pb.set_message(format!(
                "Resetting Buster services (2/3): Removing image {}/{} ('{}')...",
                index + 1,
                image_names.len(),
                current_image_name
            ));
            let mut rmi_cmd = Command::new("docker");
            rmi_cmd.arg("image").arg("rm").arg(current_image_name); // Image names are global

            let rmi_output = rmi_cmd.output().map_err(|e| {
                BusterError::CommandError(format!(
                    "Failed to execute docker image rm {}: {}",
                    current_image_name, e
                ))
            })?;

            if !rmi_output.status.success() {
                let rmi_stderr = String::from_utf8_lossy(&rmi_output.stderr);
                if !rmi_stderr.trim().is_empty() && !rmi_stderr.contains("No such image") {
                    pb.println(format!("Warning: Could not remove image '{}'. It might be in use or already removed. Stderr: {}", current_image_name, rmi_stderr.trim()));
                }
            } else {
                pb.println(format!("Successfully removed image: {}", current_image_name));
            }
        }
    }
    pb.println("Service image removal process complete.");

    // Step 3: Wipe app_base_dir and restore credentials (uses app_base_dir)
    pb.set_message(format!("Resetting Buster services (3/3): Wiping {} and restoring credentials...", app_base_dir.display()));

    if app_base_dir.exists() {
        fs::remove_dir_all(&app_base_dir).map_err(|e| {
            BusterError::CommandError(format!("Failed to remove app directory {}: {}", app_base_dir.display(), e))
        })?;
        pb.println(format!("Successfully removed directory: {}", app_base_dir.display()));
    }

    fs::create_dir_all(&app_base_dir).map_err(|e| {
        BusterError::CommandError(format!("Failed to recreate app directory {}: {}", app_base_dir.display(), e))
    })?;
    pb.println(format!("Successfully recreated directory: {}", app_base_dir.display()));

    if let Some(backup_data) = credentials_backup {
        fs::write(&credentials_path, backup_data).map_err(|e| {
            BusterError::CommandError(format!("Failed to restore credentials.yml to {}: {}", credentials_path.display(), e))
        })?;
        pb.println(format!("Successfully restored: {}", credentials_path.display()));
    } else {
        pb.println(format!("No prior credentials.yml to restore for {}.", credentials_path.display()));
    }

    pb.finish_with_message(
        format!("Buster reset complete. Docker services stopped, images removed. Directory {} wiped (credentials.yml preserved if found). Run 'buster start' to rebuild.", app_base_dir.display())
    );
    Ok(())
}
