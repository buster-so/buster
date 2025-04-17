use anyhow::{Context, Result};
use chrono::Utc;
use database::{
    enums::{SharingSetting, UserOrganizationRole, UserOrganizationStatus},
    models::{Organization, UserToOrganization},
    pool::get_pg_pool,
    schema::{organizations, users_to_organizations},
};
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Creates a new organization and adds the creating user as a WorkspaceAdmin.
pub async fn post_organization_handler(
    name: String,
    user: AuthenticatedUser,
) -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .context("Failed to get database connection")?;

    let now = Utc::now();
    let new_org_id = Uuid::new_v4();

    // Create the new organization
    let new_organization = Organization {
        id: new_org_id,
        name: name.clone(),
        domain: None, // Domain can be updated later if needed
        created_at: now,
        updated_at: now,
        deleted_at: None,
    };

    insert_into(organizations::table)
        .values(&new_organization)
        .execute(&mut conn)
        .await
        .context("Failed to insert new organization")?;

    // Add the user to the organization as WorkspaceAdmin
    let user_to_org = UserToOrganization {
        user_id: user.id,
        organization_id: new_org_id,
        role: UserOrganizationRole::WorkspaceAdmin,
        // Set sensible defaults for a new organization admin
        sharing_setting: SharingSetting::Team, // Default setting
        edit_sql: true,
        upload_csv: true,
        export_assets: true,
        email_slack_enabled: true, // Default setting
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
        deleted_by: None,
        status: UserOrganizationStatus::Active,
    };

    insert_into(users_to_organizations::table)
        .values(&user_to_org)
        .execute(&mut conn)
        .await
        .context("Failed to add user to new organization")?;

    tracing::info!(
        "Created organization {} ({}) and added user {} as admin.",
        name,
        new_org_id,
        user.id
    );

    Ok(())
} 