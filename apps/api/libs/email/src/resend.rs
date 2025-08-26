use anyhow::Result;
use secrets::get_secret_sync;
use std::collections::HashSet;
use uuid::Uuid;
use html_escape::encode_text as escape_html;

use resend_rs::{types::CreateEmailBaseOptions, Resend};

lazy_static::lazy_static! {
    // These are loaded from secrets module
    static ref RESEND_API_KEY: String = get_secret_sync("RESEND_API_KEY")
        .expect("RESEND_API_KEY must be set in environment or loaded via init_secrets");
    static ref RESEND_CLIENT: Resend = Resend::new(&RESEND_API_KEY);
    static ref BUSTER_URL: String = get_secret_sync("BUSTER_URL")
        .expect("BUSTER_URL must be set in environment or loaded via init_secrets");
}

#[derive(Debug, Clone)] // Added derives for potential broader use
pub struct CollectionInvite {
    pub collection_name: String,
    pub collection_id: Uuid,
    pub inviter_name: String,
    pub new_user: bool,
}

#[derive(Debug, Clone)]
pub struct DashboardInvite {
    pub dashboard_name: String,
    pub dashboard_id: Uuid,
    pub inviter_name: String,
    pub new_user: bool,
}

#[derive(Debug, Clone)]
pub struct ThreadInvite {
    pub thread_name: String,
    pub thread_id: Uuid,
    pub inviter_name: String,
    pub new_user: bool,
}

#[derive(Debug, Clone)]
pub struct InviteToBuster {
    pub inviter_name: String,
    pub organization_name: String,
}

#[derive(Debug, Clone)] // Added derives
pub enum EmailType {
    CollectionInvite(CollectionInvite),
    DashboardInvite(DashboardInvite),
    ThreadInvite(ThreadInvite),
    InviteToBuster(InviteToBuster),
}

struct EmailParams {
    subject: String,
    message: String,
    button_link: String,
    button_text: &'static str,
}

// Adjusted path for include_str!
const EMAIL_TEMPLATE: &'static str = include_str!("email_template.html");

pub async fn send_email(to_addresses: HashSet<String>, email_type: EmailType) -> Result<()> {
    let email_params = match email_type {
        EmailType::CollectionInvite(collection_invite) => {
            create_collection_invite_params(collection_invite)
        }
        EmailType::DashboardInvite(dashboard_invite) => {
            create_dashboard_invite_params(dashboard_invite)
        }
        EmailType::ThreadInvite(thread_invite) => create_thread_invite_params(thread_invite),
        EmailType::InviteToBuster(invite_to_buster) => {
            create_invite_to_buster_params(invite_to_buster)
        }
    };

    let email_html = EMAIL_TEMPLATE
        .replace("{{message}}", &escape_html(&email_params.message))
        .replace("{{button_link}}", &email_params.button_link)
        .replace("{{button_text}}", &escape_html(email_params.button_text));

    let from = "Buster <buster@mail.buster.so>";

    // Consider error handling or collecting results if sending individual emails fails
    for to_address in to_addresses {
        let email =
            CreateEmailBaseOptions::new(from, vec![to_address.clone()], email_params.subject.clone())
                .with_html(&email_html);

        // Cloning client and email for the spawned task
        let client = RESEND_CLIENT.clone();
        tokio::spawn(async move {
            match client.emails.send(email).await {
                Ok(_) => (),
                Err(e) => {
                    // Use structured logging
                    tracing::error!(error = %e, email_recipient = %to_address, "Error sending email");
                }
            }
        });
    }

    Ok(())
}

fn create_collection_invite_params(collection_invite: CollectionInvite) -> EmailParams {
    match collection_invite.new_user {
        true => EmailParams {
            subject: format!(
                "{inviter_name} has shared {collection_name} with you",
                inviter_name = collection_invite.inviter_name,
                collection_name = collection_invite.collection_name
            ),
            message: format!(
                "{inviter_name} has shared {collection_name} with you. To view this collection, please create an account.",
                inviter_name = collection_invite.inviter_name,
                collection_name = collection_invite.collection_name
            ),
            button_link: format!(
                "{}/auth/login?collection_id={collection_id}",
                *BUSTER_URL,
                collection_id = collection_invite.collection_id
            ),
            button_text: "Create account",
        },
        false => EmailParams {
            subject: format!(
                "{inviter_name} has shared {collection_name} with you",
                inviter_name = collection_invite.inviter_name,
                collection_name = collection_invite.collection_name
            ),
            message: format!(
                "{inviter_name} has shared {collection_name} with you",
                inviter_name = collection_invite.inviter_name,
                collection_name = collection_invite.collection_name
            ),
            button_link: format!(
                "{}/app/collections/{collection_id}",
                *BUSTER_URL,
                collection_id = collection_invite.collection_id
            ),
            button_text: "View Collection",
        },
    }
}

