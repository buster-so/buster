use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType},
    models::Collection,
};
use diesel::AsChangeset;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterShareIndividual {
    pub email: String,
    pub role: AssetPermissionRole,
    pub name: Option<String>,
}

// List collections types
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListCollectionsFilter {
    pub shared_with_me: Option<bool>,
    pub owned_by_me: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListCollectionsRequest {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    #[serde(flatten)]
    pub filters: Option<ListCollectionsFilter>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListCollectionsUser {
    pub id: Uuid,
    pub name: String,
    pub avatar_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListCollectionsCollection {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub last_edited: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub owner: ListCollectionsUser,
    pub is_shared: bool,
    // TODO implement member
}

// Get collection types
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetCollectionRequest {
    pub id: Uuid,
}

// Collection state types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetUser {
    pub name: Option<String>,
    pub email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionAsset {
    pub id: Uuid,
    pub name: String,
    pub created_by: AssetUser,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub asset_type: AssetType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionState {
    #[serde(flatten)]
    pub collection: Collection,
    pub permission: AssetPermissionRole,
    pub organization_permissions: bool,
    pub assets: Option<Vec<CollectionAsset>>,
    // Sharing fields
    pub individual_permissions: Option<Vec<BusterShareIndividual>>,
    pub publicly_accessible: bool,
    pub public_expiry_date: Option<DateTime<Utc>>,
    pub public_enabled_by: Option<String>,
    pub public_password: Option<String>,
}

// Create collection types
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateCollectionRequest {
    pub name: String,
    pub description: Option<String>,
}

// Update collection types
#[derive(Debug, Clone, Deserialize, Serialize, AsChangeset)]
#[diesel(table_name = database::schema::collections)]
pub struct UpdateCollectionObject {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UpdateCollectionAssetsRequest {
    pub id: Uuid,
    #[serde(rename = "type")]
    pub type_: AssetType,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UpdateCollectionRequest {
    #[serde(flatten)]
    pub collection: Option<UpdateCollectionObject>,
}

// Delete collection types
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeleteCollectionRequest {
    pub ids: Vec<Uuid>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeleteCollectionResponse {
    pub ids: Vec<Uuid>,
}