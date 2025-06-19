use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission, Collection},
    pool::get_pg_pool,
    schema::{asset_permissions, collections},
};
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use tokio;
use uuid::Uuid;

use crate::collections::types::{CollectionState, CreateCollectionRequest};

/// Handler for creating a new collection
///
/// # Arguments
/// * `user` - The authenticated user creating the collection
/// * `req` - The request containing the collection details
///
/// # Returns
/// * `Result<CollectionState>` - The created collection state
pub async fn create_collection_handler(
    user: &AuthenticatedUser,
    req: CreateCollectionRequest,
) -> Result<CollectionState> {
    let collection_id = Uuid::new_v4();

    // Ensure user has an active organization
    let organization_id = match user.organizations.get(0) {
        Some(org_id) => org_id.id,
        None => return Err(anyhow!("User does not have an active organization")),
    };

    // Create collection object
    let collection = Collection {
        id: collection_id,
        name: req.name,
        description: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        created_by: user.id,
        updated_by: user.id,
        deleted_at: None,
        organization_id,
    };

    let insert_task_user_id = user.id;
    let insert_task_collection = collection.clone();

    // Insert collection and permissions
    let collection_insert = tokio::spawn(async move {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Error getting pg connection: {}", e);
                return Err(anyhow!("Error getting pg connection: {}", e));
            }
        };

        let asset_permissions = AssetPermission {
            identity_id: insert_task_user_id,
            identity_type: IdentityType::User,
            asset_id: insert_task_collection.id,
            asset_type: AssetType::Collection,
            role: AssetPermissionRole::Owner,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            created_by: insert_task_user_id,
            updated_by: insert_task_user_id,
        };

        match insert_into(collections::table)
            .values(&insert_task_collection)
            .execute(&mut conn)
            .await
        {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error inserting collection: {}", e);
                return Err(anyhow!("Error inserting collection: {}", e));
            }
        };

        match insert_into(asset_permissions::table)
            .values(asset_permissions)
            .execute(&mut conn)
            .await
        {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error inserting asset permissions: {}", e);
                return Err(anyhow!("Error inserting asset permissions: {}", e));
            }
        }

        Ok(())
    });

    // Update search index
    let collection_id_for_search = collection_id;
    let collection_name = collection.name.clone();
    let organization_id_for_search = organization_id;

    let collection_search_handle = tokio::spawn(async move {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Unable to get connection from pool: {:?}", e);
                return Err(anyhow!("Unable to get connection from pool: {:?}", e));
            }
        };

        let query = diesel::sql_query(
            "insert into public.asset_search (asset_id, asset_type, content, organization_id)
            VALUES ($1, 'collection', $2, $3)
            ON CONFLICT (asset_id, asset_type) 
            DO UPDATE SET
                content = EXCLUDED.content,
                updated_at = NOW()",
        )
        .bind::<diesel::sql_types::Uuid, _>(collection_id_for_search)
        .bind::<diesel::sql_types::Text, _>(collection_name)
        .bind::<diesel::sql_types::Uuid, _>(organization_id_for_search);

        match query.execute(&mut conn).await {
            Ok(_) => Ok(()),
            Err(e) => {
                tracing::error!("Failed to update asset search: {:?}", e);
                Err(anyhow!("Failed to update asset search: {:?}", e))
            }
        }
    });

    // Wait for both tasks to complete
    if let Err(e) = collection_insert.await? {
        return Err(anyhow!("Error in collection insert: {:?}", e));
    }

    if let Err(e) = collection_search_handle.await? {
        return Err(anyhow!("Error in collection search insert: {:?}", e));
    }

    // Return the collection state
    Ok(CollectionState {
        collection,
        assets: None,
        permission: AssetPermissionRole::Owner,
        organization_permissions: false,
        individual_permissions: None,
        publicly_accessible: false,
        public_expiry_date: None,
        public_enabled_by: None,
        public_password: None,
    })
}
