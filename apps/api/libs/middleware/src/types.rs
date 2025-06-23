use chrono::{DateTime, Utc};
use database::enums::{TeamToUserRole, UserOrganizationRole};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrganizationMembership {
    pub id: Uuid,
    pub role: UserOrganizationRole,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TeamMembership {
    pub id: Uuid,
    pub role: TeamToUserRole,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthenticatedUser {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    #[serde(skip_serializing)]
    pub config: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub attributes: Value,
    pub avatar_url: Option<String>,
    pub organizations: Vec<OrganizationMembership>,
    pub teams: Vec<TeamMembership>,
} 