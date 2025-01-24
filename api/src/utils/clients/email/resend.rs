use anyhow::Result;
use std::{collections::HashSet, env};
use uuid::Uuid;
use html_escape::encode_text as escape_html;

use resend_rs::{types::CreateEmailBaseOptions, Resend};

use crate::utils::clients::sentry_utils::send_sentry_error;

lazy_static::lazy_static! {
    static ref RESEND_API_KEY: String = env::var("RESEND_API_KEY").expect("RESEND_API_KEY must be set");
    static ref RESEND_CLIENT: Resend = Resend::new(&RESEND_API_KEY);
    static ref BUSTER_URL: String = env::var("BUSTER_URL").expect("BUSTER_URL must be set");
}

pub struct CollectionInvite {
    pub collection_name: String,
    pub collection_id: Uuid,
    pub inviter_name: String,
    pub new_user: bool,
}

pub struct DashboardInvite {
    pub dashboard_name: String,
    pub dashboard_id: Uuid,
    pub inviter_name: String,
    pub new_user: bool,
}

pub struct ThreadInvite {
    pub thread_name: String,
    pub thread_id: Uuid,
    pub inviter_name: String,
    pub new_user: bool,
}

pub struct InviteToBuster {
    pub inviter_name: String,
    pub organization_name: String,
}

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

    for to_address in to_addresses {
        let email =
            CreateEmailBaseOptions::new(from, vec![to_address], email_params.subject.clone())
                .with_html(&email_html);

        tokio::spawn(async move {
            match RESEND_CLIENT.emails.send(email).await {
                Ok(_) => (),
                Err(e) => {
                    tracing::error!("Error sending email: {e}");
                    send_sentry_error(&format!("Error sending email: {e}"), None)
                }
            }
        });
    }

    Ok(())
}

fn create_collection_invite_params(collection_invite: CollectionInvite) -> EmailParams {
    let email_params = match collection_invite.new_user {
        true => EmailParams {
            subject: format!(
                "{invitee_name} has shared {collection_name} with you",
                invitee_name = collection_invite.inviter_name,
                collection_name = collection_invite.collection_name
            ),
            message: format!(
                "{invitee_name} has shared {collection_name} with you.  To view this collection, please create an account.",
                invitee_name = collection_invite.inviter_name,
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
                "{invitee_name} has shared {collection_name} with you",
                invitee_name = collection_invite.inviter_name,
                collection_name = collection_invite.collection_name
            ),
            message: format!(
                "{invitee_name} has shared {collection_name} with you",
                invitee_name = collection_invite.inviter_name,
                collection_name = collection_invite.collection_name
            ),
            button_link: format!(
                "{}/app/collections/{collection_id}",
                *BUSTER_URL,
                collection_id = collection_invite.collection_id
            ),
            button_text: "View Collection",
        },
    };

    email_params
}

fn create_dashboard_invite_params(dashboard_invite: DashboardInvite) -> EmailParams {
    let email_params = match dashboard_invite.new_user {
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
    };

    email_params
}

fn create_thread_invite_params(thread_invite: ThreadInvite) -> EmailParams {
    let email_params = match thread_invite.new_user {
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
    };

    email_params
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

#[cfg(test)]
mod tests {
    use super::*;
    use dotenv::dotenv;

    #[tokio::test]
    async fn test_send_email_to_existing_users() {
        dotenv().ok();
        let to_addresses = HashSet::from([
            "dallin@buster.so".to_string(),
        ]);
        let email_type = EmailType::CollectionInvite(CollectionInvite {
            collection_name: "Test Collection <script>alert('xss')</script>".to_string(),
            collection_id: Uuid::new_v4(),
            inviter_name: "Dallin Bentley <b>test</b>".to_string(),
            new_user: false,
        });

        match send_email(to_addresses, email_type).await {
            Ok(_) => assert!(true),
            Err(e) => {
                println!("Error sending email: {e}");
                assert!(false)
            }
        }
    }

    #[tokio::test]
    async fn test_send_email_to_new_users() {
        dotenv().ok();
        let to_addresses = HashSet::from([
            "dallin@buster.so".to_string(),
        ]);
        let email_type = EmailType::CollectionInvite(CollectionInvite {
            collection_name: "Test Collection".to_string(),
            collection_id: Uuid::new_v4(),
            inviter_name: "Dallin Bentley".to_string(),
            new_user: true,
        });

        match send_email(to_addresses, email_type).await {
            Ok(_) => assert!(true),
            Err(e) => {
                println!("Error sending email: {e}");
                assert!(false)
            }
        }
    }
}
