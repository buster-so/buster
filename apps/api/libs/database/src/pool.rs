use anyhow::{anyhow, Result};
use bb8_redis::{bb8, RedisConnectionManager};
use diesel::{ConnectionError, ConnectionResult};
use diesel_async::pooled_connection::bb8::Pool as DieselPool;
use diesel_async::pooled_connection::ManagerConfig;
use diesel_async::{pooled_connection::AsyncDieselConnectionManager, AsyncPgConnection};
use futures::future::BoxFuture;
use futures::FutureExt;
use once_cell::sync::OnceCell;
use secrets::{get_secret, get_secret_or_default, DatabaseConfig, RedisConfig};
use sqlx::postgres::{PgPool as SqlxPool, PgPoolOptions};
use std::env;
use std::sync::Arc;
use std::time::Duration;

pub type PgPool = DieselPool<AsyncPgConnection>;
pub type PgPoolSqlx = SqlxPool;
pub type RedisPool = bb8::Pool<RedisConnectionManager>;

static DIESEL_POOL: OnceCell<PgPool> = OnceCell::new();
static SQLX_POOL: OnceCell<SqlxPool> = OnceCell::new();
static REDIS_POOL: OnceCell<RedisPool> = OnceCell::new();

pub async fn init_pools() -> Result<()> {
    let diesel_pool = match establish_diesel_connection().await {
        Ok(pool) => {
            // Warm up Diesel pool by acquiring min_idle connections
            for _ in 0..5 {
                let _ = pool.get().await;
            }
            pool
        },
        Err(e) => return Err(anyhow!("Failed to establish diesel connection: {}", e)),
    };

    let sqlx_pool = match establish_sqlx_connection().await {
        Ok(pool) => {
            // Warm up SQLx pool by acquiring min_connections connections
            for _ in 0..5 {
                let _ = pool.acquire().await;
            }
            pool
        },
        Err(e) => return Err(anyhow!("Failed to establish sqlx connection: {}", e)),
    };

    let redis_pool = match create_redis_pool().await {
        Ok(pool) => pool,
        Err(e) => return Err(anyhow!("Failed to create redis pool: {}", e)),
    };

    DIESEL_POOL
        .set(diesel_pool)
        .map_err(|_| anyhow!("DieselPool already initialized"))?;
    SQLX_POOL
        .set(sqlx_pool)
        .map_err(|_| anyhow!("SqlxPool already initialized"))?;
    REDIS_POOL
        .set(redis_pool)
        .map_err(|_| anyhow!("RedisPool already initialized"))?;

    Ok(())
}

pub fn get_pg_pool() -> &'static PgPool {
    DIESEL_POOL.get().expect("DieselPool not initialized")
}

pub fn get_sqlx_pool() -> &'static SqlxPool {
    SQLX_POOL.get().expect("SqlxPool not initialized")
}

pub fn get_redis_pool() -> &'static RedisPool {
    REDIS_POOL.get().expect("RedisPool not initialized")
}

pub async fn establish_diesel_connection() -> Result<PgPool> {
    let db_config = match DatabaseConfig::from_secrets().await {
        Ok(config) => config,
        Err(_) => DatabaseConfig {
            url: "postgresql://postgres:postgres@127.0.0.1:54322/postgres".to_string(),
            pool_size: 30,
        }
    };
    
    let db_url = db_config.url;
    let max_pool_size = db_config.pool_size as usize;

    let ssl_mode = extract_ssl_mode(&db_url);
    
    let (manager, needs_custom_setup) = match ssl_mode {
        Some("require") => {
            let clean_url = remove_ssl_params(&db_url);
            let mut config = ManagerConfig::default();
            config.custom_setup = Box::new(establish_ssl_connection_no_verify);
            (
                AsyncDieselConnectionManager::<AsyncPgConnection>::new_with_config(clean_url, config),
                true
            )
        },
        Some("verify-ca") | Some("verify-full") => {
            let clean_url = remove_ssl_params(&db_url);
            let mut config = ManagerConfig::default();
            config.custom_setup = Box::new(establish_secure_connection);
            (
                AsyncDieselConnectionManager::<AsyncPgConnection>::new_with_config(clean_url, config),
                true
            )
        },
        _ => {
            (
                AsyncDieselConnectionManager::<AsyncPgConnection>::new(db_url),
                false
            )
        }
    };

    PgPool::builder()
        .max_size(max_pool_size as u32)
        .min_idle(Some(5))
        .max_lifetime(Some(Duration::from_secs(60 * 60 * 24)))
        .idle_timeout(Some(Duration::from_secs(60 * 2)))
        .test_on_check_out(true)
        .build(manager)
        .await
        .map_err(|e| {
            tracing::error!("Failed to establish diesel connection: {}", e);
            anyhow!("Failed to establish diesel connection: {}", e)
        })
}

