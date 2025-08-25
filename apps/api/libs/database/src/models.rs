use crate::enums::*;
use crate::schema::*;
use crate::types::*;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Queryable, Insertable, Identifiable, Associations, Debug)]
#[diesel(belongs_to(User, foreign_key = owner_id))]
#[diesel(table_name = api_keys)]
pub struct ApiKey {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub key: String,
    pub organization_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Identifiable, Debug, Clone, Serialize)]
#[diesel(table_name = dashboard_files)]
pub struct DashboardFile {
    pub id: Uuid,
    pub name: String,
    pub file_name: String,
    pub content: DashboardYml,
    pub filter: Option<String>,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub publicly_accessible: bool,
    pub publicly_enabled_by: Option<Uuid>,
    pub public_expiry_date: Option<DateTime<Utc>>,
    pub version_history: VersionHistory,
    pub public_password: Option<String>,
    pub workspace_sharing: WorkspaceSharing,
    pub workspace_sharing_enabled_by: Option<Uuid>,
    pub workspace_sharing_enabled_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Identifiable, Associations, Debug, Clone, Serialize)]
#[diesel(belongs_to(User, foreign_key = created_by))]
#[diesel(table_name = messages)]
pub struct Message {
    pub id: Uuid,
    pub request_message: Option<String>,
    pub response_messages: Value,
    pub reasoning: Value,
    pub title: String,
    pub raw_llm_messages: Value,
    pub final_reasoning_message: Option<String>,
    pub chat_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub feedback: Option<String>,
    pub is_completed: bool,
    pub post_processing_message: Option<Value>,
}

#[derive(Queryable, Insertable, Debug, Clone)]
#[diesel(table_name = messages_to_files)]
pub struct MessageToFile {
    pub id: Uuid,
    pub message_id: Uuid,
    pub file_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub is_duplicate: bool,
    pub version_number: i32,
}

#[derive(Queryable, Insertable, Identifiable, Debug, Clone, Serialize)]
#[diesel(table_name = metric_files)]
pub struct MetricFile {
    pub id: Uuid,
    pub name: String,
    pub file_name: String,
    pub content: MetricYml,
    pub verification: Verification,
    pub evaluation_obj: Option<Value>,
    pub evaluation_summary: Option<String>,
    pub evaluation_score: Option<f64>,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub publicly_accessible: bool,
    pub publicly_enabled_by: Option<Uuid>,
    pub public_expiry_date: Option<DateTime<Utc>>,
    pub version_history: VersionHistory,
    pub data_metadata: Option<DataMetadata>,
    pub public_password: Option<String>,
    pub data_source_id: Uuid,
    pub workspace_sharing: WorkspaceSharing,
    pub workspace_sharing_enabled_by: Option<Uuid>,
    pub workspace_sharing_enabled_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Identifiable, Debug, Clone, Serialize)]
#[diesel(table_name = report_files)]
pub struct ReportFile {
    pub id: Uuid,
    pub name: String,
    pub content: String,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub publicly_accessible: bool,
    pub publicly_enabled_by: Option<Uuid>,
    pub public_expiry_date: Option<DateTime<Utc>>,
    pub version_history: VersionHistory,
    pub public_password: Option<String>,
    pub workspace_sharing: WorkspaceSharing,
    pub workspace_sharing_enabled_by: Option<Uuid>,
    pub workspace_sharing_enabled_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Identifiable, Associations, Debug, Clone, Serialize)]
#[diesel(belongs_to(Organization))]
#[diesel(belongs_to(User, foreign_key = created_by))]
#[diesel(table_name = chats)]
pub struct Chat {
    pub id: Uuid,
    pub title: String,
    pub organization_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub publicly_accessible: bool,
    pub publicly_enabled_by: Option<Uuid>,
    pub public_expiry_date: Option<DateTime<Utc>>,
    pub most_recent_file_id: Option<Uuid>,
    pub most_recent_file_type: Option<String>,
    pub most_recent_version_number: Option<i32>,
    pub workspace_sharing: WorkspaceSharing,
    pub workspace_sharing_enabled_by: Option<Uuid>,
    pub workspace_sharing_enabled_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(PermissionGroup, foreign_key = permission_group_id))]
