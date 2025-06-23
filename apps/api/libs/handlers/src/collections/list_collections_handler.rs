use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    schema::{asset_permissions, collections, teams_to_users, users},
};
use diesel::{
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl,
};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use sharing::check_permission_access;
use tracing;
use uuid::Uuid;

use crate::collections::types::{
    ListCollectionsCollection, ListCollectionsRequest, ListCollectionsUser,
};

/// Handler for listing collections with pagination and filtering
///
/// # Arguments
/// * `user` - The authenticated user requesting the collections
/// * `req` - The request containing pagination and filtering options
///
/// # Returns
/// * `Result<Vec<ListCollectionsCollection>>` - A list of collections the user has access to
pub async fn list_collections_handler(
    user: &AuthenticatedUser,
    req: ListCollectionsRequest,
) -> Result<Vec<ListCollectionsCollection>> {
    let page = req.page.unwrap_or(0);
    let page_size = req.page_size.unwrap_or(25);

    let list_of_collections = get_permissioned_collections(user, page, page_size, req).await?;

    Ok(list_of_collections)
}

/// Get collections that the user has permission to access
///
/// # Arguments
/// * `user` - The authenticated user requesting the collections
/// * `page` - The page number for pagination
/// * `page_size` - The number of items per page
/// * `req` - The request containing filtering options
///
/// # Returns
/// * `Result<Vec<ListCollectionsCollection>>` - A list of collections the user has access to
async fn get_permissioned_collections(
    user: &AuthenticatedUser,
    page: i64,
    page_size: i64,
    req: ListCollectionsRequest,
) -> Result<Vec<ListCollectionsCollection>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    let mut collections_statement = collections::table
        .inner_join(
            asset_permissions::table.on(collections::id
                .eq(asset_permissions::asset_id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))
                .and(asset_permissions::deleted_at.is_null())),
        )
        .left_join(
            teams_to_users::table.on(asset_permissions::identity_id
                .eq(teams_to_users::team_id)
                .and(asset_permissions::identity_type.eq(IdentityType::Team))
                .and(teams_to_users::deleted_at.is_null())),
        )
        .inner_join(users::table.on(users::id.eq(collections::created_by)))
        .select((
            collections::id,
            collections::name,
            collections::updated_at,
            collections::created_at,
            asset_permissions::role,
            users::id,
            users::name.nullable(),
            users::email,
            collections::organization_id,
        ))
        .filter(collections::deleted_at.is_null())
        .filter(
            asset_permissions::identity_id
                .eq(user.id)
                .or(teams_to_users::user_id.eq(user.id)),
        )
        .distinct()
        .order((collections::updated_at.desc(), collections::id.asc()))
        .offset(page * page_size)
        .limit(page_size)
        .into_boxed();

    if let Some(filters) = req.filters {
        tracing::info!("Filters: {:?}", filters);
        if filters.shared_with_me.unwrap_or(false) {
            tracing::info!("Filtering for shared with me");
            collections_statement = collections_statement
                .filter(asset_permissions::role.ne(AssetPermissionRole::Owner));
        }

        if filters.owned_by_me.unwrap_or(false) {
            collections_statement = collections_statement
                .filter(asset_permissions::role.eq(AssetPermissionRole::Owner));
        }
    }

    let sql = diesel::debug_query::<diesel::pg::Pg, _>(&collections_statement).to_string();
    tracing::info!("SQL: {}", sql);
    tracing::info!("User ID: {}", user.id);
    
    let collection_results = match collections_statement
        .load::<(
            Uuid,
            String,
            DateTime<Utc>,
            DateTime<Utc>,
            AssetPermissionRole,
            Uuid,
            Option<String>,
            String,
            Uuid,
        )>(&mut conn)
        .await
    {
        Ok(collection_results) => collection_results,
        Err(e) => return Err(anyhow!("Error getting collection results: {}", e)),
    };

    let mut collections: Vec<ListCollectionsCollection> = Vec::new();

    // Filter collections based on user permissions
    // We'll include collections where the user has at least CanView permission
    for (id, name, updated_at, created_at, role, creator_id, creator_name, email, org_id) in collection_results {
        // Check if user has at least CanView permission
        let has_permission = check_permission_access(
            Some(role),
            &[
                AssetPermissionRole::CanView,
                AssetPermissionRole::CanEdit,
                AssetPermissionRole::FullAccess,
                AssetPermissionRole::Owner,
            ],
            org_id,
            &user.organizations,
        );

        if !has_permission {
            continue;
        }

        let owner = ListCollectionsUser {
            id: creator_id,
            name: creator_name.unwrap_or(email),
            avatar_url: None,
        };

        let collection = ListCollectionsCollection {
            id,
            name,
            last_edited: updated_at,
            created_at,
            owner,
            description: "".to_string(),
            is_shared: creator_id != user.id, // Mark as shared if the user is not the creator
        };

        collections.push(collection);
    }

    Ok(collections)
}
