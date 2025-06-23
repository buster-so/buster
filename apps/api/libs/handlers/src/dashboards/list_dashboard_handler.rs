use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType, Verification},
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
    // This is similar to how collections are queried
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
            dashboard_files::organization_id,
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
            Uuid,
        )>(&mut conn)
        .await
    {
        Ok(results) => results,
        Err(e) => return Err(anyhow!("Error getting dashboard results: {}", e)),
    };

    // Filter dashboards based on user permissions
    // We'll include dashboards where the user has at least CanView permission
    let mut dashboards = Vec::new();

    for (id, name, created_by, created_at, updated_at, role, creator_name, org_id) in
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
        );

        if !has_permission {
            continue;
        }

        let owner = DashboardMember {
            id: created_by,
            name: creator_name.unwrap_or_else(|| "Unknown".to_string()),
            avatar_url: None,
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

    Ok(dashboards)
}
