use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{insert_into, upsert::excluded, ExpressionMethods};
use serde_json::json;
use std::collections::HashSet;

use diesel_async::RunQueryDsl;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    database::{
        enums::{SharingSetting, TeamToUserRole, UserOrganizationRole, UserOrganizationStatus},
        lib::{get_pg_pool, UserConfig},
        models::{TeamToUser, User, UserToOrganization},
        schema::{teams_to_users, users, users_to_organizations},
    },
    routes::ws::{
        ws::{WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::send_ws_message,
    },
    utils::{
        clients::{
            email::resend::{send_email, EmailType, InviteToBuster},
            sentry_utils::send_sentry_error,
        },
        user::user_info::get_user_organization,
    },
};

use super::users_router::{UserEvent, UserRoute};

#[derive(Deserialize, Debug, Clone)]
pub struct InviteUsersRequest {
    pub emails: Vec<String>,
    pub team_ids: Option<Vec<Uuid>>,
}

pub async fn invite_users(user: &User, req: InviteUsersRequest) -> Result<()> {
    match invite_users_handler(user, req).await {
        Ok(users) => users,
        Err(e) => {
            tracing::error!("Error listing users: {}", e);
            return Err(e);
        }
    };

    let list_users_message = WsResponseMessage::new(
        WsRoutes::Users(UserRoute::List),
        WsEvent::Users(UserEvent::ListUsers),
        Some(()),
        None,
        user,
        WsSendMethod::SenderOnly,
    );

    match send_ws_message(&user.id.to_string(), &list_users_message).await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error sending ws message: {}", e);
            return Err(anyhow!("Error sending ws message: {}", e));
        }
    }

    Ok(())
}

async fn invite_users_handler(user: &User, req: InviteUsersRequest) -> Result<()> {
    let organization = get_user_organization(&user.id).await?;

    let users_to_add = req
        .emails
        .iter()
        .map(|email| {
            let user_config = UserConfig {
                color_palettes: None,
                last_used_color_palette: None,
            };

            let new_user_id = Uuid::new_v4();

            User {
                name: None,
                email: email.clone(),
                id: new_user_id.clone(),
                config: json!(user_config),
                created_at: Utc::now(),
                updated_at: Utc::now(),
                attributes: json!({
                    "user_id": new_user_id.to_string(),
                    "organization_id": organization.id.to_string(),
                    "user_email": email,
                    "organization_role": "viewer".to_string(),
                }),
            }
        })
        .collect::<Vec<User>>();

    let user_organization = users_to_add
        .iter()
        .map(|new_user| UserToOrganization {
            user_id: new_user.id,
            organization_id: organization.id,
            role: UserOrganizationRole::Querier,
            status: UserOrganizationStatus::Active,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            sharing_setting: SharingSetting::Public,
            edit_sql: true,
            upload_csv: true,
            export_assets: true,
            email_slack_enabled: true,
            deleted_at: None,
            created_by: user.id,
            updated_by: user.id,
            deleted_by: None,
        })
        .collect::<Vec<UserToOrganization>>();

    let invite_body = InviteToBuster {
        inviter_name: user.name.clone().unwrap_or(user.email.clone()),
        organization_name: organization.name.clone(),
    };

    let emails_to_invite: HashSet<String> = req.emails.clone().into_iter().collect();

    // Send emails in background
    tokio::spawn(async move {
        match send_email(emails_to_invite, EmailType::InviteToBuster(invite_body)).await {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error sending email: {}", e);
                send_sentry_error(&format!("Error sending email: {}", e), None)
            }
        }
    });

    let mut conn = get_pg_pool().get().await?;

    // Insert users
    match insert_into(users::table)
        .values(&users_to_add)
        .on_conflict(users::id)
        .do_update()
        .set((users::updated_at.eq(chrono::Utc::now()),))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error inserting users: {}", e);
            return Err(anyhow!("Error inserting users: {}", e));
        }
    };

    // Insert user-organization relationships
    match insert_into(users_to_organizations::table)
        .values(user_organization)
        .on_conflict((users_to_organizations::user_id, users_to_organizations::organization_id))
        .do_update()
        .set((
            users_to_organizations::updated_at.eq(chrono::Utc::now()),
            users_to_organizations::role.eq(excluded(users_to_organizations::role)),
            users_to_organizations::sharing_setting.eq(excluded(users_to_organizations::sharing_setting)),
            users_to_organizations::edit_sql.eq(excluded(users_to_organizations::edit_sql)),
            users_to_organizations::upload_csv.eq(excluded(users_to_organizations::upload_csv)),
            users_to_organizations::export_assets.eq(excluded(users_to_organizations::export_assets)),
            users_to_organizations::email_slack_enabled.eq(excluded(users_to_organizations::email_slack_enabled)),
            users_to_organizations::deleted_at.eq(excluded(users_to_organizations::deleted_at)),
            users_to_organizations::created_by.eq(excluded(users_to_organizations::created_by)),
            users_to_organizations::updated_by.eq(excluded(users_to_organizations::updated_by)),
            users_to_organizations::deleted_by.eq(excluded(users_to_organizations::deleted_by)),
        ))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error inserting users to organizations: {}", e);
            return Err(anyhow!("Error inserting users to organizations: {}", e));
        }
    };

    // If team_ids are provided, add team relationships
    if let Some(team_ids) = req.team_ids {
        let mut team_to_users = Vec::new();

        for team_id in team_ids {
            for new_user in &users_to_add {
                team_to_users.push(TeamToUser {
                    team_id,
                    user_id: new_user.id,
                    role: TeamToUserRole::Member,
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                    deleted_at: None,
                });
            }
        }

        match insert_into(teams_to_users::table)
            .values(team_to_users)
            .on_conflict((teams_to_users::team_id, teams_to_users::user_id))
            .do_update()
            .set((
                teams_to_users::updated_at.eq(chrono::Utc::now()),
                teams_to_users::role.eq(excluded(teams_to_users::role)),
                teams_to_users::deleted_at.eq(excluded(teams_to_users::deleted_at)),
            ))
            .execute(&mut conn)
            .await
        {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Error inserting team to users: {}", e);
                return Err(anyhow!("Error inserting team to users: {}", e));
            }
        }
    }

    Ok(())
}
