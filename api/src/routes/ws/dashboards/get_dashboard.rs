use std::sync::Arc;

use anyhow::{anyhow, Result};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    database::{
        enums::AssetPermissionRole,
        lib::StepProgress,
        models::User,
    },
    routes::ws::{
        ws::{SubscriptionRwLock, WsErrorCode, WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::{send_error_message, send_ws_message, subscribe_to_stream},
    },
    utils::{
        clients::{
            posthog::{
                send_posthog_event_handler, DashboardViewedProperties, PosthogEventProperties,
                PosthogEventType,
            },
            sentry_utils::send_sentry_error,
        },
        query_engine::{data_types::DataType, query_engine::query_engine},
    },
};

use super::{
    dashboard_utils::{get_dashboard_state_by_id, DashboardState, Metric},
    dashboards_router::{DashboardEvent, DashboardRoute},
};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetDashboardRequest {
    pub id: Uuid,
    pub password: Option<String>,
}

pub async fn get_dashboard(
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &User,
    req: GetDashboardRequest,
) -> Result<()> {
    let dashboard_id = req.id.clone();
    let dashboard_subscription = format!("dashboard:{}", req.id);

    match subscribe_to_stream(subscriptions, &dashboard_subscription, user_group, &user.id).await {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error subscribing to dashboard: {}", e)),
    };

    let mut dashboard_with_metrics = match get_dashboard_state_by_id(&user.id, &req.id).await {
        Ok(dashboard_with_metrics) => dashboard_with_metrics,
        Err(e) => {
            tracing::error!("Error getting dashboard with metrics: {}", e);
            send_error_message(
                &dashboard_subscription,
                WsRoutes::Dashboards(DashboardRoute::Get),
                WsEvent::Dashboards(DashboardEvent::GetDashboardState),
                WsErrorCode::InternalServerError,
                "Failed to fetch dashboard.".to_string(),
                user,
            )
            .await?;
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err(anyhow!("Error getting dashboard with metrics: {}", e));
        }
    };

    // Check permissions and handle public access
    match dashboard_with_metrics.permission {
        Some(_) => {
            // User has explicit permission, proceed
        }
        None => {
            // No explicit permission, check if public access is allowed
            if !dashboard_with_metrics.dashboard.publicly_accessible {
                send_error_message(
                    &user.id.to_string(),
                    WsRoutes::Dashboards(DashboardRoute::Get),
                    WsEvent::Dashboards(DashboardEvent::GetDashboardState),
                    WsErrorCode::Unauthorized,
                    "You don't have permission to access this dashboard".to_string(),
                    user,
                )
                .await?;
                return Ok(());
            }

            // Check public access expiry
            if let Some(expiry) = dashboard_with_metrics.dashboard.public_expiry_date {
                if expiry <= chrono::Utc::now() {
                    send_error_message(
                        &user.id.to_string(),
                        WsRoutes::Dashboards(DashboardRoute::Get),
                        WsEvent::Dashboards(DashboardEvent::GetDashboardState),
                        WsErrorCode::Unauthorized,
                        "Public access to this dashboard has expired".to_string(),
                        user,
                    )
                    .await?;
                    return Ok(());
                }
            }

            // Check password if required
            if let Some(password) = &dashboard_with_metrics.public_password {
                match &req.password {
                    Some(submitted_password) if submitted_password == password => {
                        // Password matches, proceed with viewer access
                        dashboard_with_metrics.permission = Some(AssetPermissionRole::Viewer);
                    }
                    _ => {
                        send_error_message(
                            &user.id.to_string(),
                            WsRoutes::Dashboards(DashboardRoute::Get),
                            WsEvent::Dashboards(DashboardEvent::GetDashboardState),
                            WsErrorCode::Unauthorized,
                            "Invalid or missing password".to_string(),
                            user,
                        )
                        .await?;
                        return Ok(());
                    }
                }
            } else {
                // No password required for public access
                dashboard_with_metrics.permission = Some(AssetPermissionRole::Viewer);
            }

            // Clear sensitive data for public access
            dashboard_with_metrics.public_password = None;
            dashboard_with_metrics.organization_permissions = false;
            dashboard_with_metrics.individual_permissions = None;
            dashboard_with_metrics.team_permissions = None;
            dashboard_with_metrics.collections = vec![];
        }
    }

    match send_dashboard_skeleton_message(user, &dashboard_subscription, &dashboard_with_metrics).await {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error sending dashboard skeleton message: {}", e)),
    };

    for metric in &dashboard_with_metrics.metrics {
        match fetch_data_handler(&dashboard_subscription, metric, user).await {
            Ok(_) => (),
            Err(e) => return Err(anyhow!("Error fetching data: {}", e)),
        };
    }

    match send_posthog_event_handler(
        PosthogEventType::DashboardViewed,
        Some(user.id),
        PosthogEventProperties::DashboardViewed(DashboardViewedProperties { dashboard_id }),
    )
    .await
    {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error sending posthog event: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
        }
    };

    Ok(())
}

async fn send_dashboard_skeleton_message(
    user: &User,
    dashboard_subscription: &String,
    dashboard_with_metrics: &DashboardState,
) -> Result<()> {
    let get_dashboard_message = WsResponseMessage::new(
        WsRoutes::Dashboards(DashboardRoute::Get),
        WsEvent::Dashboards(DashboardEvent::GetDashboardState),
        dashboard_with_metrics,
        None,
        user,
        WsSendMethod::All,
    );

    match send_ws_message(&dashboard_subscription, &get_dashboard_message).await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error sending ws message: {}", e);
            return Err(anyhow!("Error sending ws message: {}", e));
        }
    };

    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FetchingData {
    pub progress: StepProgress,
    pub data: Option<Vec<IndexMap<String, DataType>>>,
    pub metric_id: Uuid,
}

async fn fetch_data_handler(subscription: &String, metric: &Metric, user: &User) -> Result<()> {
    let subscription = subscription.clone();
    let metric = metric.clone();
    let user = user.clone();

    tokio::spawn(async move {
        let data = match query_engine(&metric.dataset_id, &metric.sql).await {
            Ok(data) => data,
            Err(e) => {
                tracing::error!("Unable to query engine: {:?}", e);
                send_sentry_error(&e.to_string(), None);
                send_error_message(
                    &subscription,
                    WsRoutes::Dashboards(DashboardRoute::Get),
                    WsEvent::Dashboards(DashboardEvent::GetDashboardState),
                    WsErrorCode::InternalServerError,
                    "Failed to delete dashboard.".to_string(),
                    &user,
                )
                .await?;
                return Err(e);
            }
        };

        let fetching_data_body = FetchingData {
            progress: StepProgress::Completed,
            data: if data.is_empty() {
                Some(vec![])
            } else {
                Some(data)
            },
            metric_id: metric.id,
        };

        let fetching_data_ws_response = WsResponseMessage::new(
            WsRoutes::Dashboards(DashboardRoute::Get),
            WsEvent::Dashboards(DashboardEvent::FetchingData),
            Some(fetching_data_body),
            None,
            &user,
            WsSendMethod::SenderOnly,
        );

        match send_ws_message(&subscription, &fetching_data_ws_response).await {
            Ok(_) => (),
            Err(e) => {
                tracing::error!(
                    "Unable to send fetching data success to subscription: {:?}",
                    e
                );
                send_sentry_error(&e.to_string(), None);
                return Err(e);
            }
        }

        Ok(())
    });

    Ok(())
}
