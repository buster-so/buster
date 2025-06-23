use anyhow::{Result};
use async_trait::async_trait;
use clap::Parser;
use inquire::{Confirm, Password, Text, PasswordDisplayMode};
use thiserror::Error;

use crate::utils::{
    buster::BusterClient,
    file::buster_credentials::{get_buster_credentials, set_buster_credentials, delete_buster_credentials, BusterCredentials},
};

const DEFAULT_HOST: &str = "https://api.buster.so";

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("API key is required")]
    MissingApiKey,
    #[error("Invalid API key")]
    InvalidApiKey,
    #[error("Failed to validate credentials: {0}")]
    ValidationError(String),
    #[error("Authentication cancelled by user")]
    ClearCredentialsFailed(String),
    #[error("Failed to save credentials: {0}")]
    SaveCredentialsFailed(String),
    #[error("Failed to get user input: {0}")]
    UserInputFailed(String),
}

#[derive(Parser, Debug)]
#[command(about = "Authenticate with Buster API")]
pub struct AuthArgs {
    /// The Buster API host URL
    #[arg(long, env = "BUSTER_HOST", conflicts_with_all = &["local", "cloud"])]
    pub host: Option<String>,

    /// Your Buster API key
    #[arg(long, env = "BUSTER_API_KEY")]
    pub api_key: Option<String>,

    /// Don't save credentials to disk
    #[arg(long)]
    pub no_save: bool,

    /// Clear saved credentials
    #[arg(long)]
    pub clear: bool,

    /// Use local buster instance (http://localhost:3001)
    #[arg(long, help = "Use local buster instance (http://localhost:3001)", conflicts_with_all = &["host", "cloud"])]
    pub local: bool,

    /// Use cloud buster instance (https://api.buster.so)
    #[arg(long, help = "Use cloud buster instance (https://api.buster.so)", conflicts_with_all = &["host", "local"])]
    pub cloud: bool,
}

// --- Credentials Validation Trait ---
#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait CredentialsValidator {
    async fn validate(&self, url: &str, api_key: &str) -> Result<(), AuthError>;
}

pub struct RealCredentialsValidator;

#[async_trait]
impl CredentialsValidator for RealCredentialsValidator {
    async fn validate(&self, url: &str, api_key: &str) -> Result<(), AuthError> {
        let buster_client = BusterClient::new(url.to_string(), api_key.to_string())
            .map_err(|e| AuthError::ValidationError(e.to_string()))?;

        if !buster_client.validate_api_key().await
            .map_err(|e| AuthError::ValidationError(e.to_string()))? {
            return Err(AuthError::InvalidApiKey);
        }

        Ok(())
    }
}

/// Inner logic for checking authentication, testable without file system access.
async fn check_authentication_inner(
    cached_credentials_result: Result<BusterCredentials, anyhow::Error>,
    validator: &dyn CredentialsValidator,
) -> Result<()> {
    let host_env = std::env::var("BUSTER_HOST");
    let api_key_env = std::env::var("BUSTER_API_KEY");

    let credentials = match cached_credentials_result {
        Ok(mut creds) => {
            // Override with env vars if they exist
            if let Ok(host) = host_env {
                creds.url = host;
            }
            if let Ok(api_key) = api_key_env {
                creds.api_key = api_key;
            }
            // Use default host if still empty after checking cache and env var
            if creds.url.is_empty() {
                creds.url = DEFAULT_HOST.to_string();
            }
            Some(creds)
        }
        Err(_) => {
            // No cached creds, rely solely on env vars or defaults
            match (host_env, api_key_env) {
                (Ok(host), Ok(api_key)) => Some(BusterCredentials { url: host, api_key }),
                (Err(_), Ok(api_key)) => Some(BusterCredentials {
                    url: DEFAULT_HOST.to_string(),
                    api_key,
                }),
                _ => None, // Can't proceed without at least an API key
            }
        }
    };

    match credentials {
        Some(creds) => {
            if creds.api_key.is_empty() {
                Err(anyhow::anyhow!(
                    "Authentication required. Please run `buster auth` or set BUSTER_API_KEY."
                ))
            } else {
                // Use the validator trait
                validator.validate(&creds.url, &creds.api_key)
                    .await
                    .map_err(|e| {
                        anyhow::anyhow!(
                            "Authentication failed ({}). Please run `buster auth` to configure credentials.",
                            e
                        )
                    })
            }
        }
        None => Err(anyhow::anyhow!(
            "Authentication required. Please run `buster auth` or set BUSTER_API_KEY."
        )),
    }
}