fn create_dashboard_invite_params(dashboard_invite: DashboardInvite) -> EmailParams {
    match dashboard_invite.new_user {
        true => EmailParams {
            subject: format!(
                "{inviter_name} has invited you to {dashboard_name}",
                inviter_name = dashboard_invite.inviter_name,
                dashboard_name = dashboard_invite.dashboard_name
            ),
            message: format!(
                "{inviter_name} has shared {dashboard_name} with you. To view this dashboard, please create an account.",
                inviter_name = dashboard_invite.inviter_name,
                dashboard_name = dashboard_invite.dashboard_name
            ),
            button_link: format!(
                "{}/auth/login?dashboard_id={dashboard_id}",
                *BUSTER_URL,
                dashboard_id = dashboard_invite.dashboard_id
            ),
            button_text: "Create account",
        },
        false => EmailParams {
            subject: format!(
                "{inviter_name} has shared {dashboard_name} with you",
                inviter_name = dashboard_invite.inviter_name,
                dashboard_name = dashboard_invite.dashboard_name
            ),
            message: format!(
                "{inviter_name} has shared {dashboard_name} with you",
                inviter_name = dashboard_invite.inviter_name,
                dashboard_name = dashboard_invite.dashboard_name
            ),
            button_link: format!(
                "{}/app/dashboards/{dashboard_id}",
                *BUSTER_URL,
                dashboard_id = dashboard_invite.dashboard_id
            ),
            button_text: "View Dashboard",
        },
    }
}

fn create_thread_invite_params(thread_invite: ThreadInvite) -> EmailParams {
    match thread_invite.new_user {
        true => EmailParams {
            subject: format!(
                "{inviter_name} has invited you to view the metric: {thread_name}",
                inviter_name = thread_invite.inviter_name,
                thread_name = thread_invite.thread_name
            ),
            message: format!(
                "{inviter_name} has shared the metric: '{thread_name}' with you. To view this metric, please create an account.",
                inviter_name = thread_invite.inviter_name,
                thread_name = thread_invite.thread_name
            ),
            button_link: format!(
                "{}/auth/login?metric_id={thread_id}",
                *BUSTER_URL,
                thread_id = thread_invite.thread_id
            ),
            button_text: "Create account",
        },
        false => EmailParams {
            subject: format!(
                "{inviter_name} has shared the metric: '{thread_name}' with you",
                inviter_name = thread_invite.inviter_name,
                thread_name = thread_invite.thread_name
            ),
            message: format!(
                "{inviter_name} has shared the metric: '{thread_name}' with you",
                inviter_name = thread_invite.inviter_name,
                thread_name = thread_invite.thread_name
            ),
            button_link: format!(
                "{}/app/metrics/{thread_id}",
                *BUSTER_URL,
                thread_id = thread_invite.thread_id
            ),
            button_text: "View Metric",
        },
    }
}

fn create_invite_to_buster_params(invite_to_buster: InviteToBuster) -> EmailParams {
    EmailParams {
        subject: format!(
            "{inviter_name} has invited you to the {organization_name} workspace on Buster",
            inviter_name = invite_to_buster.inviter_name,
            organization_name = invite_to_buster.organization_name
        ),
        message: format!(
            "{inviter_name} has invited you to the {organization_name} workspace on Buster. Click the button below to sign in.",
            inviter_name = invite_to_buster.inviter_name,
            organization_name = invite_to_buster.organization_name
        ),
        button_link: format!(
            "{}/auth/login",
            *BUSTER_URL,
        ),
        button_text: "Sign in",
    }
}

// Tests are moved to libs/email/tests/resend_tests.rs 