#[diesel(belongs_to(User, foreign_key = user_id))]
#[diesel(table_name = permission_groups_to_users)]
pub struct PermissionGroupToUser {
    pub permission_group_id: Uuid,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

allow_columns_to_appear_in_same_group_by_clause!(
    dataset_groups::id,
    dataset_groups::name,
    dataset_permissions::id,
    dataset_groups_permissions::id,
    teams::id,
    teams::name,
    permission_groups_to_identities::permission_group_id,
    teams_to_users::user_id,
    teams_to_users::role,
    permission_groups::id,
    permission_groups::name,
    permission_groups_to_identities::identity_id,
    permission_groups_to_identities::identity_type,
    users::id,
    users::name,
    users::email,
    users::avatar_url,
    users_to_organizations::role,
    datasets::id,
    datasets::name,
    datasets::created_at,
    datasets::updated_at,
    datasets::enabled,
    datasets::imported,
    data_sources::id,
    data_sources::name,
);

#[derive(Queryable, Insertable, Identifiable, Associations, Debug, Clone, Serialize)]
#[diesel(belongs_to(Dashboard, foreign_key = dashboard_id))]
#[diesel(table_name = dashboard_versions)]
pub struct DashboardVersion {
    pub id: Uuid,
    pub dashboard_id: Uuid,
    pub config: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(
    Serialize,
    Deserialize,
    Selectable,
    Identifiable,
    Queryable,
    Insertable,
    Associations,
    AsChangeset,
    Debug,
    Clone,
)]
#[diesel(belongs_to(User, foreign_key = created_by, foreign_key = updated_by))]
#[diesel(table_name = dashboards)]
pub struct Dashboard {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub config: Value,
    pub publicly_accessible: bool,
    pub publicly_enabled_by: Option<Uuid>,
    pub public_expiry_date: Option<DateTime<Utc>>,
    #[serde(skip_serializing)]
    pub password_secret_id: Option<Uuid>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub organization_id: Uuid,
}

#[derive(
    Serialize, Selectable, Insertable, Queryable, Identifiable, Associations, Debug, Clone,
)]
#[diesel(belongs_to(Organization))]
#[diesel(belongs_to(User, foreign_key = created_by, foreign_key = updated_by))]
#[diesel(table_name = data_sources)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct DataSource {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "db_type")]
    pub type_: DataSourceType,
    pub secret_id: Uuid,
    pub onboarding_status: DataSourceOnboardingStatus,
    pub onboarding_error: Option<String>,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub env: String,
}

#[derive(
    Serialize,
    Queryable,
    Insertable,
    Identifiable,
    Associations,
    Debug,
    Clone,
    AsChangeset,
    Selectable,
)]
#[diesel(belongs_to(Dataset, foreign_key = dataset_id))]
#[diesel(table_name = dataset_columns)]
pub struct DatasetColumn {
    pub id: Uuid,
    pub dataset_id: Uuid,
    pub name: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub description: Option<String>,
    pub nullable: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub stored_values: Option<bool>,
    pub stored_values_status: Option<StoredValuesStatus>,
    pub stored_values_error: Option<String>,
    pub stored_values_count: Option<i64>,
    pub stored_values_last_synced: Option<DateTime<Utc>>,
    pub semantic_type: Option<String>,
    pub dim_type: Option<String>,
    pub expr: Option<String>,
}

