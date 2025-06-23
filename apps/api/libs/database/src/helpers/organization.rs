use anyhow::Result;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::pool::get_pg_pool;
use crate::schema::users_to_organizations;

/// Gets the organization ID for a user
///
/// # Arguments
/// * `user_id` - The UUID of the user
///
/// # Returns
/// * `Result<Option<Uuid>>` - The organization ID if found
/// Right now we are assuming each user belongs to only one organization, however that can change in teh future.
pub async fn get_user_organization_id(user_id: &Uuid) -> Result<Option<Uuid>> {
    let mut conn = get_pg_pool().get().await?;

    let result = match users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .select(users_to_organizations::organization_id)
        .first::<Uuid>(&mut conn)
        .await
    {
        Ok(organization_id) => Some(organization_id),
        Err(diesel::NotFound) => None,
        Err(e) => return Err(e.into()),
    };

    Ok(result)
}
