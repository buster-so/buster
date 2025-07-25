use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType, Verification, WorkspaceSharing},
    pool::get_pg_pool,
    schema::{asset_permissions, dashboard_files, teams_to_users, users},
};
use diesel::{
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl,
};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use sharing::check_permission_access;
use uuid::Uuid;

use super::{BusterDashboardListItem, DashboardMember};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DashboardsListRequest {
    /// The page number to fetch
    pub page_token: i64,
    /// Number of items per page
    pub page_size: i64,
    /// Filter for dashboards shared with the current user
    pub shared_with_me: Option<bool>,
    /// Filter for dashboards owned by the current user
    pub only_my_dashboards: Option<bool>,
}

pub async fn list_dashboard_handler(
    user: &AuthenticatedUser,
    request: DashboardsListRequest,
) -> Result<Vec<BusterDashboardListItem>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    // Calculate offset from page_token
    let offset = request.page_token * request.page_size;

    // Build the query to get dashboards with permissions
    // We need to handle both direct permissions and workspace sharing
    // First, get dashboards with direct permissions
    let mut dashboard_statement = dashboard_files::table
        .inner_join(
            asset_permissions::table.on(dashboard_files::id
                .eq(asset_permissions::asset_id)
                .and(asset_permissions::asset_type.eq(AssetType::DashboardFile))
                .and(asset_permissions::deleted_at.is_null())),
        )
        .left_join(
            teams_to_users::table.on(asset_permissions::identity_id
                .eq(teams_to_users::team_id)
                .and(asset_permissions::identity_type.eq(IdentityType::Team))
                .and(teams_to_users::deleted_at.is_null())),
        )
        .inner_join(users::table.on(users::id.eq(dashboard_files::created_by)))
        .select((
            dashboard_files::id,
            dashboard_files::name,
            dashboard_files::created_by,
            dashboard_files::created_at,
            dashboard_files::updated_at,
            asset_permissions::role,
            users::name.nullable(),
            users::avatar_url.nullable(),
            dashboard_files::organization_id,
            dashboard_files::workspace_sharing,
        ))
        .filter(dashboard_files::deleted_at.is_null())
        .filter(
            asset_permissions::identity_id
                .eq(user.id)
                .or(teams_to_users::user_id.eq(user.id)),
        )
        .distinct()
        .order((
            dashboard_files::updated_at.desc(),
            dashboard_files::id.asc(),
        ))
        .offset(offset)
        .limit(request.page_size)
        .into_boxed();

    // Add additional filters if specified
    if let Some(shared_with_me) = request.shared_with_me {
        if shared_with_me {
            dashboard_statement =
                dashboard_statement.filter(asset_permissions::role.ne(AssetPermissionRole::Owner));
        }
    }

    if let Some(only_my_dashboards) = request.only_my_dashboards {
        if only_my_dashboards {
            dashboard_statement =
                dashboard_statement.filter(asset_permissions::role.eq(AssetPermissionRole::Owner));
        }
    }

    // Execute the query
    let dashboard_results = match dashboard_statement
        .load::<(
            Uuid,
            String,
            Uuid,
            DateTime<Utc>,
            DateTime<Utc>,
            AssetPermissionRole,
            Option<String>,
            Option<String>,
            Uuid,
            WorkspaceSharing,
        )>(&mut conn)
        .await
    {
        Ok(results) => results,
        Err(e) => return Err(anyhow!("Error getting dashboard results: {}", e)),
    };

    // Filter dashboards based on user permissions
    // We'll include dashboards where the user has at least CanView permission
    let mut dashboards = Vec::new();

    for (id, name, created_by, created_at, updated_at, role, creator_name, creator_avatar_url, org_id, workspace_sharing) in
        dashboard_results
    {
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
            workspace_sharing,
        );

        if !has_permission {
            continue;
        }

        let owner = DashboardMember {
            id: created_by,
            name: creator_name.unwrap_or_else(|| "Unknown".to_string()),
            avatar_url: creator_avatar_url,
        };

        let dashboard_item = BusterDashboardListItem {
            id,
            name,
            created_at,
            last_edited: updated_at,
            owner,
            members: vec![],
            status: Verification::Verified, // Default status, can be updated if needed
            is_shared: created_by != user.id, // Mark as shared if the user is not the creator
        };

        dashboards.push(dashboard_item);
    }

    // Now also fetch workspace-shared dashboards that the user doesn't have direct access to
    let user_org_ids: Vec<Uuid> = user.organizations.iter().map(|org| org.id).collect();
    
    if !user_org_ids.is_empty() {
        let workspace_shared_dashboards = dashboard_files::table
            .inner_join(users::table.on(users::id.eq(dashboard_files::created_by)))
            .filter(dashboard_files::deleted_at.is_null())
            .filter(dashboard_files::organization_id.eq_any(&user_org_ids))
            .filter(dashboard_files::workspace_sharing.ne(WorkspaceSharing::None))
            // Exclude dashboards we already have direct access to
            .filter(
                diesel::dsl::not(diesel::dsl::exists(
                    asset_permissions::table
                        .filter(asset_permissions::asset_id.eq(dashboard_files::id))
                        .filter(asset_permissions::asset_type.eq(AssetType::DashboardFile))
                        .filter(asset_permissions::deleted_at.is_null())
                        .filter(
                            asset_permissions::identity_id
                                .eq(user.id)
                                .or(
                                    asset_permissions::identity_type.eq(IdentityType::Team)
                                        .and(diesel::dsl::exists(
                                            teams_to_users::table
                                                .filter(teams_to_users::team_id.eq(asset_permissions::identity_id))
                                                .filter(teams_to_users::user_id.eq(user.id))
                                                .filter(teams_to_users::deleted_at.is_null())
                                        ))
                                )
                        )
                ))
            )
            .select((
                dashboard_files::id,
                dashboard_files::name,
                dashboard_files::created_by,
                dashboard_files::created_at,
                dashboard_files::updated_at,
                dashboard_files::workspace_sharing,
                users::name.nullable(),
                users::avatar_url.nullable(),
                dashboard_files::organization_id,
            ))
            .order((
                dashboard_files::updated_at.desc(),
                dashboard_files::id.asc(),
            ))
            .load::<(
                Uuid,
                String,
                Uuid,
                DateTime<Utc>,
                DateTime<Utc>,
                WorkspaceSharing,
                Option<String>,
                Option<String>,
                Uuid,
            )>(&mut conn)
            .await
            .map_err(|e| anyhow!("Error getting workspace shared dashboards: {}", e))?;

        for (id, name, created_by, created_at, updated_at, workspace_sharing, creator_name, creator_avatar_url, org_id) in workspace_shared_dashboards {
            // Determine the effective permission based on workspace sharing
            let role = match workspace_sharing {
                WorkspaceSharing::CanView => AssetPermissionRole::CanView,
                WorkspaceSharing::CanEdit => AssetPermissionRole::CanEdit,
                WorkspaceSharing::FullAccess => AssetPermissionRole::FullAccess,
                WorkspaceSharing::None => continue, // Should not happen due to filter
            };

            let owner = DashboardMember {
                id: created_by,
                name: creator_name.unwrap_or_else(|| "Unknown".to_string()),
                avatar_url: creator_avatar_url,
            };

            let dashboard_item = BusterDashboardListItem {
                id,
                name,
                created_at,
                last_edited: updated_at,
                owner,
                members: vec![],
                status: Verification::Verified,
                is_shared: true, // Always shared for workspace-shared dashboards
            };

            dashboards.push(dashboard_item);
        }
    }

    // Sort dashboards by updated_at desc (already sorted by queries, but need to re-sort after combining)
    dashboards.sort_by(|a, b| b.last_edited.cmp(&a.last_edited));
    
    // Apply pagination after combining results
    let paginated_dashboards = dashboards.into_iter()
        .skip(offset as usize)
        .take(request.page_size as usize)
        .collect();

    Ok(paginated_dashboards)
}
