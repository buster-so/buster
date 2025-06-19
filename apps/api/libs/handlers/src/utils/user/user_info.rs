use anyhow::{anyhow, Result};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use database::{
    pool::get_pg_pool,
    schema::users_to_organizations,
};

pub async fn get_user_organization_id(user_id: &Uuid) -> Result<Uuid> {
    let mut conn = get_pg_pool().get().await?;

    let organization_id = match users_to_organizations::table
        .select(users_to_organizations::organization_id)
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .first::<Uuid>(&mut conn)
        .await
    {
        Ok(organization_id) => organization_id,
        Err(diesel::result::Error::NotFound) => return Err(anyhow!("User not found")),
        Err(e) => return Err(anyhow!("Error getting user organization id: {}", e)),
    };

    Ok(organization_id)
}
