use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use database::enums::AssetType;
use handlers::collections::{remove_assets_from_collection_handler, AssetToRemove};
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct AssetRequest {
    pub id: Uuid,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Debug, Deserialize)]
pub struct RemoveAssetsRequest {
    pub assets: Vec<AssetRequest>,
}

#[derive(Debug, Serialize)]
pub struct FailedAsset {
    pub id: Uuid,
    #[serde(rename = "type")]
    pub type_: String,
    pub error: String,
}

#[derive(Debug, Serialize)]
pub struct RemoveAssetsResponse {
    pub message: String,
    pub removed_count: u32,
    pub failed_count: u32,
    pub failed_assets: Vec<FailedAsset>,
}

/// REST handler for removing multiple assets from a collection
///
/// # Arguments
///
/// * `user` - The authenticated user
/// * `id` - The unique identifier of the collection
/// * `request` - The assets to remove from the collection
///
/// # Returns
///
/// A JSON response with the result of the operation
pub async fn remove_assets_from_collection(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<RemoveAssetsRequest>,
) -> Result<ApiResponse<RemoveAssetsResponse>, (StatusCode, String)> {
    info!(
        collection_id = %id,
        user_id = %user.id,
        asset_count = request.assets.len(),
        "Processing DELETE request to remove assets from collection"
    );

    // Convert request assets to handler assets
    let assets: Vec<AssetToRemove> = request.assets.into_iter().filter_map(|asset| {
        match asset.type_.to_lowercase().as_str() {
            "dashboard" => Some(AssetToRemove::Dashboard(asset.id)),
            "metric" => Some(AssetToRemove::Metric(asset.id)),
            "report" => Some(AssetToRemove::Report(asset.id)),
            _ => None,
        }
    }).collect();

    match remove_assets_from_collection_handler(&id, assets, &user).await {
        Ok(result) => {
            let failed_assets = result.failed_assets.into_iter().map(|(id, asset_type, error)| {
                let type_str = match asset_type {
                    AssetType::DashboardFile => "dashboard",
                    AssetType::MetricFile => "metric",
                    AssetType::ReportFile => "report",
                    _ => "unknown",
                };
                
                FailedAsset {
                    id,
                    type_: type_str.to_string(),
                    error,
                }
            }).collect();
            
            Ok(ApiResponse::JsonData(RemoveAssetsResponse {
                message: "Assets processed".to_string(),
                removed_count: result.removed_count,
                failed_count: result.failed_count,
                failed_assets,
            }))
        },
        Err(e) => {
            tracing::error!("Error removing assets from collection: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            if error_message.contains("Collection not found") {
                return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to remove assets from collection: {}", e)))
        }
    }
}