/// Checks if the user is authenticated by loading credentials and validating them.
/// Prioritizes environment variables (BUSTER_HOST, BUSTER_API_KEY) over cached credentials.
/// Returns Ok(()) if authenticated, otherwise returns an Err prompting the user to run `buster auth`.
pub async fn check_authentication() -> Result<()> {
    let cached_credentials_result = get_buster_credentials()
        .await
        .map_err(anyhow::Error::from);
    let validator = RealCredentialsValidator;
    check_authentication_inner(cached_credentials_result, &validator).await
}

/// Handles the --clear flag logic.
async fn handle_clear_flag(clear: bool) -> Result<bool> {
    if clear {
        delete_buster_credentials().await
            .map_err(|e| AuthError::ClearCredentialsFailed(e.to_string()))?;
        println!("Saved credentials cleared successfully.");
        Ok(true) // Indicate that the command should exit
    } else {
        Ok(false) // Indicate that the command should continue
    }
}

/// Loads existing credentials or initializes default ones, handling overrides from args/env.
/// Also prompts for overwrite confirmation if necessary.
async fn load_and_confirm_credentials(args: &AuthArgs) -> Result<Option<BusterCredentials>> {
    // 1. Load credentials as they are from cache, or use pristine defaults if no cache.
    let loaded_creds = match get_buster_credentials().await {
        Ok(creds) => creds, // These are the actual stored credentials
        Err(_) => BusterCredentials { // These are pristine defaults if nothing is stored
            url: DEFAULT_HOST.to_string(),
            api_key: String::new(),
        },
    };

    // 2. Determine if meaningful credentials were found in the cache.
    //    "Meaningful" here means an API key was actually stored.
    let meaningful_cached_creds_existed = !loaded_creds.api_key.is_empty();

    // 3. Prepare the credentials that will be used, starting with cached/default values.
    //    These will be modified by CLI args.
    let mut effective_creds = loaded_creds.clone();

    // 4. Determine if host and API key are being specified by CLI arguments.
    //    `conflicts_with_all` ensures only one of `args.local`, `args.cloud`, or `args.host` is active.
    let host_is_specified_by_cli_args = args.local || args.cloud || args.host.is_some();
    let api_key_is_specified_by_cli_args = args.api_key.is_some();

    // 5. Decide whether to prompt for overwrite.
    //    Prompt if meaningful cached credentials existed AND
    //    the user is NOT providing a full set of overriding credentials (both host and API key) via CLI args.
    if meaningful_cached_creds_existed && !(host_is_specified_by_cli_args && api_key_is_specified_by_cli_args) {
        let confirm = Confirm::new("Existing credentials found. Do you want to overwrite them?")
            .with_default(false)
            .with_help_message("Select 'y' to proceed with configuring credentials, or 'n' to cancel.")
            .prompt()
            .map_err(|e| AuthError::UserInputFailed(e.to_string()))?;

        if !confirm {
            println!("Authentication cancelled.");
            return Ok(None); // User cancelled, so don't proceed.
        }
        // If user confirms, `effective_creds` (which will have CLI args applied next) will be used.
    }
    // If no meaningful cached creds, or if user provided full CLI args, no prompt needed.

    // 6. Apply CLI argument overrides to `effective_creds`.
    if args.local {
        effective_creds.url = "http://localhost:3001".to_string();
    } else if args.cloud {
        effective_creds.url = DEFAULT_HOST.to_string();
    } else if let Some(host_arg) = &args.host {
        effective_creds.url = host_arg.clone();
    }
    // If no host arg was provided by CLI (neither --local, --cloud, nor --host) AND
    // the URL in effective_creds is currently empty (e.g., cache was empty and returned BusterCredentials with empty url),
    // set it to the default. This ensures URL is not empty before `prompt_for_missing_credentials`
    // if no host arg was given and cache didn't provide one.
    else if effective_creds.url.is_empty() { // This case handles if get_buster_credentials somehow returned empty URL or initial default was empty.
        effective_creds.url = DEFAULT_HOST.to_string();
    }
    // If get_buster_credentials returned a specific URL from cache, and no host args are given, it remains that specific URL.
    // If get_buster_credentials returned the default URL (or cache was empty -> default), and no host args, it remains default.

    if let Some(api_key_arg) = &args.api_key {
        effective_creds.api_key = api_key_arg.clone();
    }

    Ok(Some(effective_creds))
}

