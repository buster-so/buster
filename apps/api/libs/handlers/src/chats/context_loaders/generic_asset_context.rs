use agents::{Agent, AgentMessage};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use database::{
    enums::AssetType,
    models::{DashboardFile, MetricFile},
    pool::get_pg_pool,
    schema::{dashboard_files, metric_files},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use std::sync::Arc;
use uuid::Uuid;

use super::{ContextLoader, DashboardContextLoader, MetricContextLoader};

/// A generic context loader that can handle any supported asset type
///
/// This context loader acts as a unified interface for loading context from any
/// supported asset type. It delegates to specialized loaders based on the
/// asset type provided.
pub struct GenericAssetContextLoader {
    pub asset_id: Uuid,
    pub asset_type: AssetType,
}

impl GenericAssetContextLoader {
    /// Create a new generic asset context loader
    ///
    /// # Arguments
    /// * `asset_id` - The ID of the asset to load
    /// * `asset_type` - The type of the asset (e.g., MetricFile, DashboardFile)
    pub fn new(asset_id: Uuid, asset_type: AssetType) -> Self {
        Self {
            asset_id,
            asset_type,
        }
    }
}

#[async_trait]
impl ContextLoader for GenericAssetContextLoader {
    async fn load_context(
        &self,
        user: &AuthenticatedUser,
        agent: &Arc<Agent>,
    ) -> Result<Vec<AgentMessage>> {
        // Delegate to appropriate specialized loader based on asset type
        match self.asset_type {
            AssetType::MetricFile => {
                let metric_loader = MetricContextLoader::new(self.asset_id);
                metric_loader.load_context(user, agent).await
            }
            AssetType::DashboardFile => {
                let dashboard_loader = DashboardContextLoader::new(self.asset_id);
                dashboard_loader.load_context(user, agent).await
            }
            // Other asset types - can implement specialized handling for other types later
            _ => Err(anyhow!(
                "Unsupported asset type for context loading: {:?}",
                self.asset_type
            )),
        }
    }
}

/// Fetch asset details based on asset type
///
/// This function retrieves basic information about an asset from the database
/// based on its ID and type. It's used for generating messages and displaying
/// asset information in chats.
///
/// # Arguments
/// * `asset_id` - The ID of the asset to fetch
/// * `asset_type` - The type of the asset (e.g., MetricFile, DashboardFile)
///
/// # Returns
/// * `AssetDetails` structure containing the asset's ID, name, and file type
pub async fn fetch_asset_details(asset_id: Uuid, asset_type: AssetType) -> Result<AssetDetails> {
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        anyhow!(
            "Failed to get database connection for fetching asset details: {}",
            e
        )
    })?;

    match asset_type {
        AssetType::MetricFile => {
            let metric = metric_files::table
                .filter(metric_files::id.eq(asset_id))
                .first::<MetricFile>(&mut conn)
                .await
                .map_err(|e| anyhow!("Failed to load metric (id: {}): {}", asset_id, e))?;

            Ok(AssetDetails {
                id: metric.id,
                name: metric.name,
                file_type: "metric".to_string(),
                version_number: metric.version_history.get_version_number(),
            })
        }
        AssetType::DashboardFile => {
            let dashboard = dashboard_files::table
                .filter(dashboard_files::id.eq(asset_id))
                .first::<DashboardFile>(&mut conn)
                .await
                .map_err(|e| anyhow!("Failed to load dashboard (id: {}): {}", asset_id, e))?;

            Ok(AssetDetails {
                id: dashboard.id,
                name: dashboard.name,
                file_type: "dashboard".to_string(),
                version_number: dashboard.version_history.get_version_number(),
            })
        }
        // Add other asset types here as needed
        _ => Err(anyhow!(
            "Unsupported asset type for fetching details: {:?}",
            asset_type
        )),
    }
}

/// Asset details structure returned by fetch_asset_details
///
/// Contains the basic information about an asset that can be used for
/// message generation and display.
#[derive(Debug, Clone)]
pub struct AssetDetails {
    /// The unique identifier of the asset
    pub id: Uuid,
    /// The name or title of the asset
    pub name: String,
    /// The file type of the asset (e.g., "metric", "dashboard")
    pub file_type: String,
    /// The version number of the asset
    pub version_number: i32,
}