pub async fn establish_sqlx_connection() -> Result<SqlxPool> {
    let db_url = get_secret("POOLER_URL").await
        .unwrap_or_else(|_| "postgresql://postgres:postgres@127.0.0.1:54322/postgres".to_string());
    let max_pool_size: u32 = get_secret_or_default("SQLX_POOL_SIZE", "30").await
        .parse()
        .expect("SQLX_POOL_SIZE must be a valid u32");

    // SQLx natively supports sslmode in the connection string
    // No special handling needed - it will respect sslmode=require, sslmode=prefer, etc.
    PgPoolOptions::new()
        .max_connections(max_pool_size)
        .min_connections(5)
        .max_lifetime(Duration::from_secs(60 * 60 * 24))
        .idle_timeout(Duration::from_secs(60 * 2))
        .test_before_acquire(true)
        .connect(&db_url)
        .await
        .map_err(|e| anyhow!("Failed to establish sqlx connection: {}", e))
}

fn establish_secure_connection(config: &str) -> BoxFuture<ConnectionResult<AsyncPgConnection>> {
    let fut = async {
        let rustls_config = rustls::ClientConfig::builder()
            .with_root_certificates(root_certs())
            .with_no_client_auth();
        let tls = tokio_postgres_rustls::MakeRustlsConnect::new(rustls_config);
        let (client, conn) = tokio_postgres::connect(config, tls)
            .await
            .map_err(|e| ConnectionError::BadConnection(e.to_string()))?;

        AsyncPgConnection::try_from_client_and_connection(client, conn).await
    };
    fut.boxed()
}

fn root_certs() -> rustls::RootCertStore {
    let mut roots = rustls::RootCertStore::empty();
    let certs = rustls_native_certs::load_native_certs().expect("Certs not loadable!");
    roots.add_parsable_certificates(certs);
    roots
}

fn establish_ssl_connection_no_verify(config: &str) -> BoxFuture<ConnectionResult<AsyncPgConnection>> {
    let fut = async {
        // Create a custom TLS config that accepts any certificate
        let mut rustls_config = rustls::ClientConfig::builder()
            .dangerous()
            .with_custom_certificate_verifier(Arc::new(NoVerifier))
            .with_no_client_auth();
        
        let tls = tokio_postgres_rustls::MakeRustlsConnect::new(rustls_config);
        let (client, conn) = tokio_postgres::connect(config, tls)
            .await
            .map_err(|e| ConnectionError::BadConnection(e.to_string()))?;

        AsyncPgConnection::try_from_client_and_connection(client, conn).await
    };
    fut.boxed()
}

fn extract_ssl_mode(url: &str) -> Option<&str> {
    url.split('?')
        .nth(1)?
        .split('&')
        .find_map(|param| {
            let mut parts = param.split('=');
            match (parts.next(), parts.next()) {
                (Some("sslmode"), Some(mode)) => Some(mode),
                _ => None,
            }
        })
}

