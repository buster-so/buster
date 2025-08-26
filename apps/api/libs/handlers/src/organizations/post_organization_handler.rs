use anyhow::{Context, Result};
use secrets::get_secret_sync_or_default;
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
use posthog_rs::{client, ClientOptions, ClientOptionsBuilder, Event};
use uuid::Uuid;

/// Creates a new organization and adds the creating user as a WorkspaceAdmin.
pub async fn post_organization_handler(name: String, user: AuthenticatedUser) -> Result<()> {
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
        payment_required: true,
        domains: None,
        restrict_new_user_invitations: false,
        default_role: UserOrganizationRole::RestrictedQuerier,
        organization_color_palettes: serde_json::json!({
            "selectedId": null,
            "palettes": []
        }),
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

    if get_secret_sync_or_default("TELEMETRY_ENABLED", "") == "true" {
        let user_domain = user.email.split('@').last().unwrap_or_default().to_string();
        let user_company_name = new_organization.name.clone();
        tokio::spawn(async move {
            let posthog_telemetry_key = get_secret_sync_or_default("POSTHOG_TELEMETRY_KEY", "");
            let client_options = match ClientOptionsBuilder::default()
                .api_key(posthog_telemetry_key)
                .api_endpoint("https://us.i.posthog.com/capture".to_string())
                .build()
            {
                Ok(client_options) => client_options,
                Err(e) => {
                    tracing::error!("Failed to create client options: {}", e);
                    return;
                }
            };

            let client = client(client_options).await;

            let mut event = Event::new("New Company Signup", &user.id.to_string());

            let _ = event
                .insert_prop("User Domain", &user_domain)
                .map_err(|e| {
                    tracing::error!("Failed to insert user domain: {}", e);
                    e
                });
            let _ = event
                .insert_prop("User Company Name", &user_company_name)
                .map_err(|e| {
                    tracing::error!("Failed to insert user company name: {}", e);
                    e
                });

            match client.capture(event).await {
                Ok(_) => {}
                Err(e) => {
                    tracing::error!("Failed to capture event: {}", e);
                }
            }
        });
    }

    Ok(())
}
