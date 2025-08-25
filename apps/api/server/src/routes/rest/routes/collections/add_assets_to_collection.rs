use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::collections::{add_assets_to_collection_handler, AssetToAdd};
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use tracing::info;
use uuid::Uuid;
use database::enums::AssetType;
use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct AssetRequest {
    pub id: Uuid,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Debug, Deserialize)]
pub struct AddAssetsRequest {
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
pub struct AddAssetsResponse {
    pub message: String,
    pub added_count: usize,
    pub failed_count: usize,
    pub failed_assets: Vec<FailedAsset>,
}

/// REST handler for adding multiple assets to a collection
///
/// # Arguments
///
/// * `user` - The authenticated user
/// * `id` - The unique identifier of the collection
/// * `request` - The assets to add to the collection
///
/// # Returns
///
/// A JSON response with the result of the operation
pub async fn add_assets_to_collection(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<AddAssetsRequest>,
) -> Result<ApiResponse<AddAssetsResponse>, (StatusCode, String)> {
    info!(
        collection_id = %id,
        user_id = %user.id,
        asset_count = request.assets.len(),
        "Processing POST request to add assets to collection"
    );

    // Convert request assets to handler assets
    let assets: Vec<AssetToAdd> = request.assets.into_iter().filter_map(|asset| {
        let asset_type = match asset.type_.to_lowercase().as_str() {
            "dashboard" => Some(AssetType::DashboardFile),
            "metric" => Some(AssetType::MetricFile),
            "report" => Some(AssetType::ReportFile),
            _ => None,
        };
        
        asset_type.map(|t| AssetToAdd {
            id: asset.id,
            asset_type: t,
        })
    }).collect();

    match add_assets_to_collection_handler(&id, assets, &user).await {
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
            
            Ok(ApiResponse::JsonData(AddAssetsResponse {
                message: "Assets processed".to_string(),
                added_count: result.added_count,
                failed_count: result.failed_count,
                failed_assets,
            }))
        },
        Err(e) => {
            tracing::error!("Error adding assets to collection: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            if error_message.contains("Collection not found") {
                return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to add assets to collection: {}", e)))
        }
    }
}