use anyhow::{anyhow, Result};
use diesel::{update, ExpressionMethods};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use database::{
    enums::UserOrganizationRole,
    pool::get_pg_pool,
    schema::organizations,
};

use crate::organizations::types::{OrganizationResponse, UpdateOrganizationRequest};
use middleware::AuthenticatedUser;

pub async fn update_organization_handler(
    user: &AuthenticatedUser,
    organization_id: Uuid,
    payload: UpdateOrganizationRequest,
) -> Result<OrganizationResponse> {
    // Verify user is a member of the organization
    let user_org = user.organizations.iter()
        .find(|org| org.id == organization_id)
        .ok_or_else(|| anyhow!("User is not a member of this organization"))?;
    
    // Verify user has WorkspaceAdmin role
    if user_org.role != UserOrganizationRole::WorkspaceAdmin {
        return Err(anyhow!("User is not a workspace admin"));
    }

    let mut conn = get_pg_pool().get().await?;

    // Update organization name if provided
    let name = if let Some(name) = payload.name.as_ref() {
        update(organizations::table)
            .filter(organizations::id.eq(organization_id))
            .set(organizations::name.eq(name))
            .execute(&mut conn)
            .await?;
        name.clone()
    } else {
        // This should never happen if we validate at the API level
        return Err(anyhow!("Name is required for update"));
    };

    // Return updated organization
    Ok(OrganizationResponse {
        id: organization_id,
        name,
    })
}