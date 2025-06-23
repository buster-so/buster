use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
pub struct UpdateOrganizationRequest {
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct OrganizationResponse {
    pub id: Uuid,
    pub name: String,
}