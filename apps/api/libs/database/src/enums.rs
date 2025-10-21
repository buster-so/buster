use crate::schema::*;
use diesel::deserialize::{self, FromSql};
use diesel::pg::{Pg, PgValue};
use diesel::serialize::{self, IsNull, Output, ToSql};
use diesel::sql_types::Text;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::str::FromStr;

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
    Deserialize,
    Serialize,
)]
#[diesel(sql_type = sql_types::MessageFeedbackEnum)]
#[serde(rename_all = "camelCase")]
pub enum MessageFeedback {
    Positive,
    Negative,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
    Deserialize,
    Serialize,
)]
#[diesel(sql_type = sql_types::ChatTypeEnum)]
#[serde(rename_all = "camelCase")]
pub enum ChatType {
    Analyst,
    Developer,
}

impl ChatType {
    pub fn to_string(&self) -> &'static str {
        match *self {
            ChatType::Analyst => "analyst",
            ChatType::Developer => "developer",
        }
    }
}

impl FromStr for ChatType {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "analyst" => Ok(ChatType::Analyst),
            "developer" => Ok(ChatType::Developer),
            _ => Err("Unrecognized ChatType".into()),
        }
    }
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
)]
#[diesel(sql_type = sql_types::UserOrganizationRoleEnum)]
#[serde(rename_all = "snake_case")]
pub enum UserOrganizationRole {
    #[serde(alias = "workspaceAdmin")]
    WorkspaceAdmin,
    #[serde(alias = "dataAdmin")]
    DataAdmin,
    #[serde(alias = "querier")]
    Querier,
    #[serde(alias = "restrictedQuerier")]
    RestrictedQuerier,
    #[serde(alias = "viewer")]
    Viewer,
}

impl UserOrganizationRole {
    pub fn to_string(&self) -> &'static str {
        match *self {
            UserOrganizationRole::WorkspaceAdmin => "workspace_admin",
            UserOrganizationRole::DataAdmin => "data_admin",
            UserOrganizationRole::Querier => "querier",
            UserOrganizationRole::RestrictedQuerier => "restricted_querier",
            UserOrganizationRole::Viewer => "viewer",
        }
    }
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
)]
#[diesel(sql_type = sql_types::TeamRoleEnum)]
#[serde(rename_all = "camelCase")]
pub enum TeamToUserRole {
    Manager,
    Member,
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    Hash,
    diesel::AsExpression,
    diesel::FromSqlRow,
    Ord,
    PartialOrd,
)]
#[diesel(sql_type = sql_types::AssetPermissionRoleEnum)]
#[serde(rename_all = "snake_case")]
pub enum AssetPermissionRole {
    #[serde(alias = "owner")]
    Owner,
    #[serde(alias = "fullAccess")]
    FullAccess,
    #[serde(alias = "canEdit")]
    CanEdit,
    #[serde(alias = "canFilter")]
    CanFilter,
    #[serde(alias = "canView")]
    CanView,
}

impl AssetPermissionRole {
    pub fn max(self, other: Self) -> Self {
        match (self, other) {
            (AssetPermissionRole::Owner, _) | (_, AssetPermissionRole::Owner) => {
                AssetPermissionRole::Owner
            }
            (AssetPermissionRole::FullAccess, _) | (_, AssetPermissionRole::FullAccess) => {
                AssetPermissionRole::FullAccess
            }
            (AssetPermissionRole::CanEdit, _) | (_, AssetPermissionRole::CanEdit) => {
                AssetPermissionRole::CanEdit
            }
            (AssetPermissionRole::CanFilter, _) | (_, AssetPermissionRole::CanFilter) => {
                AssetPermissionRole::CanFilter
            }
            (AssetPermissionRole::CanView, _) => AssetPermissionRole::CanView,
        }
    }
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
)]
#[diesel(sql_type = sql_types::UserOrganizationStatusEnum)]
#[serde(rename_all = "camelCase")]
pub enum UserOrganizationStatus {
    Active,
    Inactive,
    Pending,
    Guest,
}

