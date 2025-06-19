use anyhow::Result;
use async_trait::async_trait;
use agents::AgentMessage;
use middleware::AuthenticatedUser;
use std::sync::Arc;
use agents::Agent;
use database::enums::AssetType;
use uuid::Uuid;

pub mod chat_context;
pub mod metric_context;
pub mod dashboard_context;
pub mod generic_asset_context;

pub use chat_context::ChatContextLoader;
pub use metric_context::MetricContextLoader;
pub use dashboard_context::DashboardContextLoader;
pub use generic_asset_context::{GenericAssetContextLoader, fetch_asset_details};

#[async_trait]
pub trait ContextLoader: Send + Sync {
    async fn load_context(&self, user: &AuthenticatedUser, agent: &Arc<Agent>) -> Result<Vec<AgentMessage>>;
}

// Factory function for creating context loaders
pub fn create_asset_context_loader(
    asset_id: Uuid,
    asset_type: AssetType,
) -> Box<dyn ContextLoader> {
    match asset_type {
        AssetType::MetricFile => Box::new(MetricContextLoader::new(asset_id)),
        AssetType::DashboardFile => Box::new(DashboardContextLoader::new(asset_id)),
        // Support for future asset types
        _ => Box::new(GenericAssetContextLoader::new(asset_id, asset_type)),
    }
}

// Updated validation to handle both legacy and new asset references
pub fn validate_context_request(
    chat_id: Option<uuid::Uuid>,
    asset_id: Option<uuid::Uuid>,
    asset_type: Option<AssetType>,
    metric_id: Option<uuid::Uuid>,
    dashboard_id: Option<uuid::Uuid>,
) -> Result<()> {
    // Check if asset_id is provided without asset_type
    if asset_id.is_some() && asset_type.is_none() {
        return Err(anyhow::anyhow!("asset_type must be provided with asset_id"));
    }

    // Count context sources (generic and legacy)
    let context_count = [
        chat_id.is_some(),
        asset_id.is_some(),
        metric_id.is_some(),
        dashboard_id.is_some(),
    ]
    .iter()
    .filter(|&&b| b)
    .count();

    if context_count > 1 {
        return Err(anyhow::anyhow!(
            "Only one context type (chat, asset, metric, or dashboard) can be provided"
        ));
    }

    Ok(())
} 