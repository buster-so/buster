use anyhow::Result;
use axum::Extension;
use diesel_async::RunQueryDsl;

use database::enums::{TeamToUserRole, UserOrganizationRole};
use database::pool::get_pg_pool;
use database::models::{Organization, Team, User};
use database::schema::{
    organizations, teams, teams_to_users, users, users_to_organizations,
};
use crate::routes::rest::ApiResponse;
use axum::http::StatusCode;
use diesel::{
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use middleware::AuthenticatedUser;

pub async fn get_user(
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<ApiResponse<UserInfoObject>, (StatusCode, &'static str)> {
    let user_info_object = match get_user_information(&user.id).await {
        Ok(user_info_object) => user_info_object,
        Err(e) => {
            tracing::error!("Error getting user information: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting user information",
            ));
        }
    };

    Ok(ApiResponse::JsonData(user_info_object))
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserOrganization {
    #[serde(flatten)]
    pub organization: Organization,
    pub role: UserOrganizationRole,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserTeam {
    #[serde(flatten)]
    pub team: Team,
    pub role: TeamToUserRole,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserInfoObject {
    pub user: User,
    pub organizations: Vec<UserOrganization>,
    pub teams: Vec<UserTeam>,
}

pub async fn get_user_information(user_id: &Uuid) -> Result<UserInfoObject> {
    let pg_pool = get_pg_pool();

    let mut conn = match pg_pool.get().await {
        Ok(conn) => conn,
        Err(_e) => {
            return Err(anyhow::anyhow!("Error getting postgres connection"));
        }
    };

    let user_org_teams = match users::table
        .left_join(
            users_to_organizations::table.on(users::id
                .eq(users_to_organizations::user_id)
                .and(users_to_organizations::deleted_at.is_null())),
        )
        .left_join(
            teams_to_users::table.on(users::id
                .eq(teams_to_users::user_id)
                .and(teams_to_users::deleted_at.is_null())),
        )
        .left_join(
            teams::table.on(teams_to_users::team_id
                .eq(teams::id)
                .and(teams::deleted_at.is_null())),
        )
        .left_join(
            organizations::table.on(users_to_organizations::organization_id
                .eq(organizations::id)
                .and(organizations::deleted_at.is_null())),
        )
        .select((
            (
                users::id,
                users::email,
                users::name,
                users::config,
                users::created_at,
                users::updated_at,
                users::attributes,
                users::avatar_url,
            ),
            (
                teams::id,
                teams::name,
                teams::organization_id,
                teams::sharing_setting,
                teams::edit_sql,
                teams::upload_csv,
                teams::export_assets,
                teams::email_slack_enabled,
                teams::created_by,
                teams::created_at,
                teams::updated_at,
                teams::deleted_at,
            )
                .nullable(),
            (
                organizations::id,
                organizations::name,
                organizations::domain,
                organizations::created_at,
                organizations::updated_at,
                organizations::deleted_at,
                organizations::payment_required,
            )
                .nullable(),
            users_to_organizations::role.nullable(),
            teams_to_users::role.nullable(),
        ))
        .filter(users::id.eq(user_id))
        .load::<(
            User,
            Option<Team>,
            Option<Organization>,
            Option<UserOrganizationRole>,
            Option<TeamToUserRole>,
        )>(&mut conn)
        .await
    {
        Ok(user_org_teams) => user_org_teams,
        Err(_e) => {
            return Err(anyhow::anyhow!("Error getting user information"));
        }
    };

    let user = match user_org_teams.iter().next() {
        Some((user, _, _, _, _)) => user.clone(),
        None => return Err(anyhow::anyhow!("User not found")),
    };

    let teams: Vec<UserTeam> = user_org_teams
        .iter()
        .filter_map(|(_, team, _, _, role)| match (team, role) {
            (Some(team), Some(role)) => Some(UserTeam {
                team: team.clone(),
                role: role.clone(),
            }),
            _ => None,
        })
        .collect();

    let organizations: Vec<UserOrganization> = user_org_teams
        .iter()
        .filter_map(|(_, _, organization, role, _)| match (organization, role) {
            (Some(organization), Some(role)) => Some(UserOrganization {
                organization: organization.clone(),
                role: role.clone(),
            }),
            _ => None,
        })
        .collect();

    Ok(UserInfoObject {
        user,
        teams,
        organizations,
    })
}
