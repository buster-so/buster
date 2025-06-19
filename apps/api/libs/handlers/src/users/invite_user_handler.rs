use anyhow::{Context, Result};
use chrono::Utc;
use database::{
    self,
    enums::{SharingSetting, UserOrganizationRole, UserOrganizationStatus},
    models::{Organization, User, UserToOrganization},
    pool::get_pg_pool,
    schema::{organizations, users, users_to_organizations},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use email::{send_email, EmailType, InviteToBuster};
use middleware::AuthenticatedUser;
use serde_json::json;
use std::collections::HashSet;
use tracing;
use uuid::Uuid;

/// Invites multiple users by creating user records, adding them to the inviter's organization,
/// and sending an invitation email.
pub async fn invite_user_handler(
    inviting_user: &AuthenticatedUser,
    emails: Vec<String>,
) -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .context("Failed to get database connection")?;

    // Fetch inviter details
    let inviter = users::table
        .filter(users::id.eq(inviting_user.id)) // Find the specific user
        .select(User::as_select())
        .first::<User>(&mut conn)
        .await
        .context("Failed to find inviting user")?;
    let inviter_name = inviter.name.unwrap_or_else(|| inviter.email.clone()); // Use email if name is None

    let organization_id = inviting_user
        .organizations
        .get(0)
        .map(|m| m.id)
        .context("Inviting user is not associated with any organization")?;

    // Fetch organization details
    let organization = organizations::table
        .filter(organizations::id.eq(organization_id)) // Find the specific organization
        .first::<Organization>(&mut conn)
        .await
        .context("Failed to find organization")?;
    let organization_name = organization.name;

    let inviter_id = inviting_user.id;
    let now = Utc::now();
    let mut successful_emails: Vec<String> = Vec::new();
    let assigned_role = UserOrganizationRole::RestrictedQuerier; // Define role once

    for email in emails {
        // Use a separate connection for each user to avoid holding one connection for the whole loop
        let mut user_conn = match pool.get().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!(error = %e, email = %email, "Failed to get DB connection for inviting user");
                continue; // Skip this user if connection fails
            }
        };

        let email_for_lookup = email.clone(); // Clone email for lookup/use
        let existing_user_result = users::table
            .filter(users::email.eq(&email_for_lookup))
            .select(User::as_select())
            .first::<User>(&mut user_conn)
            .await;

        let user_id: Uuid;
        let user_email_for_attributes: String;

        match existing_user_result {
            Ok(user) => {
                // User exists, use their ID
                user_id = user.id;
                user_email_for_attributes = user.email; // Use existing user's email
                tracing::info!(email = %user_email_for_attributes, user_id = %user_id, "User already exists, using existing ID for organization association.");
            }
            Err(diesel::NotFound) => {
                // User does not exist, create them
                let new_user_id = Uuid::new_v4();
                user_email_for_attributes = email.clone(); // Use the email from the loop input

                // Attributes for the new user
                let user_attributes = json!({
                  "user_id": new_user_id.to_string(),
                  "user_email": user_email_for_attributes,
                  "organization_id": organization_id.to_string(),
                  "organization_role": format!("{:?}", assigned_role) // Use pre-defined role
                });

                let user_to_insert = User {
                    id: new_user_id,
                    email: email.clone(), // Use email from loop input
                    name: None,
                    config: json!({}),
                    created_at: now,
                    updated_at: now,
                    attributes: user_attributes,
                    avatar_url: None,
                };

                // Insert the new user
                match diesel::insert_into(users::table)
                    .values(&user_to_insert)
                    .execute(&mut user_conn)
                    .await
                {
                    Ok(_) => {
                        user_id = new_user_id; // Assign the new ID
                        tracing::info!(email = %email, user_id = %user_id, "Successfully inserted new user.");
                    }
                    Err(e) => {
                        // Handle unexpected insertion errors (e.g., DB connection issue mid-operation)
                        tracing::error!(error = %e, email = %email, "Failed to insert non-existent user record");
                        continue; // Skip this user if insertion fails unexpectedly
                    }
                }
            }
            Err(e) => {
                // Other database error during lookup
                tracing::error!(error = %e, email = %email, "Failed to query for existing user");
                continue; // Skip this user
            }
        };

        // At this point, user_id is set (either existing or newly created)
        // Attempt to add the user to the organization, ignoring conflicts

        let user_org_to_insert = UserToOrganization {
            user_id, // Use the determined user_id
            organization_id,
            role: assigned_role, // Use pre-defined role
            sharing_setting: SharingSetting::None,
            edit_sql: false,
            upload_csv: false,
            export_assets: false,
            email_slack_enabled: false,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by: inviter_id,
            updated_by: inviter_id,
            deleted_by: None,
            status: UserOrganizationStatus::Active,
        };

        // Insert user organization mapping with ON CONFLICT DO NOTHING
        let user_org_insert_result = diesel::insert_into(users_to_organizations::table)
            .values(&user_org_to_insert)
            .on_conflict((
                users_to_organizations::user_id,
                users_to_organizations::organization_id,
            ))
            .do_nothing() // If user is already in the org, do nothing
            .execute(&mut user_conn)
            .await;

        match user_org_insert_result {
            Ok(rows_affected) => {
                // User was either newly inserted or already existed in the org.
                // The association is now confirmed.
                if rows_affected > 0 {
                    tracing::info!(email = %email, user_id = %user_id, organization_id = %organization_id, "Successfully associated user with organization.");
                } else {
                    tracing::info!(email = %email, user_id = %user_id, organization_id = %organization_id, "User association with organization already existed.");
                }
                successful_emails.push(email); // Use the original email from the loop input
            }
            Err(e) => {
                // Handle unexpected insertion errors for the join table
                tracing::error!(error = %e, email = %email, user_id = %user_id, "Failed unexpectedly while inserting or ignoring user_to_organization record");
                // Don't add to successful_emails if the DB operation failed unexpectedly
            }
        };
    }

    // 6. Send batch email if there were any successful invites
    if !successful_emails.is_empty() {
        let invite_details = InviteToBuster {
            inviter_name,      // Use fetched inviter name
            organization_name, // Use fetched organization name
        };

        let emails_set: HashSet<String> = successful_emails.into_iter().collect();

        if let Err(e) = send_email(emails_set, EmailType::InviteToBuster(invite_details)).await {
            // Log the error but don't fail the entire handler,
            // as the core user creation logic succeeded.
            tracing::error!(error = %e, "Failed to send invitation emails");
            // Optionally, return a specific error or warning here if needed.
        } else {
            tracing::info!("Successfully sent invitation emails");
        }
    }

    Ok(())
}
