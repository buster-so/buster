use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::{Extension, Json};
use diesel::prelude::*;
use diesel::upsert::excluded;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use tokio::spawn;
use uuid::Uuid;

use database::enums::TeamToUserRole;
use database::pool::get_pg_pool;
use database::models::TeamToUser;
use database::schema::teams_to_users;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TeamAssignmentRole {
    Member,
    Manager,
    None,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TeamAssignment {
    pub id: Uuid,
    pub role: TeamAssignmentRole,
}

pub async fn put_teams(
    Extension(user): Extension<AuthenticatedUser>,
    Path(user_id): Path<Uuid>,
    Json(assignments): Json<Vec<TeamAssignment>>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match put_teams_handler(user, user_id, assignments).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error listing teams: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error listing teams"));
        }
    }
}

async fn put_teams_handler(
    user: AuthenticatedUser,
    user_id: Uuid,
    assignments: Vec<TeamAssignment>,
) -> Result<()> {
    let organization_id = match get_user_organization_id(&user_id).await {
        Ok(Some(organization_id)) => organization_id,
        Ok(None) => {
            return Err(anyhow::anyhow!("User does not belong to any organization"));
        }
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err(anyhow::anyhow!("Error getting user organization id"));
        }
    };

    if !is_user_workspace_admin_or_data_admin(&user, &organization_id).await? {
        return Err(anyhow::anyhow!("User is not authorized to list teams"));
    };

    let (to_assign, to_unassign): (Vec<_>, Vec<_>) = assignments
        .into_iter()
        .partition(|a| a.role != TeamAssignmentRole::None);

    let assign_handle = {
        let user_id = user_id;
        spawn(async move {
            if !to_assign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                let values: Vec<_> = to_assign
                    .into_iter()
                    .map(|team| TeamToUser {
                        team_id: team.id,
                        user_id,
                        deleted_at: None,
                        created_at: chrono::Utc::now(),
                        updated_at: chrono::Utc::now(),
                        role: match team.role {
                            TeamAssignmentRole::Member => TeamToUserRole::Member,
                            TeamAssignmentRole::Manager => TeamToUserRole::Manager,
                            TeamAssignmentRole::None => unreachable!(),
                        },
                    })
                    .collect();

                diesel::insert_into(teams_to_users::table)
                    .values(&values)
                    .on_conflict((teams_to_users::team_id, teams_to_users::user_id))
                    .do_update()
                    .set((
                        teams_to_users::deleted_at.eq(None::<chrono::DateTime<chrono::Utc>>),
                        teams_to_users::role.eq(excluded(teams_to_users::role)),
                    ))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let unassign_handle = {
        let user_id = user_id;
        spawn(async move {
            if !to_unassign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                diesel::update(teams_to_users::table)
                    .filter(
                        teams_to_users::team_id
                            .eq_any(to_unassign.iter().map(|a| a.id))
                            .and(teams_to_users::user_id.eq(user_id)),
                    )
                    .set(teams_to_users::deleted_at.eq(chrono::Utc::now()))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let (assign_result, unassign_result) = tokio::try_join!(assign_handle, unassign_handle)?;
    assign_result?;
    unassign_result?;

    Ok(())
}