/// Prompts the user interactively for missing host and API key information.
async fn prompt_for_missing_credentials(
    creds: &mut BusterCredentials,
    args: &AuthArgs,
    api_key_is_currently_set: bool, // Reflects if API key is set in `creds` before this prompt
) -> Result<()> {
    let host_provided = args.host.is_some();
    let api_key_provided = args.api_key.is_some();

    // Prompt for URL if:
    // - Not using --local.
    // - Not using --cloud.
    // - Not using --host.
    // - AND the current URL in `creds` (after cache/args) is still empty or the default.
    if !args.local && !args.cloud && args.host.is_none() && (creds.url.is_empty() || creds.url == DEFAULT_HOST) {
         let default_url_to_show = if creds.url.is_empty() { DEFAULT_HOST } else { &creds.url };
        let url_input = Text::new("Enter the URL of your Buster API")
            .with_default(default_url_to_show)
            .with_help_message("Press Enter to use the displayed default/current URL")
            .prompt()
            .map_err(|e| AuthError::UserInputFailed(e.to_string()))?;

         // Update only if input is not empty and different from default/current
         if !url_input.is_empty() && url_input != default_url_to_show {
            creds.url = url_input;
         } else if creds.url.is_empty() { // Ensure default is set if prompt skipped with empty initial value
             creds.url = DEFAULT_HOST.to_string();
         }
    }

    // Prompt for API key if not provided via args
    if !api_key_provided {
        let obfuscated_api_key = if creds.api_key.is_empty() {
            String::from("[Not Set]")
        } else {
            format!("{}...", &creds.api_key[0..std::cmp::min(4, creds.api_key.len())])
        };

        let prompt_message = if api_key_is_currently_set { // Use the passed flag
             format!("Enter new API key (current: {obfuscated_api_key}):")
        } else {
             format!("Enter your API key (current: {obfuscated_api_key}):")
        };

        let help_message = format!(
            "Your API key can be found at {}/app/settings/api-keys. Leave blank to keep the current key.",
            creds.url
        );

        let api_key_input = Text::new(&prompt_message)
            // .without_confirmation() // Removed for Text input
            // .with_display_mode(PasswordDisplayMode::Masked) // Removed for Text input
            .with_help_message(&help_message)
            .prompt()
            .map_err(|e| AuthError::UserInputFailed(e.to_string()))?;

        // Update only if new input was provided
        if !api_key_input.is_empty() {
            creds.api_key = api_key_input;
        }
    }

    // Final check: Ensure API key is present after args and prompts
    if creds.api_key.is_empty() {
        return Err(AuthError::MissingApiKey.into());
    }

    println!("\n");

    Ok(())
}

/// Validates the provided credentials using the validator trait.
async fn validate_credentials(
    creds: &BusterCredentials,
    validator: &dyn CredentialsValidator,
) -> Result<()> {
    validator.validate(&creds.url, &creds.api_key).await?;
    Ok(())
}

/// Saves credentials to disk or prints a success message.
async fn save_credentials_or_notify(
    creds: BusterCredentials,
    no_save: bool,
) -> Result<()> {
    let masked_api_key = if creds.api_key.is_empty() {
        "[Not Set]".to_string() // Should ideally not happen if validation passed
    } else {
        let api_key_len = creds.api_key.len();
        let visible_part_start_index = if api_key_len > 6 { api_key_len - 6 } else { 0 };
        format!("****{}", &creds.api_key[visible_part_start_index..])
    };

    println!("✅ You've successfully connected to Buster!");
    println!(); // Newline for separation
    println!("Connection details:");
    println!("  host: {}", creds.url);
    println!("  api_key: {}", masked_api_key);

    if !no_save {
        set_buster_credentials(creds)
            .await
            .map_err(|e| AuthError::SaveCredentialsFailed(e.to_string()))?;
        println!("\nCredentials saved successfully!");
    } else {
        println!("\nNote: Credentials were not saved due to --no-save flag");
    }
    Ok(())
}

