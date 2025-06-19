use crate::enums::{AssetPermissionRole, AssetType};
use anyhow::Result;
use diesel::JoinOnDsl;
use diesel::{BoolExpressionMethods, ExpressionMethods, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use tokio::try_join;
use uuid::Uuid;

use crate::models::{AssetPermission, Chat};
use crate::pool::get_pg_pool;
use crate::schema::{asset_permissions, chats, collections_to_assets};

/// Fetches a single chat by ID that hasn't been deleted
///
/// # Arguments
/// * `id` - The UUID of the chat to fetch
///
/// # Returns
/// * `Result<Option<Chat>>` - The chat if found and not deleted
pub async fn fetch_chat(id: &Uuid) -> Result<Option<Chat>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match chats::table
        .filter(chats::id.eq(id))
        .filter(chats::deleted_at.is_null())
        .first::<Chat>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to fetch a chat by ID
async fn fetch_chat_helper(id: &Uuid) -> Result<Option<Chat>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match chats::table
        .filter(chats::id.eq(id))
        .filter(chats::deleted_at.is_null())
        .first::<Chat>(&mut conn)
        .await
    {
        Ok(result) => Some(result),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}

/// Helper function to fetch permission for a chat
async fn fetch_chat_permission(id: &Uuid, user_id: &Uuid) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    let permission = match asset_permissions::table
        .filter(asset_permissions::asset_id.eq(id))
        .filter(asset_permissions::asset_type.eq(AssetType::Chat))
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

/// Helper function to fetch collection-based permissions for a chat
///
/// Checks if the user has access to the chat through collections
/// by finding collections that contain this chat and checking
/// if the user has permissions on those collections
async fn fetch_collection_permissions_for_chat(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<AssetPermissionRole>> {
    let mut conn = get_pg_pool().get().await?;

    // Find collections containing this chat
    // then join with asset_permissions to find user's permissions on those collections
    let permissions = asset_permissions::table
        .inner_join(
            collections_to_assets::table.on(asset_permissions::asset_id
                .eq(collections_to_assets::collection_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(collections_to_assets::asset_id.eq(id))
                .and(collections_to_assets::asset_type.eq(AssetType::Chat))
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
pub struct ChatWithPermission {
    pub chat: Chat,
    pub permission: Option<AssetPermissionRole>,
}

pub async fn fetch_chat_with_permission(
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<ChatWithPermission>> {
    // Run all queries concurrently
    let (chat, direct_permission, collection_permission) = try_join!(
        fetch_chat_helper(id),
        fetch_chat_permission(id, user_id),
        fetch_collection_permissions_for_chat(id, user_id)
    )?;

    // If the chat doesn't exist, return None
    let chat = match chat {
        Some(c) => c,
        None => return Ok(None),
    };

    // If collection permission exists, use it; otherwise use direct permission
    let effective_permission = match collection_permission {
        Some(collection) => Some(collection),
        None => direct_permission,
    };

    Ok(Some(ChatWithPermission {
        chat,
        permission: effective_permission,
    }))
}

/// Fetches multiple chats with their permissions in a single operation
///
/// # Arguments
/// * `ids` - Vector of UUIDs of the chats to fetch
/// * `user_id` - UUID of the user making the request
///
/// # Returns
/// * `Result<Vec<ChatWithPermission>>` - The chats with their permissions
pub async fn fetch_chats_with_permissions(
    ids: &[Uuid],
    user_id: &Uuid,
) -> Result<Vec<ChatWithPermission>> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }

    let mut conn = get_pg_pool().get().await?;

    // 1. Fetch all chats
    let chats_data = chats::table
        .filter(chats::id.eq_any(ids))
        .filter(chats::deleted_at.is_null())
        .load::<Chat>(&mut conn)
        .await?;

    if chats_data.is_empty() {
        return Ok(Vec::new());
    }

    // 2. Fetch direct permissions for these chats
    let direct_permissions = asset_permissions::table
        .filter(asset_permissions::asset_id.eq_any(ids))
        .filter(asset_permissions::asset_type.eq(AssetType::Chat))
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::deleted_at.is_null())
        .select((asset_permissions::asset_id, asset_permissions::role))
        .load::<(Uuid, AssetPermissionRole)>(&mut conn)
        .await?;

    // 3. Fetch collection-based permissions for these chats
    let collection_permissions = asset_permissions::table
        .inner_join(
            collections_to_assets::table.on(asset_permissions::asset_id
                .eq(collections_to_assets::collection_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(collections_to_assets::asset_id.eq_any(ids))
                .and(collections_to_assets::asset_type.eq(AssetType::Chat))
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

    // Create ChatWithPermission objects with effective permissions
    let result = chats_data
        .into_iter()
        .map(|chat| {
            let direct_permission = direct_permission_map.get(&chat.id).cloned();
            let collection_permission = collection_permission_map.get(&chat.id).cloned();

            // Use collection permission if it exists, otherwise use direct permission
            let effective_permission = match collection_permission {
                Some(collection) => Some(collection),
                None => direct_permission,
            };

            ChatWithPermission {
                chat,
                permission: effective_permission,
            }
        })
        .collect();

    Ok(result)
}
