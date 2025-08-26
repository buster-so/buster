use anyhow::{Context, Result};
use infisical::{AuthMethod, Client};
use infisical::secrets::{GetSecretRequest, ListSecretsRequest};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::env;
use std::sync::RwLock;
use tracing::debug;

// Cache for secrets to avoid repeated API calls
static SECRET_CACHE: Lazy<RwLock<HashMap<String, String>>> = 
    Lazy::new(|| RwLock::new(HashMap::new()));

// Infisical client singleton
static INFISICAL_CLIENT: Lazy<tokio::sync::OnceCell<Client>> = 
    Lazy::new(|| tokio::sync::OnceCell::new());

async fn get_or_init_client() -> Result<&'static Client> {
    INFISICAL_CLIENT.get_or_try_init(|| async {
        init_infisical_client().await
    }).await
}

async fn init_infisical_client() -> Result<Client> {
    // Load dotenv file if it exists
    dotenv::dotenv().ok();

    // Get Infisical configuration from environment
    let client_id = env::var("INFISICAL_CLIENT_ID")
        .context("INFISICAL_CLIENT_ID not set")?;
    let client_secret = env::var("INFISICAL_CLIENT_SECRET")
        .context("INFISICAL_CLIENT_SECRET not set")?;
    let base_url = env::var("INFISICAL_SITE_URL")
        .unwrap_or_else(|_| "https://app.infisical.com".to_string());

    // Build the client
    let mut client = Client::builder()
        .base_url(&base_url)
        .build()
        .await?;

    // Set up authentication and log in
    let auth_method = AuthMethod::new_universal_auth(&client_id, &client_secret);
    client.login(auth_method).await?;

    Ok(client)
}

/// Get a secret value by key
/// First checks environment variables (for local overrides)
/// Then checks cache, then fetches from Infisical if needed
pub async fn get_secret(key: &str) -> Result<String> {
    // First check if the environment variable is set locally
    if let Ok(value) = env::var(key) {
        debug!("Using local environment variable for {}", key);
        return Ok(value);
    }

    // Check cache
    {
        let cache = SECRET_CACHE.read().unwrap();
        if let Some(value) = cache.get(key) {
            debug!("Using cached secret for {}", key);
            return Ok(value.clone());
        }
    }

    // Fetch from Infisical
    let client = get_or_init_client().await?;
    
    let project_id = env::var("INFISICAL_PROJECT_ID")
        .context("INFISICAL_PROJECT_ID not set")?;
    let environment = env::var("INFISICAL_ENVIRONMENT")
        .unwrap_or_else(|_| "dev".to_string());

    // Build the request to get a specific secret
    let request = GetSecretRequest::builder(key, &project_id, &environment)
        .path("/")
        .build();

    match client.secrets().get(request).await {
        Ok(secret) => {
            // Cache the secret
            {
                let mut cache = SECRET_CACHE.write().unwrap();
                cache.insert(key.to_string(), secret.secret_value.clone());
            }
            debug!("Fetched secret {} from Infisical", key);
            Ok(secret.secret_value)
        }
        Err(e) => {
            Err(anyhow::anyhow!(
                "Failed to fetch secret {} from Infisical: {}",
                key, e
            ))
        }
    }
}

/// Get a secret value with a default fallback
pub async fn get_secret_or_default(key: &str, default: &str) -> String {
    get_secret(key).await.unwrap_or_else(|e| {
        debug!("Using default value for {}: {}", key, e);
        default.to_string()
    })
}

/// Batch fetch all secrets from Infisical and optionally attach to process env
pub async fn load_all_secrets(attach_to_env: bool) -> Result<HashMap<String, String>> {
    let client = get_or_init_client().await?;
    
    let project_id = env::var("INFISICAL_PROJECT_ID")
        .context("INFISICAL_PROJECT_ID not set")?;
    let environment = env::var("INFISICAL_ENVIRONMENT")
        .unwrap_or_else(|_| "dev".to_string());

    // List all secrets
    let request = ListSecretsRequest::builder(&project_id, &environment)
        .path("/")
        .recursive(true)
        .attach_to_process_env(attach_to_env)
        .build();

    let secrets_list = client.secrets().list(request).await?;
    
    let mut secrets = HashMap::new();
    
    // Cache all secrets
    {
        let mut cache = SECRET_CACHE.write().unwrap();
        for secret in secrets_list {
            cache.insert(secret.secret_key.clone(), secret.secret_value.clone());
            secrets.insert(secret.secret_key, secret.secret_value);
        }
    }
    
    debug!("Loaded {} secrets from Infisical", secrets.len());
    Ok(secrets)
}