impl ToSql<sql_types::UserOrganizationStatusEnum, Pg> for UserOrganizationStatus {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            UserOrganizationStatus::Active => out.write_all(b"active")?,
            UserOrganizationStatus::Inactive => out.write_all(b"inactive")?,
            UserOrganizationStatus::Pending => out.write_all(b"pending")?,
            UserOrganizationStatus::Guest => out.write_all(b"guest")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::UserOrganizationStatusEnum, Pg> for UserOrganizationStatus {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"active" => Ok(UserOrganizationStatus::Active),
            b"inactive" => Ok(UserOrganizationStatus::Inactive),
            b"pending" => Ok(UserOrganizationStatus::Pending),
            b"guest" => Ok(UserOrganizationStatus::Guest),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
)]
#[diesel(sql_type = sql_types::StoredValuesStatusEnum)]
#[serde(rename_all = "camelCase")]
pub enum StoredValuesStatus {
    Syncing,
    Success,
    Failed,
}

impl ToSql<sql_types::StoredValuesStatusEnum, Pg> for StoredValuesStatus {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            StoredValuesStatus::Syncing => out.write_all(b"syncing")?,
            StoredValuesStatus::Success => out.write_all(b"success")?,
            StoredValuesStatus::Failed => out.write_all(b"failed")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::StoredValuesStatusEnum, Pg> for StoredValuesStatus {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"syncing" => Ok(StoredValuesStatus::Syncing),
            b"success" => Ok(StoredValuesStatus::Success),
            b"failed" => Ok(StoredValuesStatus::Failed),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
)]
#[diesel(sql_type = sql_types::AssetTypeEnum)]
#[serde(rename_all = "snake_case")]
pub enum AssetType {
    #[serde(rename = "dashboard_deprecated")]
    Dashboard,
    Thread,
    Collection,
    Chat,
    MetricFile,
    DashboardFile,
    ReportFile,
}

impl AssetType {
    pub fn to_string(&self) -> &'static str {
        match *self {
            AssetType::Dashboard => "dashboard_deprecated",
            AssetType::Thread => "thread",
            AssetType::Collection => "collection",
            AssetType::Chat => "chat",
            AssetType::MetricFile => "metric_file",
            AssetType::DashboardFile => "dashboard_file",
            AssetType::ReportFile => "report_file",
        }
    }
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
)]
#[diesel(sql_type = sql_types::IdentityTypeEnum)]
pub enum IdentityType {
    User,
    Team,
    Organization,
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
)]
#[diesel(sql_type = sql_types::SharingSettingEnum)]
#[serde(rename_all = "camelCase")]
pub enum SharingSetting {
    None,
    Team,
    Organization,
    Public,
}

impl ToSql<sql_types::SharingSettingEnum, Pg> for SharingSetting {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            SharingSetting::None => out.write_all(b"none")?,
            SharingSetting::Team => out.write_all(b"team")?,
            SharingSetting::Organization => out.write_all(b"organization")?,
            SharingSetting::Public => out.write_all(b"public")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::SharingSettingEnum, Pg> for SharingSetting {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"none" => Ok(SharingSetting::None),
            b"team" => Ok(SharingSetting::Team),
            b"organization" => Ok(SharingSetting::Organization),
            b"public" => Ok(SharingSetting::Public),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
)]
#[diesel(sql_type = sql_types::DataSourceOnboardingStatusEnum)]
#[serde(rename_all = "camelCase")]
pub enum DataSourceOnboardingStatus {
    NotStarted,
    InProgress,
    Completed,
    Failed,
}

impl ToSql<sql_types::DataSourceOnboardingStatusEnum, Pg> for DataSourceOnboardingStatus {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            DataSourceOnboardingStatus::NotStarted => out.write_all(b"notStarted")?,
            DataSourceOnboardingStatus::InProgress => out.write_all(b"inProgress")?,
            DataSourceOnboardingStatus::Completed => out.write_all(b"completed")?,
            DataSourceOnboardingStatus::Failed => out.write_all(b"failed")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::DataSourceOnboardingStatusEnum, Pg> for DataSourceOnboardingStatus {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"notStarted" => Ok(DataSourceOnboardingStatus::NotStarted),
            b"inProgress" => Ok(DataSourceOnboardingStatus::InProgress),
            b"completed" => Ok(DataSourceOnboardingStatus::Completed),
            b"failed" => Ok(DataSourceOnboardingStatus::Failed),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
    Hash,
)]
#[diesel(sql_type = sql_types::DatasetTypeEnum)]
#[serde(rename_all = "camelCase")]
pub enum DatasetType {
    Table,
    View,
    MaterializedView,
}

