mod routes;
pub mod utils;

use std::sync::Arc;
use std::time::Duration;

use axum::{extract::Request, Extension, Router};
use database::{self, pool::init_pools};
use diesel::{Connection, PgConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use dotenv::dotenv;
use middleware::{
    cors::cors,
    error::{init_sentry, init_tracing_subscriber, sentry_layer},
};
use rustls::crypto::ring;
use secrets::{init_secrets, get_secret_or_default};
use stored_values::jobs::trigger_stale_sync_jobs;
use tokio::sync::broadcast;
use tokio_cron_scheduler::{Job, JobScheduler};
use tower::ServiceBuilder;
use tower_http::{compression::CompressionLayer, trace::TraceLayer};
use tracing::{error, info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

#[tokio::main]
#[allow(unused)]
async fn main() -> Result<(), anyhow::Error> {
    println!("Starting API server initialization...");
    
    dotenv().ok();
    println!("Environment variables loaded from .env file");

    // Initialize Infisical and load all secrets
    println!("Attempting to connect to Infisical...");
    match init_secrets().await {
        Ok(_) => {
            // Don't log here yet - tracing subscriber isn't initialized
            println!("Successfully loaded secrets from Infisical");
        }
        Err(e) => {
            eprintln!("Failed to initialize Infisical secrets: {}", e);
            eprintln!("Make sure INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, and INFISICAL_PROJECT_ID are set in .env");
            return Err(anyhow::anyhow!("Failed to initialize secrets"));
        }
    }
    
    // Verify critical secrets are available after init
    if secrets::get_secret_sync("JWT_SECRET").is_err() {
        eprintln!("JWT_SECRET is not available after init_secrets(). Check your Infisical configuration.");
        return Err(anyhow::anyhow!("JWT_SECRET not available"));
    }

    let environment = get_secret_or_default("ENVIRONMENT", "development").await;
    let is_development = environment == "development";
    println!("Environment: {}", environment);

    ring::default_provider()
        .install_default()
        .expect("Failed to install default crypto provider");
    println!("Crypto provider initialized");

    // Initialize Sentry using our middleware helper
    let _guard = init_sentry(
        "https://a417fbed1de30d2714a8afbe38d5bc1b@o4505360096428032.ingest.us.sentry.io/4507360721043456"
    );
    println!("Sentry initialized");

    // Set up the tracing subscriber with conditional Sentry integration
    let log_level = get_secret_or_default("LOG_LEVEL", "warn").await.to_uppercase();
    println!("Log level set to: {}", log_level);

    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(log_level));

    // Re-initialize the tracing subscriber with Sentry integration using our middleware helper
    init_tracing_subscriber(env_filter);
    println!("Tracing subscriber initialized");

    info!("Successfully initialized with secrets from Infisical");

    info!("Initializing database connection pools...");
    if let Err(e) = init_pools().await {
        tracing::error!("Failed to initialize database pools: {}", e);
        eprintln!("CRITICAL: Database connection failed - {}", e);
        eprintln!("Check DATABASE_URL and database availability");
        return Ok(());
    }
    info!("Database pools initialized successfully");

    // --- Start Stored Values Sync Job Scheduler ---
    let scheduler = JobScheduler::new().await?; // Using `?` assuming main returns Result
    info!("Starting stored values sync job scheduler...");

    // Schedule to run every hour
    let job = Job::new_async("0 0 * * * *", move |uuid, mut l| {
        Box::pin(async move {
            info!(job_uuid = %uuid, "Running hourly stored values sync job check.");
            if let Err(e) = trigger_stale_sync_jobs().await {
                error!(job_uuid = %uuid, "Hourly stored values sync job failed: {}", e);
            }
            // Optional: You could check l.next_tick_for_job(uuid).await to see the next scheduled time.
        })
    })?;

    scheduler.add(job).await?;
    scheduler.start().await?;
    info!("Stored values sync job scheduler started.");
    // --- End Stored Values Sync Job Scheduler ---

    info!("Building API routes...");
    let protected_router = Router::new().nest("/api/v1", routes::protected_router());
    let public_router = Router::new().route("/health", axum::routing::get(|| async { 
        info!("Health check endpoint hit");
        "OK" 
    }));
    info!("Routes configured");

    let (shutdown_tx, _) = broadcast::channel::<()>(1);
    let shutdown_tx = Arc::new(shutdown_tx);

    // Base router configuration
    info!("Configuring middleware layers...");
    let app = Router::new()
        .merge(protected_router)
        .merge(public_router)
        .layer(TraceLayer::new_for_http())
        .layer(cors())
        .layer(CompressionLayer::new())
        .layer(Extension(shutdown_tx.clone()));
    info!("Middleware configured");

    // Add Sentry layers if not in development using our middleware helper
    let app = if !is_development {
        app.layer(sentry_layer())
    } else {
        app
    };

    let port_number: u16 = std::env::var("SERVER_PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse()
        .expect("Invalid SERVER_PORT value");

    info!("Attempting to bind to port {}...", port_number);
    let listener = match tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port_number)).await {
        Ok(listener) => {
            info!("Successfully bound to port {}", port_number);
            listener
        },
        Err(e) => {
            tracing::error!("Failed to bind to port {}: {}", port_number, e);
            eprintln!("CRITICAL: Cannot bind to port {} - {}", port_number, e);
            eprintln!("Check if another process is using this port: lsof -i :{}", port_number);
            return Ok(());
        }
    };

    info!("🚀 Server is running on http://0.0.0.0:{}", port_number);
    info!("Health check available at: http://0.0.0.0:{}/health", port_number);
    
    let server = axum::serve(listener, app);

    info!("Server ready to accept connections");
    
    tokio::select! {
        res = server => {
            if let Err(e) = res {
                error!("Axum server error: {}", e);
                eprintln!("CRITICAL: Server crashed with error: {}", e);
            } else {
                info!("Server shut down normally");
            }
         },
        _ = tokio::signal::ctrl_c() => {
            info!("Shutdown signal received, starting graceful shutdown");
            shutdown_tx.send(()).unwrap_or_default();
        }
    }

    info!("Server shutdown complete");
    Ok(())
}
