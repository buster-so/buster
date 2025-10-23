use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType, WorkspaceSharing},
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
    CollectionPagination, ListCollectionsCollection, ListCollectionsRequest,
    ListCollectionsResponse, ListCollectionsUser,
};

/// Handler for listing collections with pagination and filtering
///
/// # Arguments
/// * `user` - The authenticated user requesting the collections
/// * `req` - The request containing pagination and filtering options
///
/// # Returns
/// * `Result<ListCollectionsResponse>` - A paginated list of collections with metadata
pub async fn list_collections_handler(
    user: &AuthenticatedUser,
    req: ListCollectionsRequest,
) -> Result<ListCollectionsResponse> {
    let page = req.page.unwrap_or(1);
    let page_size = req.page_size.unwrap_or(25);

    let response = get_permissioned_collections(user, page, page_size, req).await?;

    Ok(response)
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
/// * `Result<ListCollectionsResponse>` - A paginated response with collections and metadata
async fn get_permissioned_collections(
    user: &AuthenticatedUser,
    page: i64,
    page_size: i64,
    req: ListCollectionsRequest,
) -> Result<ListCollectionsResponse> {
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
            users::avatar_url.nullable(),
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
            Option<String>,
            Uuid,
        )>(&mut conn)
        .await
    {
        Ok(collection_results) => collection_results,
        Err(e) => return Err(anyhow!("Error getting collection results: {}", e)),
    };

    // Get user's organization IDs
    let user_org_ids: Vec<Uuid> = user.organizations.iter().map(|org| org.id).collect();

    // Second query: Get workspace-shared collections that the user doesn't have direct access to
    let workspace_shared_collections = collections::table
        .inner_join(users::table.on(users::id.eq(collections::created_by)))
        .filter(collections::deleted_at.is_null())
        .filter(collections::organization_id.eq_any(&user_org_ids))
        .filter(collections::workspace_sharing.ne(WorkspaceSharing::None))
        // Exclude collections we already have direct access to
        .filter(
            diesel::dsl::not(diesel::dsl::exists(
                asset_permissions::table
                    .filter(asset_permissions::asset_id.eq(collections::id))
                    .filter(asset_permissions::asset_type.eq(AssetType::Collection))
                    .filter(asset_permissions::deleted_at.is_null())
                    .filter(
                        asset_permissions::identity_id
                            .eq(user.id)
                            .or(teams_to_users::table
                                .filter(teams_to_users::team_id.eq(asset_permissions::identity_id))
                                .filter(teams_to_users::user_id.eq(user.id))
                                .filter(teams_to_users::deleted_at.is_null())
                                .select(teams_to_users::user_id)
                                .single_value()
                                .is_not_null()),
                    ),
            )),
        )
        .select((
            collections::id,
            collections::name,
            collections::updated_at,
            collections::created_at,
            collections::workspace_sharing,
            users::id,
            users::name.nullable(),
            users::email,
            users::avatar_url.nullable(),
            collections::organization_id,
        ))
        .order((collections::updated_at.desc(), collections::id.asc()))
        .load::<(
            Uuid,
            String,
            DateTime<Utc>,
            DateTime<Utc>,
            WorkspaceSharing,
            Uuid,
            Option<String>,
            String,
            Option<String>,
            Uuid,
        )>(&mut conn)
        .await
        .map_err(|e| anyhow!("Error getting workspace-shared collections: {}", e))?;

    let mut collections: Vec<ListCollectionsCollection> = Vec::new();

    // Process directly-accessed collections
    // Filter collections based on user permissions
    // We'll include collections where the user has at least CanView permission
    for (id, name, updated_at, created_at, role, creator_id, creator_name, email, creator_avatar_url, org_id) in collection_results {
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
            WorkspaceSharing::None, // Use None as default for list handlers
        );

        if !has_permission {
            continue;
        }

        let collection = ListCollectionsCollection {
            id,
            name,
            updated_at,
            created_at,
            created_by: creator_id,
            created_by_name: creator_name,
            created_by_email: email,
            created_by_avatar_url: creator_avatar_url,
            description: "".to_string(),
            is_shared: creator_id != user.id, // Mark as shared if the user is not the creator
        };

        collections.push(collection);
    }

    // Process workspace-shared collections
    for (id, name, updated_at, created_at, workspace_sharing, creator_id, creator_name, email, creator_avatar_url, org_id) in workspace_shared_collections {
        // Map workspace sharing level to a permission role
        let workspace_permission = match workspace_sharing {
            WorkspaceSharing::CanView => AssetPermissionRole::CanView,
            WorkspaceSharing::CanEdit => AssetPermissionRole::CanEdit,
            WorkspaceSharing::FullAccess => AssetPermissionRole::FullAccess,
            WorkspaceSharing::None => continue, // Skip if None
        };

        // Check if user has the workspace-granted permission
        let has_permission = check_permission_access(
            Some(workspace_permission),
            &[
                AssetPermissionRole::CanView,
                AssetPermissionRole::CanEdit,
                AssetPermissionRole::FullAccess,
                AssetPermissionRole::Owner,
            ],
            org_id,
            &user.organizations,
            workspace_sharing,
        );

        if !has_permission {
            continue;
        }

        let collection = ListCollectionsCollection {
            id,
            name,
            updated_at,
            created_at,
            created_by: creator_id,
            created_by_name: creator_name,
            created_by_email: email,
            created_by_avatar_url: creator_avatar_url,
            description: "".to_string(),
            is_shared: true, // Always true for workspace-shared collections
        };

        collections.push(collection);
    }

    // Sort all collections by updated_at descending
    collections.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    // Calculate pagination metadata
    let total = collections.len() as i64;
    let start_idx = ((page - 1) * page_size) as usize;
    let end_idx = (start_idx + page_size as usize).min(collections.len());
    let has_more = end_idx < collections.len();

    // Apply pagination
    let paginated_collections: Vec<ListCollectionsCollection> = collections.into_iter()
        .skip(start_idx)
        .take(page_size as usize)
        .collect();

    let response = ListCollectionsResponse {
        data: paginated_collections,
        pagination: CollectionPagination {
            page,
            page_size,
            has_more,
        },
    };

    Ok(response)
}