/// Initialize Infisical and load all secrets at startup
/// This can be called at the beginning of main() to load all secrets upfront
pub async fn init_secrets() -> Result<()> {
    // Load all secrets and attach to process env
    load_all_secrets(true).await?;
    Ok(())
}

/// Clear the secret cache (useful for testing or when secrets are rotated)
pub fn clear_cache() {
    let mut cache = SECRET_CACHE.write().unwrap();
    cache.clear();
}

/// Get a secret value synchronously from environment or cache
/// This is primarily for use in lazy_static or other sync contexts
/// It assumes secrets have been loaded via init_secrets() at startup
pub fn get_secret_sync(key: &str) -> Result<String> {
    // First check if the environment variable is set locally
    if let Ok(value) = env::var(key) {
        return Ok(value);
    }

    // Check cache
    {
        let cache = SECRET_CACHE.read().unwrap();
        if let Some(value) = cache.get(key) {
            return Ok(value.clone());
        }
    }

    // If not found in env or cache, return error
    Err(anyhow::anyhow!(
        "Secret {} not found. Make sure init_secrets() was called at startup or the environment variable is set.",
        key
    ))
}

/// Get a secret value synchronously with a default fallback
pub fn get_secret_sync_or_default(key: &str, default: &str) -> String {
    get_secret_sync(key).unwrap_or_else(|_| default.to_string())
}

/// Helper struct for common database configuration
pub struct DatabaseConfig {
    pub url: String,
    pub pool_size: u32,
}

impl DatabaseConfig {
    pub async fn from_secrets() -> Result<Self> {
        Ok(Self {
            url: get_secret("DATABASE_URL").await?,
            pool_size: get_secret_or_default("DATABASE_POOL_SIZE", "30").await
                .parse()
                .unwrap_or(30),
        })
    }
}

/// Helper struct for Redis configuration
pub struct RedisConfig {
    pub url: String,
}

impl RedisConfig {
    pub async fn from_secrets() -> Result<Self> {
        Ok(Self {
            url: get_secret_or_default("REDIS_URL", "redis://localhost:6379").await,
        })
    }
}

/// Helper struct for JWT configuration
pub struct JwtConfig {
    pub secret: String,
}

impl JwtConfig {
    pub async fn from_secrets() -> Result<Self> {
        Ok(Self {
            secret: get_secret("JWT_SECRET").await?,
        })
    }
}

/// Helper struct for Supabase configuration
pub struct SupabaseConfig {
    pub url: String,
    pub service_role_key: String,
}

impl SupabaseConfig {
    pub async fn from_secrets() -> Result<Self> {
        Ok(Self {
            url: get_secret("SUPABASE_URL").await?,
            service_role_key: get_secret("SUPABASE_SERVICE_ROLE_KEY").await?,
        })
    }
}

/// Helper struct for LLM configuration
pub struct LlmConfig {
    pub api_key: Option<String>,
    pub base_url: Option<String>,
}

impl LlmConfig {
    pub async fn from_secrets() -> Result<Self> {
        Ok(Self {
            api_key: get_secret("LLM_API_KEY").await.ok(),
            base_url: get_secret("LLM_BASE_URL").await.ok(),
        })
    }
}

/// Helper struct for email configuration
pub struct EmailConfig {
    pub resend_api_key: String,
    pub buster_url: String,
}

impl EmailConfig {
    pub async fn from_secrets() -> Result<Self> {
        Ok(Self {
            resend_api_key: get_secret("RESEND_API_KEY").await?,
            buster_url: get_secret("BUSTER_URL").await?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_secret_from_env() {
        env::set_var("TEST_SECRET", "test_value");
        let result = get_secret("TEST_SECRET").await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test_value");
        env::remove_var("TEST_SECRET");
    }

    #[tokio::test]
    async fn test_get_secret_or_default() {
        let result = get_secret_or_default("NON_EXISTENT_SECRET", "default_value").await;
        assert_eq!(result, "default_value");
    }
}