/// Main function orchestrating the authentication flow.
pub async fn auth_with_args(args: AuthArgs) -> Result<()> {
    // 1. Handle --clear flag
    if handle_clear_flag(args.clear).await? {
        return Ok(()); // Exit early if credentials were cleared
    }

    // 2. Load existing credentials or initialize defaults, confirm overwrite if needed, and apply args
    let mut creds_after_load_and_args = match load_and_confirm_credentials(&args).await? {
         Some(creds) => creds,
         None => return Ok(()), // User cancelled overwrite prompt
    };
    
    // Store the host URL that will be used for connection attempts.
    // This URL is determined after considering cache, defaults, and CLI args like --local, --cloud, --host.
    let attempted_host_url = creds_after_load_and_args.url.clone();

    // This flag is for tailoring the prompt text in `prompt_for_missing_credentials`.
    let api_key_is_present_before_interactive_prompt = !creds_after_load_and_args.api_key.is_empty();

    // 3. Prompt for missing credentials interactively
    if let Err(prompt_err) = prompt_for_missing_credentials(
        &mut creds_after_load_and_args, 
        &args, 
        api_key_is_present_before_interactive_prompt
    ).await {
        eprintln!("Failed during credential input process.");
        eprintln!("Intended host for configuration: {}", attempted_host_url);
        return Err(prompt_err); // Propagate the original error (anyhow::Error)
    }

    // 4. Validate the final credentials
    let validator = RealCredentialsValidator;
    if let Err(validation_err) = validate_credentials(&creds_after_load_and_args, &validator).await {
        // validation_err is AuthError. We print its specific message.
        eprintln!("Authentication failed: {}", validation_err);
        eprintln!("Attempted to connect to host: {}", attempted_host_url);
        return Err(validation_err.into()); // Propagate as anyhow::Error
    }

    // 5. Save credentials or notify
    // This function prints connection details (including host) on success internally.
    // If it errors, it's a save error after successful validation, not a connection/validation error.
    save_credentials_or_notify(creds_after_load_and_args, args.no_save).await?;

    Ok(())
}