#[derive(
    Serialize,
    Deserialize,
    Clone,
    Selectable,
    QueryableByName,
    Queryable,
    Insertable,
    Identifiable,
    Associations,
    Debug,
    PartialEq,
    Eq,
    Hash,
    AsChangeset,
)]
#[diesel(belongs_to(DataSource, foreign_key = data_source_id))]
#[diesel(belongs_to(User, foreign_key = created_by, foreign_key = updated_by))]
#[diesel(table_name = datasets)]
pub struct Dataset {
    pub id: Uuid,
    pub name: String,
    pub database_name: String,
    pub when_to_use: Option<String>,
    pub when_not_to_use: Option<String>,
    #[serde(rename = "type")]
    pub type_: DatasetType,
    pub definition: String,
    pub schema: String,
    pub enabled: bool,
    pub imported: bool,
    pub data_source_id: Uuid,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub model: Option<String>,
    pub yml_file: Option<String>,
    pub database_identifier: Option<String>,
}

#[derive(Insertable, Queryable, Associations, Debug)]
#[diesel(belongs_to(Dataset, foreign_key = dataset_id))]
#[diesel(belongs_to(PermissionGroup, foreign_key = permission_group_id))]
#[diesel(table_name = datasets_to_permission_groups)]
pub struct DatasetToPermissionGroup {
    pub dataset_id: Uuid,
    pub permission_group_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(
    Queryable, Insertable, Identifiable, Associations, Clone, Serialize, Deserialize, Debug,
)]
#[diesel(belongs_to(User, foreign_key = created_by, foreign_key = updated_by))]
#[diesel(table_name = collections)]
pub struct Collection {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub organization_id: Uuid,
    pub workspace_sharing: WorkspaceSharing,
    pub workspace_sharing_enabled_by: Option<Uuid>,
    pub workspace_sharing_enabled_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Identifiable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = organizations)]
#[serde(rename_all = "camelCase")]
pub struct Organization {
    pub id: Uuid,
    pub name: String,
    pub domain: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub payment_required: bool,
    pub domains: Option<Vec<String>>,
    pub restrict_new_user_invitations: bool,
    pub default_role: UserOrganizationRole,
    pub organization_color_palettes: serde_json::Value,
}

#[derive(
    Queryable, Insertable, Identifiable, Associations, Debug, Clone, Serialize, Deserialize,
)]
#[diesel(belongs_to(Organization))]
#[diesel(table_name = teams)]
pub struct Team {
    pub id: Uuid,
    pub name: String,
    pub organization_id: Uuid,
    pub sharing_setting: SharingSetting,
    pub edit_sql: bool,
    pub upload_csv: bool,
    pub export_assets: bool,
    pub email_slack_enabled: bool,
    #[serde(skip_serializing)]
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(Team))]
#[diesel(belongs_to(User))]
#[diesel(table_name = teams_to_users)]
pub struct TeamToUser {
    pub team_id: Uuid,
    pub user_id: Uuid,
    pub role: TeamToUserRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Selectable, Insertable, Queryable, Identifiable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = users)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    #[serde(skip_serializing)]
    pub config: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub attributes: Value,
    pub avatar_url: Option<String>,
}

#[derive(
    Clone,
    Insertable,
    Queryable,
    QueryableByName,
    Identifiable,
    Associations,
    Debug,
    Serialize,
    Selectable,
    AsChangeset,
    sqlx::FromRow,
)]
#[diesel(belongs_to(User, foreign_key = sent_by))]
#[diesel(belongs_to(Dataset))]
#[diesel(table_name = messages_deprecated)]
pub struct MessageDeprecated {
    pub id: Uuid,
    pub thread_id: Uuid,
    pub sent_by: Uuid,
    pub message: String,
    #[serde(rename = "response")]
    pub responses: Option<serde_json::Value>,
    pub code: Option<String>,
    #[serde(skip_serializing)]
    pub context: Option<serde_json::Value>,
    pub title: Option<String>,
    pub feedback: Option<MessageFeedback>,
    #[serde(rename = "status")]
    pub verification: Verification,
    pub dataset_id: Option<Uuid>,
    pub chart_config: Option<serde_json::Value>,
    pub chart_recommendations: Option<serde_json::Value>,
    pub time_frame: Option<String>,
    pub data_metadata: Option<serde_json::Value>,
    pub draft_session_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing)]
    pub draft_state: Option<serde_json::Value>,
    #[serde(rename = "description")]
    pub summary_question: Option<String>,
    pub sql_evaluation_id: Option<Uuid>,
}

