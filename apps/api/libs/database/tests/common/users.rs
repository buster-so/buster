use database::enums::{SharingSetting, UserOrganizationRole};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Simplified version of AuthenticatedUser for testing
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthenticatedUser {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub role: UserOrganizationRole,
    pub sharing_setting: SharingSetting,
    pub edit_sql: bool,
    pub upload_csv: bool,
    pub export_assets: bool,
    pub email_slack_enabled: bool,
}

impl AuthenticatedUser {
    /// Creates a new mock authenticated user
    pub fn new(id: Uuid, organization_id: Uuid, role: UserOrganizationRole) -> Self {
        Self {
            id,
            organization_id,
            email: format!("user-{}@example.com", id),
            name: Some(format!("Test User {}", id)),
            role,
            sharing_setting: SharingSetting::None,
            edit_sql: true,
            upload_csv: true,
            export_assets: true,
            email_slack_enabled: true,
        }
    }
    
    /// Creates a new random authenticated user with the given role
    pub fn mock_with_role(role: UserOrganizationRole) -> Self {
        Self::new(Uuid::new_v4(), Uuid::new_v4(), role)
    }
    
    /// Creates a new random administrator user
    pub fn mock_admin() -> Self {
        Self::mock_with_role(UserOrganizationRole::WorkspaceAdmin)
    }
    
    /// Creates a new random data admin user
    pub fn mock_data_admin() -> Self {
        Self::mock_with_role(UserOrganizationRole::DataAdmin)
    }
    
    /// Creates a new random querier user
    pub fn mock_querier() -> Self {
        Self::mock_with_role(UserOrganizationRole::Querier)
    }
    
    /// Creates a new random restricted querier user
    pub fn mock_restricted_querier() -> Self {
        Self::mock_with_role(UserOrganizationRole::RestrictedQuerier)
    }
    
    /// Creates a new random viewer user
    pub fn mock_viewer() -> Self {
        Self::mock_with_role(UserOrganizationRole::Viewer)
    }
}