use anyhow::Result;
use diesel::{BoolExpressionMethods, ExpressionMethods, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use diesel::{JoinOnDsl, NullableExpressionMethods};
use uuid::Uuid;
use tokio::try_join;
use crate::enums::{AssetPermissionRole, AssetType};

use crate::models::{Collection, AssetPermission};
use crate::pool::get_pg_pool;
use crate::schema::{collections, asset_permissions};

/// Fetches a single collection by ID that hasn't been deleted
///
/// # Arguments
/// * `id` - The UUID of the collection to fetch
///
/// # Returns
/// * `Result<Option<Collection>>` - The collection if found and not deleted
pub async fn fetch_collection(id: &Uuid) -> Result<Option<Collection>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match collections::table
        .filter(collections::id.eq(id))
        .filter(collections::deleted_at.is_null())
        .first::<Collection>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to fetch a collection by ID
async fn fetch_collection_helper(id: &Uuid) -> Result<Option<Collection>> {
    let mut conn = get_pg_pool().get().await?;
    
    let result = match collections::table
        .filter(collections::id.eq(id))
        .filter(collections::deleted_at.is_null())
        .first::<Collection>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };
    
    Ok(result)
}

/// Helper function to fetch permission for a collection
async fn fetch_collection_permission(id: &Uuid, user_id: &Uuid) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;
    
    let permission = match asset_permissions::table
        .filter(asset_permissions::asset_id.eq(id))
        .filter(asset_permissions::asset_type.eq(AssetType::Collection))
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

#[derive(Queryable)]
pub struct CollectionWithPermission {
    pub collection: Collection,
    pub permission: Option<AssetPermissionRole>,
}

pub async fn fetch_collection_with_permission(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<CollectionWithPermission>> {
    // Run both queries concurrently
    let (collection, permission) = try_join!(
        fetch_collection_helper(id),
        fetch_collection_permission(id, user_id)
    )?;

    // If the collection doesn't exist, return None
    let collection = match collection {
        Some(c) => c,
        None => return Ok(None),
    };

    Ok(Some(CollectionWithPermission {
        collection,
        permission,
    }))
}

/// Fetches multiple collections with their permissions in a single operation
///
/// # Arguments
/// * `ids` - Vector of UUIDs of the collections to fetch
/// * `user_id` - UUID of the user making the request
///
/// # Returns
/// * `Result<Vec<CollectionWithPermission>>` - The collections with their permissions
pub async fn fetch_collections_with_permissions(
    ids: &[Uuid],
    user_id: &Uuid,
) -> Result<Vec<CollectionWithPermission>> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }

    let mut conn = get_pg_pool().get().await?;

    // Use a LEFT JOIN to fetch collections and their permissions in a single query
    let results = collections::table
        .left_join(
            asset_permissions::table.on(asset_permissions::asset_id
                .eq(collections::id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(asset_permissions::identity_id.eq(user_id))
                .and(asset_permissions::deleted_at.is_null()))
        )
        .filter(collections::id.eq_any(ids))
        .filter(collections::deleted_at.is_null())
        .select((collections::all_columns, asset_permissions::role.nullable()))
        .load::<(Collection, Option<AssetPermissionRole>)>(&mut conn)
        .await?;

    if results.is_empty() {
        return Ok(Vec::new());
    }

    // Create CollectionWithPermission objects
    let result = results
        .into_iter()
        .map(|(collection, permission)| CollectionWithPermission {
            collection,
            permission,
        })
        .collect();

    Ok(result)
}