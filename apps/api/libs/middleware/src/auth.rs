use anyhow::{anyhow, Result};
use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response};
use database::{
    models::User,
    pool::get_pg_pool,
    schema::{api_keys, teams_to_users, users, users_to_organizations},
};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use futures::try_join;
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use secrets::{get_secret_sync, get_secret_sync_or_default};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::types::{AuthenticatedUser, OrganizationMembership, TeamMembership};
use std::sync::OnceLock;

static JWT_SECRET: OnceLock<String> = OnceLock::new();
static WEBHOOK_TOKEN: OnceLock<String> = OnceLock::new();

fn get_jwt_secret() -> &'static str {
    JWT_SECRET.get_or_init(|| {
        // Try to get from secrets cache (populated by init_secrets)
        get_secret_sync("JWT_SECRET")
            .unwrap_or_else(|e| {
                tracing::error!("Failed to get JWT_SECRET from secrets cache: {}", e);
                panic!("JWT_SECRET must be loaded via init_secrets() at startup");
            })
    })
}

fn get_webhook_token() -> &'static str {
    WEBHOOK_TOKEN.get_or_init(|| {
        // Try to get from secrets cache (populated by init_secrets)
        get_secret_sync("BUSTER_WH_TOKEN")
            .unwrap_or_else(|e| {
                tracing::warn!("Failed to get BUSTER_WH_TOKEN from secrets cache: {}. Using empty string.", e);
                String::new()
            })
    })
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JwtClaims {
    pub aud: String,
    pub sub: String,
    pub exp: u64,
}

pub async fn auth(mut req: Request, next: Next) -> Result<Response, StatusCode> {
    let is_ws = req
        .headers()
        .get("upgrade")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.eq_ignore_ascii_case("websocket"))
        .unwrap_or(false);

    let handle_auth_error = |msg: &str| {
        if is_ws {
            Ok(Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .header("Sec-WebSocket-Protocol", "close")
                .header("Sec-WebSocket-Close-Code", "4001") // Custom close code
                .header("Sec-WebSocket-Close-Reason", msg)
                .body(axum::body::Body::empty())
                .unwrap())
        } else {
            Err(StatusCode::UNAUTHORIZED)
        }
    };

    let bearer_token = req.headers().get("Authorization").and_then(|value| {
        value.to_str().ok().and_then(|v| {
            if v.starts_with("Bearer ") {
                v.split_whitespace().nth(1)
            } else {
                Some(v)
            }
        })
    });

    if let Some(token) = bearer_token {
        if token == get_webhook_token() {
            return Ok(next.run(req).await);
        }
    }

    let token = if let Some(token) = bearer_token {
        token.to_string()
    } else {
        match req
            .uri()
            .query()
            .and_then(|query| serde_urlencoded::from_str::<HashMap<String, String>>(query).ok())
            .and_then(|params| params.get("authentication").cloned())
        {
            Some(token) => token,
            None => {
                tracing::error!("No token found in request");
                return handle_auth_error("No token found");
            }
        }
    };

    let user = match authorize_current_user(&token).await {
        Ok(Some(user)) => user,
        Ok(None) => return Err(StatusCode::UNAUTHORIZED),
        Err(e) => {
            tracing::error!("Authorization error: {}", e);
            return handle_auth_error("invalid jwt");
        }
    };

    // --- Payment Required Check START ---
    if get_secret_sync_or_default("ENVIRONMENT", "development") == "production" {
        if let Some(org_membership) = user.organizations.get(0) {
            let org_id = org_membership.id;
            let pg_pool = get_pg_pool();
            let mut conn = match pg_pool.get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Failed to get DB connection for payment check: {}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            };

            match database::schema::organizations::table
                .filter(database::schema::organizations::id.eq(org_id))
                .select(database::schema::organizations::payment_required)
                .first::<bool>(&mut conn)
                .await
            {
                Ok(payment_required) => {
                    if payment_required {
                        tracing::warn!(
                            user_id = %user.id,
                            org_id = %org_id,
                            "Access denied due to payment requirement for organization."
                        );
                        return Err(StatusCode::PAYMENT_REQUIRED);
                    }
                }
                Err(diesel::NotFound) => {
                    tracing::error!(
                        user_id = %user.id,
                        org_id = %org_id,
                        "Organization not found during payment check."
                    );
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
                Err(e) => {
                    tracing::error!(
                        user_id = %user.id,
                        org_id = %org_id,
                        "Database error during payment check: {}", e
                    );
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            }
        }
    }
    // --- Payment Required Check END ---

    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}

async fn authorize_current_user(token: &str) -> Result<Option<AuthenticatedUser>> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_audience(&["authenticated", "api"]);

    let token_data = match decode::<JwtClaims>(
        token,
        &DecodingKey::from_secret(get_jwt_secret().as_ref()),
        &validation,
    ) {
        Ok(jwt_claims) => jwt_claims.claims,
        Err(e) => {
            return Err(anyhow!("Error while decoding the token: {}", e));
        }
    };

    let user = match token_data.aud.contains("api") {
        true => find_user_by_api_key(token).await,
        false => find_user_by_id(&Uuid::parse_str(&token_data.sub).unwrap()).await,
    };

    let user = match user {
        Ok(user) => user,
        Err(e) => {
            tracing::error!("Error while querying user: {}", e);
            return Err(anyhow!("Error while querying user: {}", e));
        }
    };

    Ok(user)
}

