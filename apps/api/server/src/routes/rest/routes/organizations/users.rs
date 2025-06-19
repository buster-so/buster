use anyhow::Result;
use axum::{extract::Path, http::StatusCode, Extension};
use diesel::{ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{
    enums::{UserOrganizationRole, UserOrganizationStatus},
    pool::get_pg_pool,
    schema::{users, users_to_organizations},
};

use crate::routes::rest::ApiResponse;
use middleware::AuthenticatedUser;

#[derive(Serialize, Deserialize, Clone)]
pub struct UserResponse {
    pub id: Uuid,
    pub name: Option<String>,
    pub email: String,
    pub role: UserOrganizationRole,
    pub status: UserOrganizationStatus,
}

pub async fn list_organization_users(
    Extension(user): Extension<AuthenticatedUser>,
    Path(organization_id): Path<Uuid>,
) -> Result<ApiResponse<Vec<UserResponse>>, (StatusCode, &'static str)> {
    let users = match list_organization_users_handler(organization_id).await {
        Ok(users) => users,
        Err(e) => {
            tracing::error!("Error listing organization users: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing organization users",
            ));
        }
    };

    Ok(ApiResponse::JsonData(users))
}

async fn list_organization_users_handler(organization_id: Uuid) -> Result<Vec<UserResponse>> {
    let mut conn = get_pg_pool().get().await?;

    let users = users::table
        .inner_join(users_to_organizations::table.on(users::id.eq(users_to_organizations::user_id)))
        .select((
            users::id,
            users::email,
            users::name.nullable(),
            users_to_organizations::role,
            users_to_organizations::status,
        ))
        .filter(users_to_organizations::organization_id.eq(organization_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .load::<(
            Uuid,
            String,
            Option<String>,
            UserOrganizationRole,
            UserOrganizationStatus,
        )>(&mut conn)
        .await?;

    Ok(users
        .into_iter()
        .map(|(id, email, name, role, status)| UserResponse {
            id,
            name,
            email,
            role,
            status,
        })
        .collect())
}
