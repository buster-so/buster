use anyhow::{anyhow, Result};
use database::{
    dashboard_files::fetch_dashboard_file_with_permission,
    enums::{AssetPermissionRole, AssetType},
    helpers::collections::fetch_collection_with_permission,
    metric_files::fetch_metric_file_with_permissions,
    report_files::fetch_report_file_with_permission,
    chats::fetch_chat_with_permission,
    models::CollectionToAsset,
    pool::get_pg_pool,
    schema::{collections_to_assets, chats},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use sharing::check_permission_access;
use tracing::{error, info};
use uuid::Uuid;

/// Asset to add to a collection
#[derive(Debug, Clone)]
pub struct AssetToAdd {
    /// The unique identifier of the asset
    pub id: Uuid,
    /// The type of the asset
    pub asset_type: AssetType,
}

/// Result of adding assets to a collection
#[derive(Debug)]
pub struct AddAssetsToCollectionResult {
    /// Number of assets successfully added
    pub added_count: usize,
    /// Number of assets that failed to be added
    pub failed_count: usize,
    /// List of assets that failed to be added with error messages
    pub failed_assets: Vec<(Uuid, AssetType, String)>,
}

/// Adds multiple assets to a collection
///
/// # Arguments
///
/// * `collection_id` - The unique identifier of the collection
/// * `assets` - Vector of assets to add to the collection
/// * `user` - The authenticated user performing the action
///
/// # Returns
///
/// Result containing counts of successful and failed operations
pub async fn add_assets_to_collection_handler(
    collection_id: &Uuid,
    assets: Vec<AssetToAdd>,
    user: &AuthenticatedUser,
) -> Result<AddAssetsToCollectionResult> {
    info!(
        collection_id = %collection_id,
        user_id = %user.id,
        asset_count = assets.len(),
        "Adding assets to collection"
    );

    if assets.is_empty() {
        return Ok(AddAssetsToCollectionResult {
            added_count: 0,
            failed_count: 0,
            failed_assets: vec![],
        });
    }

    // 1. Fetch the collection with permission
    let collection_with_permission =
        fetch_collection_with_permission(collection_id, &user.id).await?;

    // If collection not found, return error
    let collection_with_permission = match collection_with_permission {
        Some(cwp) => cwp,
        None => {
            error!(
                collection_id = %collection_id,
                "Collection not found"
            );
            return Err(anyhow!("Collection not found"));
        }
    };

    // 2. Check if user has permission to modify the collection (Owner, FullAccess, or CanEdit)
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
        error!(
            collection_id = %collection_id,
            user_id = %user.id,
            "User does not have permission to modify this collection"
        );
        return Err(anyhow!(
            "User does not have permission to modify this collection"
        ));
    }

    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

    // 3. Group assets by type for efficient processing
    let mut dashboard_ids = Vec::new();
    let mut metric_ids = Vec::new();
    let mut chat_ids = Vec::new();
    let mut report_ids = Vec::new();

    for asset in &assets {
        match asset.asset_type {
            AssetType::DashboardFile => dashboard_ids.push(asset.id),
            AssetType::MetricFile => metric_ids.push(asset.id),
            AssetType::Chat => chat_ids.push(asset.id),
            AssetType::ReportFile => report_ids.push(asset.id),
            _ => {
                error!(
                    asset_id = %asset.id,
                    asset_type = ?asset.asset_type,
                    "Unsupported asset type"
                );
                // We'll handle this in the results
            }
        }
    }

    // 4. Process each asset type
    let mut result = AddAssetsToCollectionResult {
        added_count: 0,
        failed_count: 0,
        failed_assets: vec![],
    };

    // Process dashboards
    if !dashboard_ids.is_empty() {
        for dashboard_id in &dashboard_ids {
            // Check if dashboard exists
            let dashboard = fetch_dashboard_file_with_permission(&dashboard_id, &user.id).await?;

            let dashboard = if let Some(dashboard) = dashboard {
                dashboard
            } else {
                error!(
                    dashboard_id = %dashboard_id,
                    user_id = %user.id,
                    "Dashboard not found"
                );
                result.failed_count += 1;
                result.failed_assets.push((
                    *dashboard_id,
                    AssetType::DashboardFile,
                    "Dashboard not found".to_string(),
                ));
                continue;
            };

            // Check if user has access to the dashboard
            let has_dashboard_permission = check_permission_access(
                dashboard.permission,
                &[
                    AssetPermissionRole::CanView,
                    AssetPermissionRole::CanEdit,
                    AssetPermissionRole::FullAccess,
                    AssetPermissionRole::Owner,
                ],
                dashboard.dashboard_file.organization_id,
                &user.organizations,
                dashboard.dashboard_file.workspace_sharing,
            );

            if !has_dashboard_permission {
                error!(
                    dashboard_id = %dashboard_id,
                    user_id = %user.id,
                    "User does not have permission to access this dashboard"
                );
                result.failed_count += 1;
                result.failed_assets.push((
                    *dashboard_id,
                    AssetType::DashboardFile,
                    "Insufficient permissions".to_string(),
                ));
                continue;
            }

            // Check if the dashboard is already in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(dashboard_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!(
                        "Error checking if dashboard is already in collection: {}",
                        e
                    );
                    result.failed_count += 1;
                    result.failed_assets.push((
                        *dashboard_id,
                        AssetType::DashboardFile,
                        format!("Database error: {}", e),
                    ));
                    continue;
                }
            };

            if let Some(existing_record) = existing {
                if existing_record.deleted_at.is_some() {
                    // If it was previously deleted, update it
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(collection_id))
                        .filter(collections_to_assets::asset_id.eq(dashboard_id))
                        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                        .set((
                            collections_to_assets::deleted_at
                                .eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user.id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.added_count += 1;
                        }
                        Err(e) => {
                            error!(
                                collection_id = %collection_id,
                                dashboard_id = %dashboard_id,
                                "Error updating dashboard in collection: {}", e
                            );
                            result.failed_count += 1;
                            result.failed_assets.push((
                                *dashboard_id,
                                AssetType::DashboardFile,
                                format!("Database error: {}", e),
                            ));
                        }
                    }
                } else {
                    // Already in the collection
                    info!(
                        collection_id = %collection_id,
                        dashboard_id = %dashboard_id,
                        "Dashboard already in collection"
                    );
                    result.added_count += 1;
                }
            } else {
                // Add to collection
                let new_record = CollectionToAsset {
                    collection_id: *collection_id,
                    asset_id: *dashboard_id,
                    asset_type: AssetType::DashboardFile,
                    created_at: chrono::Utc::now(),
                    created_by: user.id,
                    updated_at: chrono::Utc::now(),
                    updated_by: user.id,
                    deleted_at: None,
                };

                match diesel::insert_into(collections_to_assets::table)
                    .values(&new_record)
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.added_count += 1;
                    }
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            dashboard_id = %dashboard_id,
                            "Error adding dashboard to collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((
                            *dashboard_id,
                            AssetType::DashboardFile,
                            format!("Database error: {}", e),
                        ));
                    }
                }
            }
        }
    }

    // Process metrics
    if !metric_ids.is_empty() {
        for metric_id in &metric_ids {
            // Check if metric exists
            let metric = fetch_metric_file_with_permissions(&metric_id, &user.id).await?;

            let metric = if let Some(metric) = metric {
                metric
            } else {
                error!(
                    metric_id = %metric_id,
                    user_id = %user.id,
                    "Metric not found"
                );
                result.failed_count += 1;
                result.failed_assets.push((
                    *metric_id,
                    AssetType::MetricFile,
                    "Metric not found".to_string(),
                ));
                continue;
            };

            // Check if user has access to the metric
            let has_metric_permission = check_permission_access(
                metric.permission,
                &[
                    AssetPermissionRole::CanView,
                    AssetPermissionRole::CanEdit,
                    AssetPermissionRole::FullAccess,
                    AssetPermissionRole::Owner,
                ],
                metric.metric_file.organization_id,
                &user.organizations,
                metric.metric_file.workspace_sharing,
            );

            if !has_metric_permission {
                error!(
                    metric_id = %metric_id,
                    user_id = %user.id,
                    "User does not have permission to access this metric"
                );
                result.failed_count += 1;
                result.failed_assets.push((
                    *metric_id,
                    AssetType::MetricFile,
                    "Insufficient permissions".to_string(),
                ));
                continue;
            }

            // Check if the metric is already in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(metric_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!("Error checking if metric is already in collection: {}", e);
                    result.failed_count += 1;
                    result.failed_assets.push((
                        *metric_id,
                        AssetType::MetricFile,
                        format!("Database error: {}", e),
                    ));
                    continue;
                }
            };

            if let Some(existing_record) = existing {
                if existing_record.deleted_at.is_some() {
                    // If it was previously deleted, update it
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(collection_id))
                        .filter(collections_to_assets::asset_id.eq(metric_id))
                        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                        .set((
                            collections_to_assets::deleted_at
                                .eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user.id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.added_count += 1;
                        }
                        Err(e) => {
                            error!(
                                collection_id = %collection_id,
                                metric_id = %metric_id,
                                "Error updating metric in collection: {}", e
                            );
                            result.failed_count += 1;
                            result.failed_assets.push((
                                *metric_id,
                                AssetType::MetricFile,
                                format!("Database error: {}", e),
                            ));
                        }
                    }
                } else {
                    // Already in the collection
                    info!(
                        collection_id = %collection_id,
                        metric_id = %metric_id,
                        "Metric already in collection"
                    );
                    result.added_count += 1;
                }
            } else {
                // Add to collection
                let new_record = CollectionToAsset {
                    collection_id: *collection_id,
                    asset_id: *metric_id,
                    asset_type: AssetType::MetricFile,
                    created_at: chrono::Utc::now(),
                    created_by: user.id,
                    updated_at: chrono::Utc::now(),
                    updated_by: user.id,
                    deleted_at: None,
                };

                match diesel::insert_into(collections_to_assets::table)
                    .values(&new_record)
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.added_count += 1;
                    }
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            metric_id = %metric_id,
                            "Error adding metric to collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((
                            *metric_id,
                            AssetType::MetricFile,
                            format!("Database error: {}", e),
                        ));
                    }
                }
            }
        }
    }

    // Process chats
    if !chat_ids.is_empty() {
        for chat_id in &chat_ids {
            // Check if chat exists and user has permission
            let chat_permission = fetch_chat_with_permission(&chat_id, &user.id).await?;

            let chat_permission = if let Some(cp) = chat_permission {
                cp
            } else {
                error!(chat_id = %chat_id, user_id = %user.id, "Chat not found");
                result.failed_count += 1;
                result.failed_assets.push(( *chat_id, AssetType::Chat, "Chat not found".to_string()));
                continue;
            };

            // Check if user has at least CanView access to the chat
            let has_chat_permission = check_permission_access(
                chat_permission.permission,
                &[
                    AssetPermissionRole::CanView,
                    AssetPermissionRole::CanEdit,
                    AssetPermissionRole::FullAccess,
                    AssetPermissionRole::Owner,
                ],
                chat_permission.chat.organization_id,
                &user.organizations,
                chat_permission.chat.workspace_sharing,
            );

            if !has_chat_permission {
                error!(chat_id = %chat_id, user_id = %user.id, "User does not have permission to access this chat");
                result.failed_count += 1;
                result.failed_assets.push(( *chat_id, AssetType::Chat, "Insufficient permissions".to_string()));
                continue;
            }

            // Check if the chat is already in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(chat_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::Chat))
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!("Error checking if chat is already in collection: {}", e);
                    result.failed_count += 1;
                    result.failed_assets.push(( *chat_id, AssetType::Chat, format!("Database error: {}", e)));
                    continue;
                }
            };

            if let Some(existing_record) = existing {
                if existing_record.deleted_at.is_some() {
                    // If it was previously deleted, update it
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(collection_id))
                        .filter(collections_to_assets::asset_id.eq(chat_id))
                        .filter(collections_to_assets::asset_type.eq(AssetType::Chat))
                        .set((
                            collections_to_assets::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user.id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.added_count += 1;
                        }
                        Err(e) => {
                            error!(collection_id = %collection_id, chat_id = %chat_id, "Error updating chat in collection: {}", e);
                            result.failed_count += 1;
                            result.failed_assets.push(( *chat_id, AssetType::Chat, format!("Database error: {}", e)));
                        }
                    }
                } else {
                    // Already in the collection
                    info!(collection_id = %collection_id, chat_id = %chat_id, "Chat already in collection");
                    result.added_count += 1;
                }
            } else {
                // Add to collection
                let new_record = CollectionToAsset {
                    collection_id: *collection_id,
                    asset_id: *chat_id,
                    asset_type: AssetType::Chat,
                    created_at: chrono::Utc::now(),
                    created_by: user.id,
                    updated_at: chrono::Utc::now(),
                    updated_by: user.id,
                    deleted_at: None,
                };

                match diesel::insert_into(collections_to_assets::table)
                    .values(&new_record)
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.added_count += 1;
                    }
                    Err(e) => {
                        error!(collection_id = %collection_id, chat_id = %chat_id, "Error adding chat to collection: {}", e);
                        result.failed_count += 1;
                        result.failed_assets.push(( *chat_id, AssetType::Chat, format!("Database error: {}", e)));
                    }
                }
            }
        }
    }

    // Process reports
    if !report_ids.is_empty() {
        for report_id in &report_ids {
            // Check if report exists
            let report = fetch_report_file_with_permission(&report_id, &user.id).await?;

            let report = if let Some(report) = report {
                report
            } else {
                error!(
                    report_id = %report_id,
                    user_id = %user.id,
                    "Report not found"
                );
                result.failed_count += 1;
                result.failed_assets.push((
                    *report_id,
                    AssetType::ReportFile,
                    "Report not found".to_string(),
                ));
                continue;
            };

            // Check if user has access to the report
            let has_report_permission = check_permission_access(
                report.permission,
                &[
                    AssetPermissionRole::CanView,
                    AssetPermissionRole::CanEdit,
                    AssetPermissionRole::FullAccess,
                    AssetPermissionRole::Owner,
                ],
                report.report_file.organization_id,
                &user.organizations,
                report.report_file.workspace_sharing,
            );

            if !has_report_permission {
                error!(
                    report_id = %report_id,
                    user_id = %user.id,
                    "User does not have permission to access this report"
                );
                result.failed_count += 1;
                result.failed_assets.push((
                    *report_id,
                    AssetType::ReportFile,
                    "Insufficient permissions".to_string(),
                ));
                continue;
            }

            // Check if the report is already in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(report_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::ReportFile))
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!("Error checking if report is already in collection: {}", e);
                    result.failed_count += 1;
                    result.failed_assets.push((
                        *report_id,
                        AssetType::ReportFile,
                        format!("Database error: {}", e),
                    ));
                    continue;
                }
            };

            if let Some(existing_record) = existing {
                if existing_record.deleted_at.is_some() {
                    // If it was previously deleted, update it
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(collection_id))
                        .filter(collections_to_assets::asset_id.eq(report_id))
                        .filter(collections_to_assets::asset_type.eq(AssetType::ReportFile))
                        .set((
                            collections_to_assets::deleted_at
                                .eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user.id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.added_count += 1;
                        }
                        Err(e) => {
                            error!(
                                collection_id = %collection_id,
                                report_id = %report_id,
                                "Error updating report in collection: {}", e
                            );
                            result.failed_count += 1;
                            result.failed_assets.push((
                                *report_id,
                                AssetType::ReportFile,
                                format!("Database error: {}", e),
                            ));
                        }
                    }
                } else {
                    // Already in the collection
                    info!(
                        collection_id = %collection_id,
                        report_id = %report_id,
                        "Report already in collection"
                    );
                    result.added_count += 1;
                }
            } else {
                // Add to collection
                let new_record = CollectionToAsset {
                    collection_id: *collection_id,
                    asset_id: *report_id,
                    asset_type: AssetType::ReportFile,
                    created_at: chrono::Utc::now(),
                    created_by: user.id,
                    updated_at: chrono::Utc::now(),
                    updated_by: user.id,
                    deleted_at: None,
                };

                match diesel::insert_into(collections_to_assets::table)
                    .values(&new_record)
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.added_count += 1;
                    }
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            report_id = %report_id,
                            "Error adding report to collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((
                            *report_id,
                            AssetType::ReportFile,
                            format!("Database error: {}", e),
                        ));
                    }
                }
            }
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    // Tests would need to be updated to use AuthenticatedUser
    // instead of just a UUID for the user_id
}