// --- Tests --- 
#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::file::buster_credentials::BusterCredentials;
    use mockall::predicate::*;
    use std::env;

    // Helper to run async tests with env var setup/teardown
    async fn run_test_with_env<F, Fut>(env_vars: Vec<(&str, &str)>, test_fn: F)
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = ()>,
    {
        // Use a mutex to ensure env vars don't interfere between parallel tests
        static ENV_MUTEX: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());
        let _guard = ENV_MUTEX.lock().await;

        let original_vars: Vec<(&str, Option<String>)> = env_vars
            .iter()
            .map(|(k, _)| (*k, env::var(*k).ok()))
            .collect();

        for (k, v) in &env_vars {
            env::set_var(k, v);
        }

        (test_fn)().await;

        // Teardown: Restore original environment variables
        for (k, v) in original_vars {
            match v {
                Some(val) => env::set_var(k, val),
                None => env::remove_var(k),
            }
        }
    }

    #[tokio::test]
    async fn check_inner_success_env_only() {
        let test_host = "http://env.host";
        let test_key = "env_key";
        run_test_with_env(vec![("BUSTER_HOST", test_host), ("BUSTER_API_KEY", test_key)], || async {
            let mut mock_validator = MockCredentialsValidator::new();
            mock_validator
                .expect_validate()
                .with(eq(test_host), eq(test_key))
                .times(1)
                .returning(|_, _| Ok(()));
            
            // Pass Err to simulate no cache file found
            let result = check_authentication_inner(Err(anyhow::anyhow!("No cache")), &mock_validator).await;
            assert!(result.is_ok());
        })
        .await;
    }

    #[tokio::test]
    async fn check_inner_success_cache_only() {
        // Define creds outside the test closure for lifetime reasons
        let cached_creds = BusterCredentials {
            url: "http://cache.host".to_string(),
            api_key: "cache_key".to_string(),
        };
        // Clone fields needed for the closure *before* the test closure
        let expected_url = cached_creds.url.clone();
        let expected_key = cached_creds.api_key.clone();

        run_test_with_env(vec![], || async {
            let mut mock_validator = MockCredentialsValidator::new();
            mock_validator
                .expect_validate()
                 // Use withf with the cloned values
                .withf(move |url: &str, key: &str| {
                    url == expected_url && key == expected_key
                })
                .times(1)
                .returning(|_, _| Ok(()));

             // Clone creds when passing into the function
            let result = check_authentication_inner(Ok(cached_creds.clone()), &mock_validator).await;
            assert!(result.is_ok());
        })
        .await;
    }

     #[tokio::test]
    async fn check_inner_success_env_overrides_cache() {
        // Define creds outside the test closure
        let cached_creds = BusterCredentials {
            url: "http://cache.host".to_string(),
            api_key: "cache_key".to_string(),
        };
        let test_host = "http://env.host";
        let test_key = "env_key";
        // Clone fields needed for the closure
        let expected_host = test_host.to_string(); 
        let expected_key = test_key.to_string();

        run_test_with_env(vec![("BUSTER_HOST", test_host), ("BUSTER_API_KEY", test_key)], || async {
             let mut mock_validator = MockCredentialsValidator::new();
             mock_validator
                 .expect_validate()
                 // Use withf with the cloned values
                 .withf(move |url: &str, key: &str| {
                    url == expected_host && key == expected_key
                 })
                 .times(1)
                 .returning(|_, _| Ok(()));
 
             // Clone creds when passing into the function
             let result = check_authentication_inner(Ok(cached_creds.clone()), &mock_validator).await;
             assert!(result.is_ok());
        })
        .await;
    }

     #[tokio::test]
     async fn check_inner_fail_missing_api_key_env() {
         run_test_with_env(vec![("BUSTER_HOST", "http://some.host")], || async { // No API Key
             let mut mock_validator = MockCredentialsValidator::new();
             mock_validator.expect_validate().times(0); // Validator should not be called
 
             let result = check_authentication_inner(Err(anyhow::anyhow!("No cache")), &mock_validator).await;
             assert!(result.is_err());
             assert!(result.unwrap_err().to_string().contains("BUSTER_API_KEY"));
         })
         .await;
     }

     #[tokio::test]
     async fn check_inner_fail_missing_api_key_cache() {
         // Define creds outside the test closure
         let cached_creds = BusterCredentials {
             url: "http://cache.host".to_string(),
             api_key: "".to_string(), // Empty API Key
         };
         run_test_with_env(vec![], || async {
             let mut mock_validator = MockCredentialsValidator::new();
             mock_validator.expect_validate().times(0);
 
              // Clone creds when passing into the function
             let result = check_authentication_inner(Ok(cached_creds.clone()), &mock_validator).await;
             assert!(result.is_err());
             assert!(result.unwrap_err().to_string().contains("BUSTER_API_KEY"));
         })
         .await;
     }

    #[tokio::test]
    async fn check_inner_fail_validation() {
        let test_host = "http://env.host";
        let test_key = "env_key_invalid";
        run_test_with_env(vec![("BUSTER_HOST", test_host), ("BUSTER_API_KEY", test_key)], || async {
            let mut mock_validator = MockCredentialsValidator::new();
            mock_validator
                .expect_validate()
                .with(eq(test_host), eq(test_key))
                .times(1)
                .returning(|_, _| Err(AuthError::InvalidApiKey)); // Return error

            let result = check_authentication_inner(Err(anyhow::anyhow!("No cache")), &mock_validator).await;
            assert!(result.is_err());
            assert!(result.unwrap_err().to_string().contains("Authentication failed (Invalid API key)"));
        })
        .await;
    }

     #[tokio::test]
     async fn check_inner_fail_no_creds() {
         run_test_with_env(vec![], || async { // No env vars
             let mut mock_validator = MockCredentialsValidator::new();
             mock_validator.expect_validate().times(0);
 
             let result = check_authentication_inner(Err(anyhow::anyhow!("No cache")), &mock_validator).await;
             assert!(result.is_err());
              assert!(result.unwrap_err().to_string().contains("BUSTER_API_KEY"));
         })
         .await;
     }
}