#[derive(Selectable, Queryable, Insertable, Identifiable, Associations, Debug, Serialize)]
#[diesel(belongs_to(User, foreign_key = created_by, foreign_key = updated_by))]
#[diesel(table_name = permission_groups)]
pub struct PermissionGroup {
    pub id: Uuid,
    pub name: String,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(
    Serialize,
    Insertable,
    Queryable,
    QueryableByName,
    Identifiable,
    Associations,
    Debug,
    Clone,
    Hash,
    PartialEq,
    Eq,
)]
#[diesel(belongs_to(User, foreign_key = created_by, foreign_key = updated_by))]
#[diesel(table_name = terms)]
pub struct Term {
    pub id: Uuid,
    pub name: String,
    pub definition: Option<String>,
    pub sql_snippet: Option<String>,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(
    Clone,
    Queryable,
    Insertable,
    Identifiable,
    Associations,
    Debug,
    Serialize,
    Selectable,
    AsChangeset,
)]
#[diesel(belongs_to(User, foreign_key = created_by, foreign_key = updated_by))]
#[diesel(table_name = threads_deprecated)]
pub struct ThreadDeprecated {
    pub id: Uuid,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub publicly_accessible: bool,
    pub publicly_enabled_by: Option<Uuid>,
    pub public_expiry_date: Option<DateTime<Utc>>,
    #[serde(skip_serializing)]
    pub password_secret_id: Option<Uuid>,
    pub state_message_id: Option<Uuid>,
    pub parent_thread_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub organization_id: Uuid,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(ThreadDeprecated, foreign_key = thread_id))]
#[diesel(belongs_to(Dashboard, foreign_key = dashboard_id))]
#[diesel(belongs_to(User, foreign_key = added_by))]
#[diesel(table_name = threads_to_dashboards)]
pub struct ThreadToDashboard {
    pub thread_id: Uuid,
    pub dashboard_id: Uuid,
    pub added_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(PermissionGroup, foreign_key = permission_group_id))]
#[diesel(table_name = permission_groups_to_identities)]
pub struct PermissionGroupToIdentity {
    pub permission_group_id: Uuid,
    pub identity_id: Uuid,
    pub identity_type: IdentityType,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
}

#[derive(Queryable, Insertable, Debug)]
#[diesel(table_name = asset_permissions)]
pub struct AssetPermission {
    pub identity_id: Uuid,
    pub identity_type: IdentityType,
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub role: AssetPermissionRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(Collection, foreign_key = collection_id))]
#[diesel(table_name = collections_to_assets)]
pub struct CollectionToAsset {
    pub collection_id: Uuid,
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(User, foreign_key = user_id))]
#[diesel(belongs_to(Organization, foreign_key = organization_id))]
#[diesel(table_name = users_to_organizations)]
pub struct UserToOrganization {
    pub user_id: Uuid,
    pub organization_id: Uuid,
    pub role: UserOrganizationRole,
    pub sharing_setting: SharingSetting,
    pub edit_sql: bool,
    pub upload_csv: bool,
    pub export_assets: bool,
    pub email_slack_enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub deleted_by: Option<Uuid>,
    pub status: UserOrganizationStatus,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(User, foreign_key = user_id))]
#[diesel(table_name = user_favorites)]
pub struct UserFavorite {
    pub user_id: Uuid,
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub order_index: i32,
    pub created_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(Term, foreign_key = term_id))]
