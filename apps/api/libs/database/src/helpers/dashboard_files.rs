use crate::enums::{AssetPermissionRole, AssetType};
use anyhow::Result;
use diesel::JoinOnDsl;
use diesel::{BoolExpressionMethods, ExpressionMethods, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use tokio::try_join;
use uuid::Uuid;

use crate::models::{AssetPermission, DashboardFile};
use crate::pool::get_pg_pool;
use crate::schema::{asset_permissions, collections_to_assets, dashboard_files};

/// Fetches a single dashboard file by ID that hasn't been deleted
///
/// # Arguments
/// * `id` - The UUID of the dashboard file to fetch
///
/// # Returns
/// * `Result<Option<DashboardFile>>` - The dashboard file if found and not deleted
pub async fn fetch_dashboard_file(id: &Uuid) -> Result<Option<DashboardFile>> {
    let mut conn = get_pg_pool().get().await?;

    let mut result = match dashboard_files::table
        .filter(dashboard_files::id.eq(id))
        .filter(dashboard_files::deleted_at.is_null())
        .first::<DashboardFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    // Ensure all rows have IDs (for backwards compatibility)
    if let Some(ref mut dashboard_file) = result {
        for (index, row) in dashboard_file.content.rows.iter_mut().enumerate() {
            if row.id == 0 {
                row.id = (index as u32) + 1;
            }
        }
    }

    Ok(result)
}

/// Helper function to fetch a dashboard file by ID
async fn fetch_dashboard(id: &Uuid) -> Result<Option<DashboardFile>> {
    let mut conn = get_pg_pool().get().await?;

    let mut result = match dashboard_files::table
        .filter(dashboard_files::id.eq(id))
        .filter(dashboard_files::deleted_at.is_null())
        .first::<DashboardFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    // Ensure all rows have IDs (for backwards compatibility)
    if let Some(ref mut dashboard_file) = result {
        for (index, row) in dashboard_file.content.rows.iter_mut().enumerate() {
            if row.id == 0 {
                row.id = (index as u32) + 1;
            }
        }
    }

    Ok(result)
}

/// Helper function to check if a dashboard file is publicly accessible
async fn is_publicly_accessible(dashboard_file: &DashboardFile) -> bool {
    // Check if the file is publicly accessible and either has no expiry date
    // or the expiry date has not passed
    dashboard_file.publicly_accessible
        && dashboard_file
            .public_expiry_date
            .map_or(true, |expiry| expiry > chrono::Utc::now())
}

/// Helper function to fetch permission for a dashboard file
async fn fetch_dashboard_permission(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    let permission = match asset_permissions::table
        .filter(asset_permissions::asset_id.eq(id))
        .filter(asset_permissions::asset_type.eq(AssetType::DashboardFile))
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

/// Helper function to fetch collection-based permissions for a dashboard file
///
/// Checks if the user has access to the dashboard file through collections
/// by finding collections that contain this dashboard file and checking
/// if the user has permissions on those collections
async fn fetch_collection_permissions_for_dashboard(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    // Find collections containing this dashboard file
    // then join with asset_permissions to find user's permissions on those collections
    let permissions = asset_permissions::table
        .inner_join(
            collections_to_assets::table.on(asset_permissions::asset_id
                .eq(collections_to_assets::collection_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(collections_to_assets::asset_id.eq(id))
                .and(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                .and(collections_to_assets::deleted_at.is_null())),
        )
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select(asset_permissions::role)
        .load::<AssetPermissionRole>(&mut conn)
        .await?;

    // Return any collection-based permission
    if permissions.is_empty() {
        Ok(None)
    } else {
        // Just take the first one since any collection permission is sufficient
        Ok(permissions.into_iter().next())
    }
}

#[derive(Queryable)]
pub struct DashboardFileWithPermission {
    pub dashboard_file: DashboardFile,
    pub permission: Option<AssetPermissionRole>,
}

pub async fn fetch_dashboard_file_with_permission(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<DashboardFileWithPermission>> {
    // Run all queries concurrently
    let (dashboard_file, direct_permission, collection_permission) = try_join!(
        fetch_dashboard(id),
        fetch_dashboard_permission(id, user_id),
        fetch_collection_permissions_for_dashboard(id, user_id)
    )?;

    // If the dashboard file doesn't exist, return None
    let dashboard_file = match dashboard_file {
        Some(file) => file,
        None => return Ok(None),
    };

    // Check if the file is publicly accessible (we don't grant permission here anymore)
    // let is_public = is_publicly_accessible(&dashboard_file).await;

    // If collection permission exists, use it; otherwise use direct permission
    let effective_permission = match collection_permission {
        Some(collection) => Some(collection),
        None => direct_permission,
    };

    // REMOVED: Logic that automatically granted CanView for public access.
    // The handler is now responsible for checking public access rules.
    /*
    if is_public {
        if effective_permission.is_none() {
            effective_permission = Some(AssetPermissionRole::CanView);
        }
    }
    */

    Ok(Some(DashboardFileWithPermission {
        dashboard_file,
        permission: effective_permission, // Now only reflects direct or collection permission
    }))
}

/// Fetches multiple dashboard files with their permissions in a single operation
///
/// # Arguments
/// * `ids` - Vector of UUIDs of the dashboard files to fetch
/// * `user_id` - UUID of the user making the request
///
/// # Returns
/// * `Result<Vec<DashboardFileWithPermission>>` - The dashboard files with their permissions
pub async fn fetch_dashboard_files_with_permissions(
    ids: &[Uuid],
    user_id: &Uuid,
) -> Result<Vec<DashboardFileWithPermission>> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }

    let mut conn = get_pg_pool().get().await?;

    // 1. Fetch all dashboard files
    let mut dashboard_files = dashboard_files::table
        .filter(dashboard_files::id.eq_any(ids))
        .filter(dashboard_files::deleted_at.is_null())
        .load::<DashboardFile>(&mut conn)
        .await?;

    if dashboard_files.is_empty() {
        return Ok(Vec::new());
    }

    // Ensure all rows have IDs (for backwards compatibility)
    for dashboard_file in &mut dashboard_files {
        for (index, row) in dashboard_file.content.rows.iter_mut().enumerate() {
            if row.id == 0 {
                row.id = (index as u32) + 1;
            }
        }
    }

    // 2. Fetch direct permissions for these dashboard files
    let direct_permissions = asset_permissions::table
        .filter(asset_permissions::asset_id.eq_any(ids))
        .filter(asset_permissions::asset_type.eq(AssetType::DashboardFile))
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select((asset_permissions::asset_id, asset_permissions::role))
        .load::<(Uuid, AssetPermissionRole)>(&mut conn)
        .await?;

    // 3. Fetch collection-based permissions for these dashboard files
    let collection_permissions = asset_permissions::table
        .inner_join(
            collections_to_assets::table.on(asset_permissions::asset_id
                .eq(collections_to_assets::collection_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(collections_to_assets::asset_id.eq_any(ids))
                .and(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                .and(collections_to_assets::deleted_at.is_null())),
        )
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select((collections_to_assets::asset_id, asset_permissions::role))
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

    // Get current time once
    let now = chrono::Utc::now();

    // Create DashboardFileWithPermission objects with effective permissions
    let result = dashboard_files
        .into_iter()
        .map(|dashboard_file| {
            let direct_permission = direct_permission_map.get(&dashboard_file.id).cloned();
            let collection_permission = collection_permission_map.get(&dashboard_file.id).cloned();

            // Determine effective permission (prioritizing collection over direct)
            let mut effective_permission = match collection_permission {
                Some(collection) => Some(collection),
                None => direct_permission,
            };

            // Check if the file is publicly accessible and its expiry date hasn't passed
            // We still need this check for other potential uses, but don't grant permission based on it here.
            let is_public = dashboard_file.publicly_accessible
                && dashboard_file
                    .public_expiry_date
                    .map_or(true, |expiry| expiry > now);

            // REMOVED: Logic that automatically granted CanView for public access.
            /*
            if is_public && (effective_permission.is_none()) {
                effective_permission = Some(AssetPermissionRole::CanView);
            }
            */

            DashboardFileWithPermission {
                dashboard_file,
                permission: effective_permission, // Now only reflects direct or collection permission
            }
        })
        .collect();

    Ok(result)
}