async fn find_user_by_id(id: &Uuid) -> Result<Option<AuthenticatedUser>> {
    let pg_pool = get_pg_pool();
    let id = *id; // Clone the UUID for move into tasks

    // Spawn tasks for each query with their own connections
    let user_task = tokio::spawn(async move {
        let mut conn = pg_pool.get().await?;
        users::table
            .filter(users::id.eq(id))
            .first::<User>(&mut conn)
            .await
            .map_err(|e| anyhow!("Error querying user: {}", e))
    });

    let orgs_task = tokio::spawn(async move {
        let mut conn = pg_pool.get().await?;
        users_to_organizations::table
            .filter(users_to_organizations::user_id.eq(id))
            .filter(users_to_organizations::deleted_at.is_null())
            .select((
                users_to_organizations::organization_id,
                users_to_organizations::role,
            ))
            .load::<(Uuid, database::enums::UserOrganizationRole)>(&mut conn)
            .await
            .map_err(|e| anyhow!("Error querying organizations: {}", e))
    });

    let teams_task = {
        tokio::spawn(async move {
            let mut conn = pg_pool.get().await?;
            teams_to_users::table
                .filter(teams_to_users::user_id.eq(id))
                .filter(teams_to_users::deleted_at.is_null())
                .select((teams_to_users::team_id, teams_to_users::role))
                .load::<(Uuid, database::enums::TeamToUserRole)>(&mut conn)
                .await
                .map_err(|e| anyhow!("Error querying teams: {}", e))
        })
    };

    // Wait for all tasks to complete and handle errors
    let (user, organizations, teams) = try_join!(
        async {
            user_task
                .await
                .map_err(|e| anyhow!("User task failed: {}", e))?
        },
        async {
            orgs_task
                .await
                .map_err(|e| anyhow!("Organizations task failed: {}", e))?
        },
        async {
            teams_task
                .await
                .map_err(|e| anyhow!("Teams task failed: {}", e))?
        }
    )?;

    let organizations = organizations
        .into_iter()
        .map(|(id, role)| OrganizationMembership { id, role })
        .collect();

    let teams = teams
        .into_iter()
        .map(|(id, role)| TeamMembership { id, role })
        .collect();

    Ok(Some(AuthenticatedUser {
        id: user.id,
        email: user.email,
        name: user.name,
        config: user.config,
        created_at: user.created_at,
        updated_at: user.updated_at,
        attributes: user.attributes,
        avatar_url: user.avatar_url,
        organizations,
        teams,
    }))
}

async fn find_user_by_api_key(token: &str) -> Result<Option<AuthenticatedUser>> {
    let pg_pool = get_pg_pool();
    let token = token.to_string(); // Clone the token for move into tasks

    // Get user info in a separate task
    let user_task = tokio::spawn(async move {
        let mut conn = pg_pool.get().await?;
        users::table
            .inner_join(api_keys::table.on(users::id.eq(api_keys::owner_id)))
            .filter(api_keys::key.eq(token))
            .filter(api_keys::deleted_at.is_null())
            .select(users::all_columns)
            .first::<User>(&mut conn)
            .await
            .map_err(|e| anyhow!("Error querying user: {}", e))
    });

    // Get user first since we need the ID for the other queries
    let user = user_task
        .await
        .map_err(|e| anyhow!("User task failed: {}", e))??;

    let user_id = user.id;
    let pg_pool = get_pg_pool();

    // Spawn tasks for organizations and teams queries
    let orgs_task = tokio::spawn(async move {
        let mut conn = pg_pool.get().await?;
        users_to_organizations::table
            .filter(users_to_organizations::user_id.eq(user_id))
            .filter(users_to_organizations::deleted_at.is_null())
            .select((
                users_to_organizations::organization_id,
                users_to_organizations::role,
            ))
            .load::<(Uuid, database::enums::UserOrganizationRole)>(&mut conn)
            .await
            .map_err(|e| anyhow!("Error querying organizations: {}", e))
    });

    let teams_task = tokio::spawn(async move {
        let mut conn = pg_pool.get().await?;
        teams_to_users::table
            .filter(teams_to_users::user_id.eq(user_id))
            .filter(teams_to_users::deleted_at.is_null())
            .select((teams_to_users::team_id, teams_to_users::role))
            .load::<(Uuid, database::enums::TeamToUserRole)>(&mut conn)
            .await
            .map_err(|e| anyhow!("Error querying teams: {}", e))
    });

    // Wait for organization and team tasks to complete
    let (organizations, teams) = try_join!(
        async {
            orgs_task
                .await
                .map_err(|e| anyhow!("Organizations task failed: {}", e))?
        },
        async {
            teams_task
                .await
                .map_err(|e| anyhow!("Teams task failed: {}", e))?
        }
    )?;

    let organizations = organizations
        .into_iter()
        .map(|(id, role)| OrganizationMembership { id, role })
        .collect();

    let teams = teams
        .into_iter()
        .map(|(id, role)| TeamMembership { id, role })
        .collect();

    Ok(Some(AuthenticatedUser {
        id: user.id,
        email: user.email,
        name: user.name,
        config: user.config,
        created_at: user.created_at,
        updated_at: user.updated_at,
        attributes: user.attributes,
        avatar_url: user.avatar_url,
        organizations,
        teams,
    }))
}
