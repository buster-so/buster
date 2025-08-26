use reqwest::{Client, Error};
use secrets::SupabaseConfig;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Structs for JSON payloads and responses
#[derive(Serialize, Deserialize, Debug)]
struct CreateUserRequest {
    id: String,
    email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    email_confirm: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
struct InviteRequest {
    email: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct RecoverRequest {
    email: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct UpdateUserRequest {
    password: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    pub id: String,
    pub email: String,
    pub aud: String,
    pub role: String,
    pub created_at: String,
    pub updated_at: String,
    pub email_confirmed_at: Option<String>,
}

// Main Supabase client struct
pub struct SupabaseClient {
    url: String,
    service_role_key: String,
    client: Client,
}

impl SupabaseClient {
    // Initialize the client with env variables
    pub async fn new() -> Result<Self, anyhow::Error> {
        let config = SupabaseConfig::from_secrets().await?;

        Ok(Self {
            url: config.url,
            service_role_key: config.service_role_key,
            client: Client::new(),
        })
    }

    // 1. Create a new user with a specific ID
    pub async fn create_user(&self, id: Uuid, email: &str) -> Result<User, Error> {
        let payload = CreateUserRequest {
            id: id.to_string(),
            email: email.to_string(),
            email_confirm: Some(false), // Email unconfirmed initially
        };

        let response = self
            .client
            .post(format!("{}/auth/v1/admin/users", self.url))
            .header("Authorization", format!("Bearer {}", self.service_role_key))
            .header("Content-Type", "application/json")
            .header("apikey", &self.service_role_key)
            .json(&payload)
            .send()
            .await?;

        let user = response.json::<User>().await?;
        Ok(user)
    }

    // 2. Send a verification email
    pub async fn send_verification_email(&self, email: &str) -> Result<(), Error> {
        let payload = InviteRequest {
            email: email.to_string(),
        };

        self.client
            .post(format!("{}/auth/v1/invite", self.url))
            .header("Authorization", format!("Bearer {}", self.service_role_key))
            .header("Content-Type", "application/json")
            .header("apikey", &self.service_role_key)
            .json(&payload)
            .send()
            .await?;

        Ok(())
    }

    // 3a. Trigger a password reset email (for user to set password)
    pub async fn send_password_reset_email(&self, email: &str) -> Result<(), Error> {
        let payload = RecoverRequest {
            email: email.to_string(),
        };

        self.client
            .post(format!("{}/auth/v1/recover", self.url))
            .header("Authorization", format!("Bearer {}", self.service_role_key))
            .header("Content-Type", "application/json")
            .header("apikey", &self.service_role_key)
            .json(&payload)
            .send()
            .await?;

        Ok(())
    }

    // 3b. Update user password (simulating user action with recovery token)
    pub async fn update_user_password(&self, recovery_token: &str, password: &str) -> Result<(), Error> {
        let payload = UpdateUserRequest {
            password: password.to_string(),
        };

        self.client
            .put(format!("{}/auth/v1/user", self.url))
            .header("Authorization", format!("Bearer {}", recovery_token))
            .header("Content-Type", "application/json")
            .header("apikey", &self.service_role_key)
            .json(&payload)
            .send()
            .await?;

        Ok(())
    }
}

// Example usage in a main function (for testing)
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_supabase_client() {
        dotenv::dotenv().ok();
        let client = SupabaseClient::new().expect("Failed to initialize client");

        // 1. Create a user
        let user_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let user = client.create_user(user_id, "newuser@example.com").await.unwrap();
        println!("Created user: {:?}", user);

        // 2. Send verification email
        client.send_verification_email("newuser@example.com").await.unwrap();
        println!("Verification email sent. Check Inbucket at http://localhost:54324");

        // 3. Simulate password reset (manual token extraction needed from email)
        client.send_password_reset_email("newuser@example.com").await.unwrap();
        println!("Password reset email sent. Check Inbucket for recovery token");

        // Normally, you'd extract the recovery token from the email and pass it here
        // For testing, you'd need to manually get it from Inbucket
        // client.update_user_password("<recovery-token>", "newsecurepassword123").await.unwrap();
    }
}