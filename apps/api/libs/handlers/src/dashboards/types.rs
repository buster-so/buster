use std::collections::HashMap;

use chrono::{DateTime, Utc};
use database::enums::{AssetPermissionRole, Verification, WorkspaceSharing};
use serde::{Deserialize, Deserializer, Serialize};
use uuid::Uuid;

use crate::metrics::types::{BusterMetric, Version};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterDashboardListItem {
    pub created_at: DateTime<Utc>,
    pub id: Uuid,
    pub last_edited: DateTime<Utc>,
    pub members: Vec<DashboardMember>,
    pub name: String,
    pub owner: DashboardMember,
    pub status: Verification,
    pub is_shared: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardMember {
    pub avatar_url: Option<String>,
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterShareIndividual {
    pub email: String,
    pub role: AssetPermissionRole,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}

// Note: This extends BusterShare which needs to be defined
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterDashboardResponse {
    pub access: AssetPermissionRole,
    pub metrics: HashMap<Uuid, BusterMetric>,
    pub dashboard: BusterDashboard,
    pub permission: AssetPermissionRole,
    pub public_password: Option<String>,
    pub collections: Vec<DashboardCollection>,
    // New sharing fields
    pub individual_permissions: Option<Vec<BusterShareIndividual>>,
    pub publicly_accessible: bool,
    pub public_expiry_date: Option<DateTime<Utc>>,
    pub public_enabled_by: Option<String>,
    // Workspace sharing fields
    pub workspace_sharing: WorkspaceSharing,
    pub workspace_sharing_enabled_by: Option<String>,
    pub workspace_sharing_enabled_at: Option<DateTime<Utc>>,
    // Versioning field
    pub versions: Vec<Version>,
    // Workspace member count
    pub workspace_member_count: i64,
}

// Note: This extends BusterShare but omits certain fields
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterDashboard {
    pub config: DashboardConfig,
    pub created_at: DateTime<Utc>,
    pub created_by: Uuid,
    pub description: Option<String>,
    pub id: Uuid,
    pub name: String,
    pub updated_at: Option<DateTime<Utc>>,
    pub updated_by: Uuid,
    pub status: Verification,
    pub version_number: i32,
    pub file: String, // yaml file
    pub file_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardCollection {
    pub id: String,
    pub name: String,
}

// Note: This is a placeholder for DashboardConfig which needs to be defined based on your specific needs
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DashboardConfig {
    pub rows: Vec<DashboardRow>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DashboardRow {
    #[serde(deserialize_with = "deserialize_string_or_number")]
    pub id: String,
    pub items: Vec<DashboardRowItem>,
    #[serde(alias = "rowHeight", skip_serializing_if = "Option::is_none")]
    pub row_height: Option<u32>,
    #[serde(alias = "columnSizes", skip_serializing_if = "Option::is_none")]
    pub column_sizes: Option<Vec<u32>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DashboardRowItem {
    pub id: String,
}

/// Custom deserializer that accepts either a string or a number and converts to string
fn deserialize_string_or_number<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::{self, Visitor};
    use std::fmt;

    struct StringOrNumberVisitor;

    impl<'de> Visitor<'de> for StringOrNumberVisitor {
        type Value = String;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a string or a number")
        }

        fn visit_str<E>(self, value: &str) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(value.to_string())
        }

        fn visit_string<E>(self, value: String) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(value)
        }

        fn visit_u64<E>(self, value: u64) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(value.to_string())
        }

        fn visit_i64<E>(self, value: i64) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(value.to_string())
        }

        fn visit_f64<E>(self, value: f64) -> Result<String, E>
        where
            E: de::Error,
        {
            // Handle floats that are actually integers
            if value.fract() == 0.0 {
                Ok((value as i64).to_string())
            } else {
                Ok(value.to_string())
            }
        }
    }

    deserializer.deserialize_any(StringOrNumberVisitor)
}
