use crate::enums::{AssetPermissionRole, AssetType};
use anyhow::Result;
use diesel::JoinOnDsl;
use diesel::{BoolExpressionMethods, ExpressionMethods, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use tokio::try_join;
use uuid::Uuid;

use crate::models::{AssetPermission, ReportFile};
use crate::pool::get_pg_pool;
use crate::schema::{asset_permissions, collections_to_assets, report_files};

/// Fetches a single report file by ID that hasn't been deleted
///
/// # Arguments
/// * `id` - The UUID of the report file to fetch
///
/// # Returns
/// * `Result<Option<ReportFile>>` - The report file if found and not deleted
pub async fn fetch_report_file(id: &Uuid) -> Result<Option<ReportFile>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match report_files::table
        .filter(report_files::id.eq(id))
        .filter(report_files::deleted_at.is_null())
        .first::<ReportFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to fetch a report file by ID
async fn fetch_report(id: &Uuid) -> Result<Option<ReportFile>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match report_files::table
        .filter(report_files::id.eq(id))
        .filter(report_files::deleted_at.is_null())
        .first::<ReportFile>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to check if a report file is publicly accessible
async fn is_publicly_accessible(report_file: &ReportFile) -> bool {
    // Check if the file is publicly accessible and either has no expiry date
    // or the expiry date has not passed
    report_file.publicly_accessible
        && report_file
            .public_expiry_date
            .map_or(true, |expiry| expiry > chrono::Utc::now())
}

/// Helper function to fetch permission for a report file
async fn fetch_permission(id: &Uuid, user_id: &Uuid) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    let permission = match asset_permissions::table
        .filter(asset_permissions::asset_id.eq(id))
        .filter(asset_permissions::asset_type.eq(AssetType::ReportFile))
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

/// Helper function to fetch collection-based permissions for a report file
///
/// Checks if the user has access to the report file through collections
/// by finding collections that contain this report file and checking
/// if the user has permissions on those collections
async fn fetch_collection_permissions_for_report(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    // Find collections containing this report file
    // then join with asset_permissions to find user's permissions on those collections
    let permissions = asset_permissions::table
        .inner_join(
            collections_to_assets::table.on(asset_permissions::asset_id
                .eq(collections_to_assets::collection_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(collections_to_assets::asset_id.eq(id))
                .and(collections_to_assets::asset_type.eq(AssetType::ReportFile))
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

#[derive(Queryable)]
pub struct ReportFileWithPermission {
    pub report_file: ReportFile,
    pub permission: Option<AssetPermissionRole>,
}

pub async fn fetch_report_file_with_permission(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<ReportFileWithPermission>> {
    // Run all queries concurrently
    let (report_file, direct_permission, collection_permission) = try_join!(
        fetch_report(id),
        fetch_permission(id, user_id),
        fetch_collection_permissions_for_report(id, user_id)
    )?;

    // If the report file doesn't exist, return None
    let report_file = match report_file {
        Some(file) => file,
        None => return Ok(None),
    };

    // Determine effective permission (prioritizing collection over direct)
    let effective_permission = match collection_permission {
        Some(collection) => Some(collection),
        None => direct_permission,
    };

    Ok(Some(ReportFileWithPermission {
        report_file,
        permission: effective_permission,
    }))
}