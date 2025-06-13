mod routes;
pub mod utils;

use std::env;
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
    dotenv().ok();

    let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
    let is_development = environment == "development";

    ring::default_provider()
        .install_default()
        .expect("Failed to install default crypto provider");

    // Initialize Sentry using our middleware helper
    let _guard = init_sentry(
        "https://a417fbed1de30d2714a8afbe38d5bc1b@o4505360096428032.ingest.us.sentry.io/4507360721043456"
    );

    // Set up the tracing subscriber with conditional Sentry integration
    let log_level = env::var("LOG_LEVEL")
        .unwrap_or_else(|_| "warn".to_string())
        .to_uppercase();

    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(log_level));

    // Initialize the tracing subscriber with Sentry integration using our middleware helper
    init_tracing_subscriber(env_filter);

    if let Err(e) = init_pools().await {
        tracing::error!("Failed to initialize database pools: {}", e);
        return Ok(());
    }

    // --- Start Stored Values Sync Job Scheduler ---
    let scheduler = JobScheduler::new().await?; // Using `?` assuming main returns Result
    info!("Starting stored values sync job scheduler...");

    // Schedule to run every hour
    let job = Job::new_async("*/5 * * * * *", move |uuid, mut l| {
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

    let protected_router = Router::new().nest("/api/v1", routes::protected_router());
    let public_router = Router::new().route("/health", axum::routing::get(|| async { "OK" }));

    let (shutdown_tx, _) = broadcast::channel::<()>(1);
    let shutdown_tx = Arc::new(shutdown_tx);

    // Base router configuration
    let app = Router::new()
        .merge(protected_router)
        .merge(public_router)
        .layer(TraceLayer::new_for_http())
        .layer(cors())
        .layer(CompressionLayer::new())
        .layer(Extension(shutdown_tx.clone()));

    // Add Sentry layers if not in development using our middleware helper
    let app = if !is_development {
        app.layer(sentry_layer())
    } else {
        app
    };

    let port_number: u16 = env::var("PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse()
        .unwrap();

    let listener = match tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port_number)).await {
        Ok(listener) => listener,
        Err(e) => {
            tracing::error!("Failed to bind to port {}: {}", port_number, e);
            return Ok(());
        }
    };

    let server = axum::serve(listener, app);

    tokio::select! {
        res = server => {
            if let Err(e) = res {
                error!("Axum server error: {}", e);
            }
         },
        _ = tokio::signal::ctrl_c() => {
            info!("Shutdown signal received, starting graceful shutdown");
            shutdown_tx.send(()).unwrap_or_default();
        }
    }

    Ok(())
}
