use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::{Extension, Json};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use tokio::spawn;
use uuid::Uuid;

use database::enums::IdentityType;
use database::pool::get_pg_pool;
use database::models::PermissionGroupToIdentity;
use database::schema::permission_groups_to_identities;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use database::organization::get_user_organization_id;
use middleware::AuthenticatedUser;

#[derive(Debug, Serialize, Deserialize)]
pub struct PermissionGroupAssignment {
    pub id: Uuid,
    pub assigned: bool,
}

pub async fn put_permission_groups(
    Extension(user): Extension<AuthenticatedUser>,
    Path(user_id): Path<Uuid>,
    Json(assignments): Json<Vec<PermissionGroupAssignment>>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match put_permission_groups_handler(user, user_id, assignments).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error assigning permission groups: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error assigning permission groups",
            ));
        }
    }
}

async fn put_permission_groups_handler(
    user: AuthenticatedUser,
    user_id: Uuid,
    assignments: Vec<PermissionGroupAssignment>,
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
        return Err(anyhow::anyhow!(
            "User is not authorized to assign permission groups"
        ));
    };

    let (to_assign, to_unassign): (Vec<_>, Vec<_>) =
        assignments.into_iter().partition(|a| a.assigned);

    let assign_handle = {
        let user_id = user_id;
        let created_by = user.id.clone();
        spawn(async move {
            if !to_assign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                let values: Vec<_> = to_assign
                    .into_iter()
                    .map(|group| PermissionGroupToIdentity {
                        permission_group_id: group.id,
                        identity_id: user_id,
                        identity_type: IdentityType::User,
                        deleted_at: None,
                        created_at: chrono::Utc::now(),
                        updated_at: chrono::Utc::now(),
                        created_by: created_by.clone(),
                        updated_by: created_by,
                    })
                    .collect();

                diesel::insert_into(permission_groups_to_identities::table)
                    .values(&values)
                    .on_conflict((
                        permission_groups_to_identities::permission_group_id,
                        permission_groups_to_identities::identity_id,
                        permission_groups_to_identities::identity_type,
                    ))
                    .do_update()
                    .set(
                        permission_groups_to_identities::deleted_at
                            .eq(None::<chrono::DateTime<chrono::Utc>>),
                    )
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
                diesel::update(permission_groups_to_identities::table)
                    .filter(
                        permission_groups_to_identities::permission_group_id
                            .eq_any(to_unassign.iter().map(|a| a.id))
                            .and(permission_groups_to_identities::identity_id.eq(user_id))
                            .and(
                                permission_groups_to_identities::identity_type
                                    .eq(IdentityType::User),
                            ),
                    )
                    .set(permission_groups_to_identities::deleted_at.eq(chrono::Utc::now()))
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