impl DatasetType {
    pub fn try_from_str(s: &str) -> Option<Self> {
        match s {
            "table" => Some(DatasetType::Table),
            "view" => Some(DatasetType::View),
            "materializedView" => Some(DatasetType::MaterializedView),
            _ => None,
        }
    }

    pub fn to_string(&self) -> &'static str {
        match *self {
            DatasetType::Table => "table",
            DatasetType::View => "view",
            DatasetType::MaterializedView => "materialized view",
        }
    }
}

impl FromStr for DatasetType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::try_from_str(s).ok_or_else(|| format!("Invalid DatasetType: {}", s))
    }
}

impl ToSql<sql_types::DatasetTypeEnum, Pg> for DatasetType {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            DatasetType::Table => out.write_all(b"table")?,
            DatasetType::View => out.write_all(b"view")?,
            DatasetType::MaterializedView => out.write_all(b"materializedView")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::DatasetTypeEnum, Pg> for DatasetType {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"table" => Ok(DatasetType::Table),
            b"view" => Ok(DatasetType::View),
            b"materializedView" => Ok(DatasetType::MaterializedView),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

#[derive(
    Debug,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
    Serialize,
    Deserialize,
    Clone,
    Copy,
)]
#[diesel(sql_type = sql_types::VerificationEnum)]
#[serde(rename_all = "camelCase")]
pub enum Verification {
    Verified,
    Backlogged,
    InReview,
    Requested,
    NotRequested,
}

impl ToSql<sql_types::VerificationEnum, Pg> for Verification {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            Verification::Verified => out.write_all(b"verified")?,
            Verification::Backlogged => out.write_all(b"backlogged")?,
            Verification::InReview => out.write_all(b"inReview")?,
            Verification::Requested => out.write_all(b"requested")?,
            Verification::NotRequested => out.write_all(b"notRequested")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::VerificationEnum, Pg> for Verification {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"verified" => Ok(Verification::Verified),
            b"backlogged" => Ok(Verification::Backlogged),
            b"inReview" => Ok(Verification::InReview),
            b"requested" => Ok(Verification::Requested),
            b"notRequested" => Ok(Verification::NotRequested),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

#[derive(
    Serialize,
    Deserialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
)]
#[diesel(sql_type = Text)]
#[serde(rename_all = "lowercase")]
pub enum DataSourceType {
    BigQuery,
    Databricks,
    MySql,
    Mariadb,
    Postgres,
    Redshift,
    Snowflake,
    SqlServer,
    Supabase,
}

impl DataSourceType {
    pub fn try_from_str(s: &str) -> Option<Self> {
        match s {
            "bigquery" => Some(DataSourceType::BigQuery),
            "databricks" => Some(DataSourceType::Databricks),
            "mysql" => Some(DataSourceType::MySql),
            "mariadb" => Some(DataSourceType::Mariadb),
            "postgres" => Some(DataSourceType::Postgres),
            "redshift" => Some(DataSourceType::Redshift),
            "snowflake" => Some(DataSourceType::Snowflake),
            "sqlserver" => Some(DataSourceType::SqlServer),
            "supabase" => Some(DataSourceType::Supabase),
            _ => None,
        }
    }

    pub fn to_str(&self) -> &'static str {
        match *self {
            DataSourceType::BigQuery => "bigquery",
            DataSourceType::Databricks => "databricks",
            DataSourceType::MySql => "mysql",
            DataSourceType::Mariadb => "mariadb",
            DataSourceType::Postgres => "postgres",
            DataSourceType::Redshift => "redshift",
            DataSourceType::Snowflake => "snowflake",
            DataSourceType::SqlServer => "sqlserver",
            DataSourceType::Supabase => "supabase",
        }
    }

    pub fn to_string(&self) -> String {
        String::from(match *self {
            DataSourceType::BigQuery => "bigquery",
            DataSourceType::Databricks => "databricks",
            DataSourceType::MySql => "mysql",
            DataSourceType::Mariadb => "mariadb",
            DataSourceType::Postgres => "postgres",
            DataSourceType::Redshift => "redshift",
            DataSourceType::Snowflake => "snowflake",
            DataSourceType::SqlServer => "sqlserver",
            DataSourceType::Supabase => "supabase",
        })
    }
}