fn remove_ssl_params(url: &str) -> String {
    if let Some((base, params)) = url.split_once('?') {
        let filtered_params: Vec<&str> = params
            .split('&')
            .filter(|param| !param.starts_with("sslmode="))
            .collect();
        
        if filtered_params.is_empty() {
            base.to_string()
        } else {
            format!("{base}?{}", filtered_params.join("&"))
        }
    } else {
        url.to_string()
    }
}

#[derive(Debug)]
struct NoVerifier;

impl rustls::client::danger::ServerCertVerifier for NoVerifier {
    fn verify_server_cert(
        &self,
        _end_entity: &rustls::pki_types::CertificateDer<'_>,
        _intermediates: &[rustls::pki_types::CertificateDer<'_>],
        _server_name: &rustls::pki_types::ServerName<'_>,
        _ocsp_response: &[u8],
        _now: rustls::pki_types::UnixTime,
    ) -> Result<rustls::client::danger::ServerCertVerified, rustls::Error> {
        Ok(rustls::client::danger::ServerCertVerified::assertion())
    }

    fn verify_tls12_signature(
        &self,
        _message: &[u8],
        _cert: &rustls::pki_types::CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> Result<rustls::client::danger::HandshakeSignatureValid, rustls::Error> {
        Ok(rustls::client::danger::HandshakeSignatureValid::assertion())
    }

    fn verify_tls13_signature(
        &self,
        _message: &[u8],
        _cert: &rustls::pki_types::CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> Result<rustls::client::danger::HandshakeSignatureValid, rustls::Error> {
        Ok(rustls::client::danger::HandshakeSignatureValid::assertion())
    }

    fn supported_verify_schemes(&self) -> Vec<rustls::SignatureScheme> {
        vec![
            rustls::SignatureScheme::RSA_PKCS1_SHA256,
            rustls::SignatureScheme::RSA_PKCS1_SHA384,
            rustls::SignatureScheme::RSA_PKCS1_SHA512,
            rustls::SignatureScheme::ECDSA_NISTP256_SHA256,
            rustls::SignatureScheme::ECDSA_NISTP384_SHA384,
            rustls::SignatureScheme::RSA_PSS_SHA256,
            rustls::SignatureScheme::RSA_PSS_SHA384,
            rustls::SignatureScheme::RSA_PSS_SHA512,
            rustls::SignatureScheme::ED25519,
        ]
    }
}

pub async fn create_redis_pool() -> Result<RedisPool> {
    let redis_config = match RedisConfig::from_secrets().await {
        Ok(config) => config,
        Err(_) => RedisConfig {
            url: "redis://localhost:6379".to_string(),
        }
    };
    let redis_url = redis_config.url;

    let manager = match RedisConnectionManager::new(redis_url) {
        Ok(manager) => manager,
        Err(e) => {
            tracing::error!("Failed to create redis pool: {}", e);
            return Err(anyhow!("Failed to create redis pool: {}", e));
        }
    };

    let pool = match bb8::Pool::builder().max_size(10000).build(manager).await {
        Ok(pool) => pool,
        Err(e) => {
            tracing::error!("Failed to create redis pool: {}", e);
            return Err(anyhow!("Failed to create redis pool: {}", e));
        }
    };

    Ok(pool)
}

/// This function is used for testing purposes only.
/// It initializes test pools before the main application pools.
/// This must be called before any other database operations.
#[cfg(test)]
pub async fn init_test_pools() -> Result<()> {
    // Only initialize if pools haven't been set yet
    if DIESEL_POOL.get().is_none() && SQLX_POOL.get().is_none() && REDIS_POOL.get().is_none() {
        // Use test-specific database URLs 
        std::env::set_var("DATABASE_URL", get_secret("TEST_DATABASE_URL").await
            .unwrap_or_else(|_| "postgresql://postgres:postgres@127.0.0.1:54322/postgres".to_string()));
            
        // Initialize the pools normally
        init_pools().await
    } else {
        // Already initialized
        Ok(())
    }
}
