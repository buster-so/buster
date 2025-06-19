use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::types::AuthenticatedUser;
use uuid::Uuid;
use database::enums::UserOrganizationRole;

use database::{
    models::DataSource,
    pool::get_pg_pool,
    schema::data_sources,
    vault::delete_secret,
};

pub async fn delete_data_source_handler(
    user: &AuthenticatedUser,
    data_source_id: &Uuid,
) -> Result<()> {
    // Verify user has an organization
    if user.organizations.is_empty() {
        return Err(anyhow!("User is not a member of any organization"));
    }

    // Get the first organization (users can only belong to one organization currently)
    let user_org = &user.organizations[0];
    
    // Verify user has appropriate permissions (admin role)
    if user_org.role != UserOrganizationRole::WorkspaceAdmin && user_org.role != UserOrganizationRole::DataAdmin {
        return Err(anyhow!("User does not have appropriate permissions to delete data sources"));
    }

    let mut conn = get_pg_pool().get().await?;

    // Get the data source to verify it exists and belongs to the user's organization
    let _data_source = data_sources::table
        .filter(data_sources::id.eq(data_source_id))
        .filter(data_sources::organization_id.eq(user_org.id))
        .filter(data_sources::deleted_at.is_null())
        .first::<DataSource>(&mut conn)
        .await
        .map_err(|_| anyhow!("Data source not found or you don't have access to it"))?;

    // Soft delete the data source
    diesel::update(data_sources::table)
        .filter(data_sources::id.eq(data_source_id))
        .set(data_sources::deleted_at.eq(Some(Utc::now())))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Error deleting data source: {}", e))?;

    // Delete credentials from vault
    delete_secret(data_source_id)
        .await
        .map_err(|e| anyhow!("Error deleting credentials from vault: {}", e))?;

    Ok(())
}