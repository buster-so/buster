use anyhow::Result;
use axum::{extract::Path, Extension};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    database::{
        enums::{UserOrganizationRole, UserOrganizationStatus},
        lib::get_pg_pool,
        models::User,
        schema::{users, users_to_organizations},
    },
    routes::rest::ApiResponse,
    utils::clients::sentry_utils::send_sentry_error,
};
use axum::http::StatusCode;
use diesel::{ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl};

#[derive(Serialize, Deserialize, Clone)]
pub struct UserResponse {
    pub id: Uuid,
    pub name: Option<String>,
    pub email: String,
    pub role: UserOrganizationRole,
    pub status: UserOrganizationStatus,
}

pub async fn get_user_by_id(
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<UserResponse>, (StatusCode, &'static str)> {
    let user_info = match get_user_information(&id).await {
        Ok(user_info) => user_info,
        Err(e) => {
            tracing::error!("Error getting user information: {:?}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting user information",
            ));
        }
    };

    Ok(ApiResponse::JsonData(user_info))
}

pub async fn get_user_information(user_id: &Uuid) -> Result<UserResponse> {
    let pg_pool = get_pg_pool();
    let mut conn = pg_pool.get().await?;

    let (user, (role, status)) = users::table
        .inner_join(users_to_organizations::table.on(users::id.eq(users_to_organizations::user_id)))
        .select((
            (users::id, users::email, users::name.nullable()),
            (users_to_organizations::role, users_to_organizations::status),
        ))
        .filter(users::id.eq(user_id))
        .first::<(
            (Uuid, String, Option<String>),
            (UserOrganizationRole, UserOrganizationStatus),
        )>(&mut conn)
        .await?;

    let (id, email, name) = user;

    Ok(UserResponse {
        id,
        name,
        email,
        role,
        status,
    })
}
