use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::{
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl,
};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use serde::{Deserialize, Serialize};

use crate::{
    database::{
        enums::{AssetPermissionRole, AssetType, IdentityType},
        lib::get_pg_pool,
        models::User,
        schema::{asset_permissions, dashboards, teams_to_users, users},
    },
    routes::ws::{
        dashboards::dashboards_router::{DashboardEvent, DashboardRoute},
        ws::{WsErrorCode, WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::{send_error_message, send_ws_message},
    },
    utils::clients::sentry_utils::send_sentry_error,
};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListDashboardsFilter {
    pub shared_with_me: Option<bool>,
    pub only_my_dashboards: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListDashBoardsRequest {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub filters: Option<ListDashboardsFilter>,
}

pub async fn list_dashboards(user: &User, req: ListDashBoardsRequest) -> Result<()> {
    let list_dashboards_res = match list_dashboards_handler(&user.id, req).await {
        Ok(res) => res,
        Err(e) => {
            tracing::error!("Error getting threads: {}", e);
            let err = anyhow!("Error getting threads: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            send_error_message(
                &user.id.to_string(),
                WsRoutes::Dashboards(DashboardRoute::List),
                WsEvent::Dashboards(DashboardEvent::GetDashboardsList),
                WsErrorCode::InternalServerError,
                "Failed to list dashboards.".to_string(),
                user,
            )
            .await?;
            return Err(err);
        }
    };

    let list_dashboards_message = WsResponseMessage::new(
        WsRoutes::Dashboards(DashboardRoute::List),
        WsEvent::Dashboards(DashboardEvent::GetDashboardsList),
        list_dashboards_res,
        None,
        user,
        WsSendMethod::SenderOnly,
    );

    match send_ws_message(&user.id.to_string(), &list_dashboards_message).await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error sending ws message: {}", e);
            let err = anyhow!("Error sending ws message: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err(err);
        }
    }

    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListDashboardsUser {
    pub id: Uuid,
    pub name: String,
    pub avatar_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListDashboardsDashboard {
    pub id: Uuid,
    pub name: String,
    pub last_edited: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub owner: ListDashboardsUser,
    pub is_shared: bool,
}

async fn list_dashboards_handler(
    user_id: &Uuid,
    req: ListDashBoardsRequest,
) -> Result<Vec<ListDashboardsDashboard>> {
    let page = req.page.unwrap_or(0);
    let page_size = req.page_size.unwrap_or(25);

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection: {}", e)),
    };

    let mut dashboard_statement = dashboards::table
        .inner_join(
            asset_permissions::table.on(dashboards::id
                .eq(asset_permissions::asset_id)
                .and(asset_permissions::asset_type.eq(AssetType::Dashboard))
                .and(asset_permissions::deleted_at.is_null())),
        )
        .inner_join(users::table.on(users::id.eq(dashboards::created_by)))
        .select((
            dashboards::id,
            dashboards::name,
            dashboards::updated_at,
            dashboards::created_at,
            asset_permissions::role,
            users::id.nullable(),
            users::name.nullable(),
        ))
        .filter(dashboards::deleted_at.is_null())
        .filter(asset_permissions::identity_id.eq(user_id))
        .distinct()
        .order((dashboards::updated_at.desc(), dashboards::id.asc()))
        .offset(page * page_size)
        .limit(page_size)
        .into_boxed();

    if let Some(filters) = req.filters {
        if filters.shared_with_me.unwrap_or(false) {
            dashboard_statement =
                dashboard_statement.filter(asset_permissions::role.ne(AssetPermissionRole::Owner));
        }

        if filters.only_my_dashboards.unwrap_or(false) {
            dashboard_statement =
                dashboard_statement.filter(asset_permissions::role.eq(AssetPermissionRole::Owner));
        }
    }

    let dashboard_results = match dashboard_statement
        .load::<(
            Uuid,
            String,
            DateTime<Utc>,
            DateTime<Utc>,
            AssetPermissionRole,
            Option<Uuid>,
            Option<String>,
        )>(&mut conn)
        .await
    {
        Ok(dashboard_results) => dashboard_results,
        Err(e) => return Err(anyhow!("Error getting dashboard results: {}", e)),
    };

    let mut dashboards: Vec<ListDashboardsDashboard> = Vec::new();

    for (id, name, updated_at, created_at, role, user_id, user_name) in dashboard_results {
        let owner = ListDashboardsUser {
            id: user_id.unwrap_or_default(),
            name: user_name.unwrap_or_default(),
            avatar_url: None,
        };

        let dashboard = ListDashboardsDashboard {
            id,
            name,
            last_edited: updated_at,
            created_at,
            owner,
            is_shared: role != AssetPermissionRole::Owner,
        };

        dashboards.push(dashboard);
    }

    Ok(dashboards)
}