#[diesel(belongs_to(Dataset, foreign_key = dataset_id))]
#[diesel(table_name = terms_to_datasets)]
pub struct TermToDataset {
    pub term_id: Uuid,
    pub dataset_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Debug, Serialize, Deserialize)]
#[diesel(table_name = sql_evaluations)]
pub struct SqlEvaluation {
    pub id: Uuid,
    pub evaluation_obj: serde_json::Value,
    pub evaluation_summary: String,
    pub score: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Debug)]
#[diesel(table_name = entity_relationship)]
pub struct EntityRelationship {
    pub primary_dataset_id: Uuid,
    pub foreign_dataset_id: Uuid,
    pub relationship_type: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Queryable, Insertable, Debug)]
#[diesel(table_name = dataset_groups)]
pub struct DatasetGroup {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Debug)]
#[diesel(table_name = dataset_permissions)]
pub struct DatasetPermission {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub dataset_id: Uuid,
    pub permission_id: Uuid,
    pub permission_type: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Debug)]
#[diesel(table_name = dataset_groups_permissions)]
pub struct DatasetGroupPermission {
    pub id: Uuid,
    pub dataset_group_id: Uuid,
    pub permission_id: Uuid,
    pub permission_type: String,
    pub organization_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(Dataset, foreign_key = dataset_id))]
#[diesel(belongs_to(DatasetGroup, foreign_key = dataset_group_id))]
#[diesel(table_name = datasets_to_dataset_groups)]
pub struct DatasetToDatasetGroup {
    pub dataset_id: Uuid,
    pub dataset_group_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

// TODO: These are json types that go in the db.

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum MinMaxValue {
    Number(f64),
    String(String),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ColumnMetadata {
    pub name: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub simple_type: Option<String>,
    pub unique_values: i32,
    pub min_value: Option<MinMaxValue>,
    pub max_value: Option<MinMaxValue>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DataMetadataJsonBody {
    pub column_count: i32,
    pub row_count: i32,
    pub column_metadata: Vec<ColumnMetadata>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MessageResponses {
    pub messages: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserConfig {
    pub color_palettes: Option<Vec<Vec<String>>>,
    pub last_used_color_palette: Option<Vec<String>>,
}

/// Organization Color Palette Types
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OrganizationColorPalette {
    pub id: String,
    pub colors: Vec<String>, // Hex color codes
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OrganizationColorPalettes {
    pub selected_id: Option<String>,
    pub palettes: Vec<OrganizationColorPalette>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum StepProgress {
    InProgress,
    Completed,
    Failed,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(MetricFile, foreign_key = metric_file_id))]
#[diesel(belongs_to(DashboardFile, foreign_key = dashboard_file_id))]
#[diesel(table_name = metric_files_to_dashboard_files)]
pub struct MetricFileToDashboardFile {
    pub metric_file_id: Uuid,
    pub dashboard_file_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
}

#[derive(Queryable, Insertable, Associations, Debug)]
#[diesel(belongs_to(MetricFile, foreign_key = metric_file_id))]
#[diesel(belongs_to(Dataset, foreign_key = dataset_id))]
#[diesel(table_name = metric_files_to_datasets)]
pub struct MetricFileToDataset {
    pub metric_file_id: Uuid,
    pub dataset_id: Uuid,
    pub metric_version_number: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(
    Queryable,
    Insertable,
    Identifiable,
    Associations,
    Debug,
    Clone,
    Serialize,
    Selectable,
    AsChangeset,
)]
#[diesel(belongs_to(DataSource))]
#[diesel(table_name = stored_values_sync_jobs)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct StoredValuesSyncJob {
    pub id: Uuid,
    pub data_source_id: Uuid,
    pub database_name: String,
    pub schema_name: String,
    pub table_name: String,
    pub column_name: String,
    pub last_synced_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub status: String,
    pub error_message: Option<String>,
}