impl FromStr for DataSourceType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::try_from_str(s).ok_or_else(|| format!("Invalid DataSourceType: {}", s))
    }
}

impl ToSql<Text, Pg> for DataSourceType {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            DataSourceType::BigQuery => out.write_all(b"bigquery")?,
            DataSourceType::Databricks => out.write_all(b"databricks")?,
            DataSourceType::MySql => out.write_all(b"mysql")?,
            DataSourceType::Mariadb => out.write_all(b"mariadb")?,
            DataSourceType::Postgres => out.write_all(b"postgres")?,
            DataSourceType::Redshift => out.write_all(b"redshift")?,
            DataSourceType::Snowflake => out.write_all(b"snowflake")?,
            DataSourceType::SqlServer => out.write_all(b"sqlserver")?,
            DataSourceType::Supabase => out.write_all(b"supabase")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<Text, Pg> for DataSourceType {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"bigquery" => Ok(DataSourceType::BigQuery),
            b"databricks" => Ok(DataSourceType::Databricks),
            b"mysql" => Ok(DataSourceType::MySql),
            b"mariadb" => Ok(DataSourceType::Mariadb),
            b"postgres" => Ok(DataSourceType::Postgres),
            b"redshift" => Ok(DataSourceType::Redshift),
            b"snowflake" => Ok(DataSourceType::Snowflake),
            b"sqlserver" => Ok(DataSourceType::SqlServer),
            b"supabase" => Ok(DataSourceType::Supabase),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

impl ToSql<sql_types::AssetTypeEnum, Pg> for AssetType {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            AssetType::Dashboard => out.write_all(b"dashboard")?,
            AssetType::Thread => out.write_all(b"thread")?,
            AssetType::Collection => out.write_all(b"collection")?,
            AssetType::Chat => out.write_all(b"chat")?,
            AssetType::DashboardFile => out.write_all(b"dashboard_file")?,
            AssetType::MetricFile => out.write_all(b"metric_file")?,
            AssetType::ReportFile => out.write_all(b"report_file")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::AssetTypeEnum, Pg> for AssetType {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"dashboard" => Ok(AssetType::Dashboard),
            b"thread" => Ok(AssetType::Thread),
            b"collection" => Ok(AssetType::Collection),
            b"chat" => Ok(AssetType::Chat),
            b"dashboard_file" => Ok(AssetType::DashboardFile),
            b"metric_file" => Ok(AssetType::MetricFile),
            b"report_file" => Ok(AssetType::ReportFile),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

impl ToSql<sql_types::IdentityTypeEnum, Pg> for IdentityType {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            IdentityType::User => out.write_all(b"user")?,
            IdentityType::Team => out.write_all(b"team")?,
            IdentityType::Organization => out.write_all(b"organization")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::IdentityTypeEnum, Pg> for IdentityType {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"user" => Ok(IdentityType::User),
            b"team" => Ok(IdentityType::Team),
            b"organization" => Ok(IdentityType::Organization),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

impl ToSql<sql_types::AssetPermissionRoleEnum, Pg> for AssetPermissionRole {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            AssetPermissionRole::Owner => out.write_all(b"owner")?,
            AssetPermissionRole::FullAccess => out.write_all(b"full_access")?,
            AssetPermissionRole::CanEdit => out.write_all(b"can_edit")?,
            AssetPermissionRole::CanFilter => out.write_all(b"can_filter")?,
            AssetPermissionRole::CanView => out.write_all(b"can_view")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::AssetPermissionRoleEnum, Pg> for AssetPermissionRole {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"owner" => Ok(AssetPermissionRole::Owner),
            b"full_access" => Ok(AssetPermissionRole::FullAccess),
            b"can_edit" => Ok(AssetPermissionRole::CanEdit),
            b"can_filter" => Ok(AssetPermissionRole::CanFilter),
            b"can_view" => Ok(AssetPermissionRole::CanView),
            b"editor" => Ok(AssetPermissionRole::CanEdit),
            b"viewer" => Ok(AssetPermissionRole::CanView),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

// Implementing for UserRole
impl ToSql<sql_types::UserOrganizationRoleEnum, Pg> for UserOrganizationRole {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            UserOrganizationRole::WorkspaceAdmin => out.write_all(b"workspace_admin")?,
            UserOrganizationRole::DataAdmin => out.write_all(b"data_admin")?,
            UserOrganizationRole::Querier => out.write_all(b"querier")?,
            UserOrganizationRole::RestrictedQuerier => out.write_all(b"restricted_querier")?,
            UserOrganizationRole::Viewer => out.write_all(b"viewer")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::UserOrganizationRoleEnum, Pg> for UserOrganizationRole {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"workspace_admin" => Ok(UserOrganizationRole::WorkspaceAdmin),
            b"data_admin" => Ok(UserOrganizationRole::DataAdmin),
            b"querier" => Ok(UserOrganizationRole::Querier),
            b"restricted_querier" => Ok(UserOrganizationRole::RestrictedQuerier),
            b"viewer" => Ok(UserOrganizationRole::Viewer),
            _ => Err("Unrecognized UserRole".into()),
        }
    }
}

// Implementing for TeamToUserRole
impl ToSql<sql_types::TeamRoleEnum, Pg> for TeamToUserRole {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            TeamToUserRole::Manager => out.write_all(b"manager")?,
            TeamToUserRole::Member => out.write_all(b"member")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::TeamRoleEnum, Pg> for TeamToUserRole {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"manager" => Ok(TeamToUserRole::Manager),
            b"member" => Ok(TeamToUserRole::Member),
            _ => Err("Unrecognized UserRole".into()),
        }
    }
}

// Implementing for MessageFeedback
impl ToSql<sql_types::MessageFeedbackEnum, Pg> for MessageFeedback {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            MessageFeedback::Positive => out.write_all(b"positive")?,
            MessageFeedback::Negative => out.write_all(b"negative")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::MessageFeedbackEnum, Pg> for MessageFeedback {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"positive" => Ok(MessageFeedback::Positive),
            b"negative" => Ok(MessageFeedback::Negative),
            _ => Err("Unrecognized MessageFeedback".into()),
        }
    }
}

// Implementing for ChatType
impl ToSql<sql_types::ChatTypeEnum, Pg> for ChatType {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            ChatType::Analyst => out.write_all(b"analyst")?,
            ChatType::Developer => out.write_all(b"developer")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::ChatTypeEnum, Pg> for ChatType {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"analyst" => Ok(ChatType::Analyst),
            b"developer" => Ok(ChatType::Developer),
            _ => Err("Unrecognized ChatType".into()),
        }
    }
}

// WorkspaceSharing enum
#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    diesel::AsExpression,
    diesel::FromSqlRow,
    Deserialize,
    Serialize,
)]
#[diesel(sql_type = sql_types::WorkspaceSharingEnum)]
#[serde(rename_all = "snake_case")]
pub enum WorkspaceSharing {
    #[serde(alias = "none")]
    None,
    #[serde(alias = "can_view")]
    CanView,
    #[serde(alias = "can_edit")]
    CanEdit,
    #[serde(alias = "full_access")]
    FullAccess,
}

impl ToSql<sql_types::WorkspaceSharingEnum, Pg> for WorkspaceSharing {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            WorkspaceSharing::None => out.write_all(b"none")?,
            WorkspaceSharing::CanView => out.write_all(b"can_view")?,
            WorkspaceSharing::CanEdit => out.write_all(b"can_edit")?,
            WorkspaceSharing::FullAccess => out.write_all(b"full_access")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<sql_types::WorkspaceSharingEnum, Pg> for WorkspaceSharing {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"none" => Ok(WorkspaceSharing::None),
            b"can_view" => Ok(WorkspaceSharing::CanView),
            b"can_edit" => Ok(WorkspaceSharing::CanEdit),
            b"full_access" => Ok(WorkspaceSharing::FullAccess),
            _ => Err("Unrecognized WorkspaceSharing variant".into()),
        }
    }
}
