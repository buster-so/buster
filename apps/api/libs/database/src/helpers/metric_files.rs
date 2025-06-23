use crate::enums::{AssetPermissionRole, AssetType};
use anyhow::Result;
use diesel::JoinOnDsl;
use diesel::{BoolExpressionMethods, ExpressionMethods, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use tokio::try_join;
use uuid::Uuid;

use crate::models::{AssetPermission, MetricFile};
use crate::pool::get_pg_pool;
use crate::schema::{asset_permissions, collections_to_assets, metric_files, metric_files_to_dashboard_files};

/// Fetches a single metric file by ID that hasn't been deleted
///
/// # Arguments
/// * `id` - The UUID of the metric file to fetch
///
/// # Returns
/// * `Result<Option<MetricFile>>` - The metric file if found and not deleted
pub async fn fetch_metric_file(id: &Uuid) -> Result<Option<MetricFile>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match metric_files::table
        .filter(metric_files::id.eq(id))
        .filter(metric_files::deleted_at.is_null())
        .first::<MetricFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to fetch a metric file by ID
async fn fetch_metric(id: &Uuid) -> Result<Option<MetricFile>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match metric_files::table
        .filter(metric_files::id.eq(id))
        .filter(metric_files::deleted_at.is_null())
        .first::<MetricFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to check if a metric file is publicly accessible
async fn is_publicly_accessible(metric_file: &MetricFile) -> bool {
    // Check if the file is publicly accessible and either has no expiry date
    // or the expiry date has not passed
    metric_file.publicly_accessible
        && metric_file
            .public_expiry_date
            .map_or(true, |expiry| expiry > chrono::Utc::now())
}

/// Helper function to fetch permission for a metric file
async fn fetch_permission(id: &Uuid, user_id: &Uuid) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    let permission = match asset_permissions::table
        .filter(asset_permissions::asset_id.eq(id))
        .filter(asset_permissions::asset_type.eq(AssetType::MetricFile))
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .first::<AssetPermission>(&mut conn)
        .await
    {
        Ok(result) => Some(result.role),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(permission)
}

/// Helper function to fetch collection-based permissions for a metric file
///
/// Checks if the user has access to the metric file through collections
/// by finding collections that contain this metric file and checking
/// if the user has permissions on those collections
async fn fetch_collection_permissions_for_metric(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    // Find collections containing this metric file
    // then join with asset_permissions to find user's permissions on those collections
    let permissions = asset_permissions::table
        .inner_join(
            collections_to_assets::table.on(asset_permissions::asset_id
                .eq(collections_to_assets::collection_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(collections_to_assets::asset_id.eq(id))
                .and(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                .and(collections_to_assets::deleted_at.is_null())),
        )
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select(asset_permissions::role)
        .load::<AssetPermissionRole>(&mut conn)
        .await?;

    // Return any collection-based permission (no need to determine highest)
    if permissions.is_empty() {
        Ok(None)
    } else {
        // Just take the first one since any collection permission is sufficient
        Ok(permissions.into_iter().next())
    }
}

/// Helper function to check if a metric file belongs to a dashboard that the user has access to
/// If so, grants CanView access to the metric file
async fn fetch_dashboard_permissions_for_metric(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    // Find dashboards containing this metric file
    // then join with asset_permissions to find user's permissions on those dashboards
    let has_dashboard_access = asset_permissions::table
        .inner_join(
            metric_files_to_dashboard_files::table.on(asset_permissions::asset_id
                .eq(metric_files_to_dashboard_files::dashboard_file_id)
                .and(asset_permissions::asset_type.eq(AssetType::DashboardFile))
                .and(metric_files_to_dashboard_files::metric_file_id.eq(id))
                .and(metric_files_to_dashboard_files::deleted_at.is_null())),
        )
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select(asset_permissions::role)
        .first::<AssetPermissionRole>(&mut conn)
        .await
        .is_ok();

    // If the user has any access to a dashboard containing this metric file,
    // grant CanView access (no inheritance - always just CanView)
    if has_dashboard_access {
        Ok(Some(AssetPermissionRole::CanView))
    } else {
        Ok(None)
    }
}

#[derive(Queryable)]
pub struct MetricFileWithPermission {
    pub metric_file: MetricFile,
    pub permission: Option<AssetPermissionRole>,
}

pub async fn fetch_metric_file_with_permissions(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<MetricFileWithPermission>> {
    // Run all queries concurrently
    let (metric_file, direct_permission, collection_permission, dashboard_permission) = try_join!(
        fetch_metric(id),
        fetch_permission(id, user_id),
        fetch_collection_permissions_for_metric(id, user_id),
        fetch_dashboard_permissions_for_metric(id, user_id)
    )?;

    // If the metric file doesn't exist, return None
    let metric_file = match metric_file {
        Some(file) => file,
        None => return Ok(None),
    };

    // Determine effective permission (prioritizing collection over direct)
    // Dashboard permission is NOT considered here for the base permission level.
    // The handler should check dashboard access separately if direct/collection/public checks fail.
    let mut effective_permission = match collection_permission {
        Some(collection) => Some(collection),
        None => direct_permission,
    };

    // Ensure at least CanView if user has access via any dashboard containing this metric
    if let Some(dashboard_view_permission) = dashboard_permission {
        effective_permission = match effective_permission {
            Some(current_role) => Some(current_role.max(dashboard_view_permission)), // Use max to ensure CanView is minimum
            None => Some(dashboard_view_permission), // Grant CanView if no other permission exists
        };
    }

    Ok(Some(MetricFileWithPermission {
        metric_file,
        permission: effective_permission, // Now reflects Direct/Collection/Dashboard logic
    }))
}

/// Fetches multiple metric files with their permissions in a single operation
///
/// # Arguments
/// * `ids` - Vector of UUIDs of the metric files to fetch
/// * `user_id` - UUID of the user making the request
///
/// # Returns
/// * `Result<Vec<MetricFileWithPermission>>` - The metric files with their permissions
pub async fn fetch_metric_files_with_permissions(
    ids: &[Uuid],
    user_id: &Uuid,
) -> Result<Vec<MetricFileWithPermission>> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }

    let mut conn = get_pg_pool().get().await?;

    // 1. Fetch all metric files
    let metric_files = metric_files::table
        .filter(metric_files::id.eq_any(ids))
        .filter(metric_files::deleted_at.is_null())
        .load::<MetricFile>(&mut conn)
        .await?;

    if metric_files.is_empty() {
        return Ok(Vec::new());
    }

    // 2. Fetch direct permissions for these metric files
    let direct_permissions = asset_permissions::table
        .filter(asset_permissions::asset_id.eq_any(ids))
        .filter(asset_permissions::asset_type.eq(AssetType::MetricFile))
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select((asset_permissions::asset_id, asset_permissions::role))
        .load::<(Uuid, AssetPermissionRole)>(&mut conn)
        .await?;

    // 3. Fetch collection-based permissions for these metric files
    let collection_permissions = asset_permissions::table
        .inner_join(
            collections_to_assets::table.on(asset_permissions::asset_id
                .eq(collections_to_assets::collection_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(collections_to_assets::asset_id.eq_any(ids))
                .and(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                .and(collections_to_assets::deleted_at.is_null())),
        )
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select((collections_to_assets::asset_id, asset_permissions::role))
        .load::<(Uuid, AssetPermissionRole)>(&mut conn)
        .await?;

    // 4. Fetch dashboard-based permissions for these metric files
    let dashboard_permissions = asset_permissions::table
        .inner_join(
            metric_files_to_dashboard_files::table.on(asset_permissions::asset_id
                .eq(metric_files_to_dashboard_files::dashboard_file_id)
                .and(asset_permissions::asset_type.eq(AssetType::DashboardFile))
                .and(metric_files_to_dashboard_files::metric_file_id.eq_any(ids))
                .and(metric_files_to_dashboard_files::deleted_at.is_null())),
        )
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select((metric_files_to_dashboard_files::metric_file_id, asset_permissions::role))
        .load::<(Uuid, AssetPermissionRole)>(&mut conn)
        .await?;

    // Create maps for easier lookup
    let mut direct_permission_map = std::collections::HashMap::new();
    for (asset_id, role) in direct_permissions {
        direct_permission_map.insert(asset_id, role);
    }

    // Create map for collection permissions (just take first one for each asset)
    let mut collection_permission_map = std::collections::HashMap::new();
    for (asset_id, role) in collection_permissions {
        // Only insert if not already present (first one wins)
        collection_permission_map.entry(asset_id).or_insert(role);
    }

    // Create map for dashboard permissions 
    // (just need to track which assets have dashboard access)
    let mut dashboard_permission_map = std::collections::HashMap::new();
    for (asset_id, _) in dashboard_permissions {
        // For dashboard permissions, we always assign CanView access
        dashboard_permission_map.insert(asset_id, AssetPermissionRole::CanView);
    }

    // Get current time once
    let now = chrono::Utc::now();

    // Create MetricFileWithPermission objects with effective permissions
    let result = metric_files
        .into_iter()
        .map(|metric_file| {
            let direct_permission = direct_permission_map.get(&metric_file.id).cloned();
            let collection_permission = collection_permission_map.get(&metric_file.id).cloned();
            let dashboard_permission = dashboard_permission_map.get(&metric_file.id).cloned(); // This is Some(CanView) or None

            // Determine base permission (prioritizing collection over direct)
            let mut effective_permission = match collection_permission {
                Some(collection) => Some(collection),
                None => direct_permission,
            };

            // Ensure at least CanView if user has access via any dashboard containing this metric
            if let Some(dashboard_view_permission) = dashboard_permission {
                effective_permission = match effective_permission {
                    Some(current_role) => Some(current_role.max(dashboard_view_permission)), // Use max to ensure CanView is minimum
                    None => Some(dashboard_view_permission), // Grant CanView if no other permission exists
                };
            }

            // Check if the file is publicly accessible and its expiry date hasn't passed
            // We still need this check for other potential uses, but don't grant permission based on it here.
            let _is_public = metric_file.publicly_accessible
                && metric_file
                    .public_expiry_date
                    .map_or(true, |expiry| expiry > now);

            // REMOVED: Logic that automatically granted CanView for public access.
            /*
            if is_public && (effective_permission.is_none()) {
                effective_permission = Some(AssetPermissionRole::CanView);
            }
            */

            // REMOVED: Previous dashboard logic was here, now handled above.
            /*
            if let Some(dashboard_role) = dashboard_permission {
                effective_permission = match effective_permission {
                    Some(current_role) => Some(current_role.max(dashboard_role)),
                    None => Some(dashboard_role),
                };
            }
            */

            MetricFileWithPermission {
                metric_file,
                permission: effective_permission, // Reflects Direct/Collection/Dashboard logic
            }
        })
        .collect();

    Ok(result)
}
