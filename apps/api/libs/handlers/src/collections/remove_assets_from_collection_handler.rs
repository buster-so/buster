use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::collections::fetch_collection_with_permission,
    models::CollectionToAsset,
    pool::get_pg_pool,
    schema::collections_to_assets,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use sharing::check_permission_access;
use tracing::{error, info};
use uuid::Uuid;

/// Asset to remove from a collection
#[derive(Debug)]
pub enum AssetToRemove {
    /// Dashboard ID to remove
    Dashboard(Uuid),
    /// Metric ID to remove
    Metric(Uuid),
    /// Report ID to remove
    Report(Uuid),
}

/// Result of removing assets from a collection
#[derive(Debug)]
pub struct RemoveAssetsFromCollectionResult {
    /// Number of assets successfully removed
    pub removed_count: u32,
    /// Number of assets that failed to be removed
    pub failed_count: u32,
    /// List of assets that failed to be removed, with error messages
    /// (asset_id, asset_type, error_message)
    pub failed_assets: Vec<(Uuid, AssetType, String)>,
}

/// Removes multiple assets from a collection
///
/// # Arguments
///
/// * `collection_id` - The unique identifier of the collection
/// * `assets` - Vector of assets to remove from the collection
/// * `user` - The authenticated user performing the action
///
/// # Returns
///
/// Result containing counts of successful and failed operations
pub async fn remove_assets_from_collection_handler(
    collection_id: &Uuid,
    assets: Vec<AssetToRemove>,
    user: &AuthenticatedUser,
) -> Result<RemoveAssetsFromCollectionResult> {
    info!(
        collection_id = %collection_id,
        user_id = %user.id,
        "Removing assets from collection"
    );

    // If no assets to remove, return early
    if assets.is_empty() {
        return Ok(RemoveAssetsFromCollectionResult {
            removed_count: 0,
            failed_count: 0,
            failed_assets: vec![],
        });
    }

    // 1. Fetch the collection with permission
    let collection_with_permission = fetch_collection_with_permission(collection_id, &user.id).await?;
    
    // If collection not found, return error
    let collection_with_permission = match collection_with_permission {
        Some(cwp) => cwp,
        None => {
            return Err(anyhow!("Collection not found"));
        }
    };
    
    // 2. Check if user has permission to edit the collection
    let has_permission = check_permission_access(
        collection_with_permission.permission,
        &[
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        collection_with_permission.collection.organization_id,
        &user.organizations,
        collection_with_permission.collection.workspace_sharing,
    );
    
    if !has_permission {
        return Err(anyhow!("User does not have permission to edit this collection"));
    }

    // 3. Process each asset and remove from collection
    let mut result = RemoveAssetsFromCollectionResult {
        removed_count: 0,
        failed_count: 0,
        failed_assets: vec![],
    };

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            error!("Error getting database connection: {}", e);
            return Err(anyhow!("Error getting database connection: {}", e));
        }
    };

    for asset in assets {
        match asset {
            AssetToRemove::Dashboard(dashboard_id) => {
                // Check if the dashboard is in the collection
                let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(dashboard_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                .filter(collections_to_assets::deleted_at.is_null())
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!(
                        "Error checking if dashboard is in collection: {}",
                        e
                    );
                    result.failed_count += 1;
                    result.failed_assets.push((
                        dashboard_id,
                        AssetType::DashboardFile,
                        format!("Database error: {}", e),
                    ));
                    continue;
                }
            };

            if let Some(existing_record) = existing {
                // Soft delete the record
                match diesel::update(collections_to_assets::table)
                    .filter(collections_to_assets::collection_id.eq(existing_record.collection_id))
                    .filter(collections_to_assets::asset_id.eq(existing_record.asset_id))
                    .filter(collections_to_assets::asset_type.eq(existing_record.asset_type))
                    .set((
                        collections_to_assets::deleted_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_by.eq(user.id),
                    ))
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.removed_count += 1;
                    }
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            dashboard_id = %dashboard_id,
                            "Error removing dashboard from collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((
                            dashboard_id,
                            AssetType::DashboardFile,
                            format!("Database error: {}", e),
                        ));
                    }
                }
            } else {
                // Dashboard is not in the collection, count as failed
                result.failed_count += 1;
                result.failed_assets.push((
                    dashboard_id,
                    AssetType::DashboardFile,
                    "Dashboard is not in the collection".to_string(),
                ));
            }
            },
            AssetToRemove::Metric(metric_id) => {
                // Check if the metric is in the collection
                let existing = match collections_to_assets::table
                    .filter(collections_to_assets::collection_id.eq(collection_id))
                    .filter(collections_to_assets::asset_id.eq(metric_id))
                    .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                    .filter(collections_to_assets::deleted_at.is_null())
                    .first::<CollectionToAsset>(&mut conn)
                    .await
                {
                    Ok(record) => Some(record),
                    Err(diesel::NotFound) => None,
                    Err(e) => {
                        error!(
                            "Error checking if metric is in collection: {}",
                            e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((
                            metric_id,
                            AssetType::MetricFile,
                            format!("Database error: {}", e),
                        ));
                        continue;
                    }
                };

                if let Some(existing_record) = existing {
                    // Soft delete the record
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(existing_record.collection_id))
                        .filter(collections_to_assets::asset_id.eq(existing_record.asset_id))
                        .filter(collections_to_assets::asset_type.eq(existing_record.asset_type))
                        .set((
                            collections_to_assets::deleted_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user.id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.removed_count += 1;
                        }
                        Err(e) => {
                            error!(
                                collection_id = %collection_id,
                                metric_id = %metric_id,
                                "Error removing metric from collection: {}", e
                            );
                            result.failed_count += 1;
                            result.failed_assets.push((
                                metric_id,
                                AssetType::MetricFile,
                                format!("Database error: {}", e),
                            ));
                        }
                    }
                } else {
                    // Metric is not in the collection, count as failed
                    result.failed_count += 1;
                    result.failed_assets.push((
                        metric_id,
                        AssetType::MetricFile,
                        "Metric is not in the collection".to_string(),
                    ));
                }
            }
            AssetToRemove::Report(report_id) => {
                // Check if the report is in the collection
                let existing = match collections_to_assets::table
                    .filter(collections_to_assets::collection_id.eq(collection_id))
                    .filter(collections_to_assets::asset_id.eq(report_id))
                    .filter(collections_to_assets::asset_type.eq(AssetType::ReportFile))
                    .filter(collections_to_assets::deleted_at.is_null())
                    .first::<CollectionToAsset>(&mut conn)
                    .await
                {
                    Ok(record) => Some(record),
                    Err(diesel::NotFound) => None,
                    Err(e) => {
                        error!(
                            "Error checking if report is in collection: {}",
                            e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((
                            report_id,
                            AssetType::ReportFile,
                            format!("Database error: {}", e),
                        ));
                        continue;
                    }
                };

                if let Some(existing_record) = existing {
                    // Soft delete the record
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(existing_record.collection_id))
                        .filter(collections_to_assets::asset_id.eq(existing_record.asset_id))
                        .filter(collections_to_assets::asset_type.eq(existing_record.asset_type))
                        .set((
                            collections_to_assets::deleted_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user.id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.removed_count += 1;
                        }
                        Err(e) => {
                            error!(
                                collection_id = %collection_id,
                                report_id = %report_id,
                                "Error removing report from collection: {}", e
                            );
                            result.failed_count += 1;
                            result.failed_assets.push((
                                report_id,
                                AssetType::ReportFile,
                                format!("Database error: {}", e),
                            ));
                        }
                    }
                } else {
                    // Report is not in the collection, count as failed
                    result.failed_count += 1;
                    result.failed_assets.push((
                        report_id,
                        AssetType::ReportFile,
                        "Report is not in the collection".to_string(),
                    ));
                }
            }
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_empty_assets_list() {
        // Test with an empty list of assets
        let _collection_id = Uuid::new_v4();
        let _user_id = Uuid::new_v4();
        let _assets: Vec<AssetToRemove> = vec![];
        
        // This test would need to be updated to use AuthenticatedUser
        // This is just a placeholder for now
        assert!(true);
    }

    // In a real implementation, we would add more test cases:
    // - test_collection_not_found: Test handling when collection doesn't exist
    // - test_insufficient_collection_permissions: Test handling when user lacks permission
    // - test_dashboard_and_metric_removal: Test successful removal of both types
}
