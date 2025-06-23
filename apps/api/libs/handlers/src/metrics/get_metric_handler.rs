use anyhow::{anyhow, Result};
use diesel::{BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use futures::future::join;
use middleware::AuthenticatedUser;
use serde_yaml;
use uuid::Uuid;

use crate::metrics::types::{AssociatedCollection, AssociatedDashboard, BusterMetric, Dataset};
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use database::helpers::metric_files::fetch_metric_file_with_permissions;
use database::pool::get_pg_pool;
use database::schema::{
    asset_permissions, collections, collections_to_assets, dashboard_files, datasets,
    metric_files_to_dashboard_files, users, metric_files_to_datasets,
};
use sharing::check_permission_access;

use super::Version;

#[derive(Queryable)]
struct DatasetInfo {
    id: Uuid,
    name: String,
    data_source_id: Uuid,
}

#[derive(Queryable)]
struct AssetPermissionInfo {
    role: AssetPermissionRole,
    email: String,
    name: Option<String>,
}

/// Fetch the dashboards associated with the given metric id, filtered by user permissions
async fn fetch_associated_dashboards_for_metric(
    metric_id: Uuid,
    user_id: &Uuid,
) -> Result<Vec<AssociatedDashboard>> {
    let mut conn = get_pg_pool().get().await?;
    let associated_dashboards = metric_files_to_dashboard_files::table
        .inner_join(
            dashboard_files::table
                .on(dashboard_files::id.eq(metric_files_to_dashboard_files::dashboard_file_id)),
        )
        .inner_join(
            asset_permissions::table.on(asset_permissions::asset_id
                .eq(dashboard_files::id)
                .and(asset_permissions::asset_type.eq(AssetType::DashboardFile))),
        )
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
        .filter(dashboard_files::deleted_at.is_null())
        .filter(metric_files_to_dashboard_files::deleted_at.is_null())
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .select((dashboard_files::id, dashboard_files::name))
        .load::<(Uuid, String)>(&mut conn)
        .await?
        .into_iter()
        .map(|(id, name)| AssociatedDashboard { id, name })
        .collect();
    Ok(associated_dashboards)
}

/// Fetch the collections associated with the given metric id, filtered by user permissions
async fn fetch_associated_collections_for_metric(
    metric_id: Uuid,
    user_id: &Uuid,
) -> Result<Vec<AssociatedCollection>> {
    let mut conn = get_pg_pool().get().await?;
    let associated_collections = collections_to_assets::table
        .inner_join(collections::table.on(collections::id.eq(collections_to_assets::collection_id)))
        .inner_join(
            asset_permissions::table.on(asset_permissions::asset_id
                .eq(collections::id)
                .and(asset_permissions::asset_type.eq(AssetType::Collection))),
        )
        .filter(collections_to_assets::asset_id.eq(metric_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .select((collections::id, collections::name))
        .load::<(Uuid, String)>(&mut conn)
        .await?
        .into_iter()
        .map(|(id, name)| AssociatedCollection { id, name })
        .collect();
    Ok(associated_collections)
}

/// Handler to retrieve a metric by ID with optional version number
///
/// If version_number is provided, returns that specific version of the metric.
/// If version_number is None, returns the latest version of the metric.
pub async fn get_metric_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    version_number: Option<i32>,
    password: Option<String>,
) -> Result<BusterMetric> {
    // 1. Fetch metric file with permission
    let metric_file_with_permission_option =
        fetch_metric_file_with_permissions(metric_id, &user.id)
            .await
            .map_err(|e| anyhow!("Failed to fetch metric file with permissions: {}", e))?;

    let metric_file_with_permission = if let Some(mf) = metric_file_with_permission_option {
        mf
    } else {
        tracing::warn!(metric_id = %metric_id, "Metric file not found during fetch");
        return Err(anyhow!("Metric file not found"));
    };

    let metric_file = metric_file_with_permission.metric_file;
    let direct_permission_level = metric_file_with_permission.permission;

    // 2. Determine the user's access level and enforce access rules
    let permission: AssetPermissionRole;
    tracing::debug!(metric_id = %metric_id, user_id = %user.id, "Checking permissions for metric");

    // Check for direct/admin permission first
    tracing::debug!(metric_id = %metric_id, "Checking direct/admin permissions first.");
    let has_sufficient_direct_permission = check_permission_access(
        direct_permission_level,
        &[
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::CanView,
        ],
        metric_file.organization_id,
        &user.organizations,
    );
    tracing::debug!(metric_id = %metric_id, ?direct_permission_level, has_sufficient_direct_permission, "Direct permission check result");

    if has_sufficient_direct_permission {
        // User has direct/admin permission, use that role
        permission = direct_permission_level.unwrap_or(AssetPermissionRole::CanView); // Default just in case
        tracing::debug!(metric_id = %metric_id, user_id = %user.id, ?permission, "Granting access via direct/admin permission.");
    } else {
        // No sufficient direct/admin permission, check public access rules
        tracing::debug!(metric_id = %metric_id, "Insufficient direct/admin permission. Checking public access rules.");
        if !metric_file.publicly_accessible {
            tracing::warn!(metric_id = %metric_id, user_id = %user.id, "Permission denied (not public, insufficient direct permission).");
            return Err(anyhow!("You don't have permission to view this metric"));
        }
        tracing::debug!(metric_id = %metric_id, "Metric is publicly accessible.");

        // Check if the public access has expired
        if let Some(expiry_date) = metric_file.public_expiry_date {
            tracing::debug!(metric_id = %metric_id, ?expiry_date, "Checking expiry date");
            if expiry_date < chrono::Utc::now() {
                tracing::warn!(metric_id = %metric_id, "Public access expired");
                return Err(anyhow!("Public access to this metric has expired"));
            }
        }

        // Check if a password is required
        tracing::debug!(metric_id = %metric_id, has_password = metric_file.public_password.is_some(), "Checking password requirement");
        if let Some(required_password) = &metric_file.public_password {
            tracing::debug!(metric_id = %metric_id, "Password required. Checking provided password.");
            match password {
                Some(provided_password) => {
                    if provided_password != *required_password {
                        // Incorrect password provided
                        tracing::warn!(metric_id = %metric_id, user_id = %user.id, "Incorrect public password provided");
                        return Err(anyhow!("Incorrect password for public access"));
                    }
                    // Correct password provided, grant CanView via public access
                    tracing::debug!(metric_id = %metric_id, user_id = %user.id, "Correct public password provided. Granting CanView.");
                    permission = AssetPermissionRole::CanView;
                }
                None => {
                    // Password required but none provided
                    tracing::warn!(metric_id = %metric_id, user_id = %user.id, "Public password required but none provided");
                    return Err(anyhow!("public_password required for this metric"));
                }
            }
        } else {
            // Publicly accessible, not expired, and no password required
            tracing::debug!(metric_id = %metric_id, "Public access granted (no password required).");
            permission = AssetPermissionRole::CanView;
        }
    }

    // Declare variables to hold potentially versioned data
    let resolved_name: String;
    let resolved_description: Option<String>;
    let resolved_time_frame: String;
    let resolved_chart_config: database::types::ChartConfig;
    let resolved_sql: String;
    let resolved_updated_at: chrono::DateTime<chrono::Utc>;
    let resolved_version_num: i32;
    let resolved_content_for_yaml: database::types::MetricYml;

    // Data metadata always comes from the main table record (current state)
    let data_metadata: Option<database::types::DataMetadata> = metric_file.data_metadata;

    if let Some(requested_version) = version_number {
        // --- Specific version requested ---
        tracing::debug!(metric_id = %metric_id, version = requested_version, "Attempting to retrieve specific version");
        if let Some(v) = metric_file.version_history.get_version(requested_version) {
            match &v.content {
                database::types::VersionContent::MetricYml(content) => {
                    let version_content = (**content).clone(); // Deref the Box and clone
                    resolved_name = version_content.name.clone();
                    resolved_description = version_content.description.clone(); // Assume this is already Option<String>
                    resolved_time_frame = version_content.time_frame.clone();
                    resolved_chart_config = version_content.chart_config.clone();
                    resolved_sql = version_content.sql.clone();
                    resolved_updated_at = v.updated_at;
                    resolved_version_num = v.version_number;
                    resolved_content_for_yaml = version_content; // Use this content for YAML

                    tracing::debug!(metric_id = %metric_id, version = requested_version, "Successfully retrieved specific version content");
                }
                _ => {
                    tracing::error!(metric_id = %metric_id, version = requested_version, "Invalid content type found for requested version");
                    return Err(anyhow!(
                        "Invalid content type found for version {}",
                        requested_version
                    ));
                }
            }
        } else {
            tracing::warn!(metric_id = %metric_id, version = requested_version, "Requested version not found in history");
            return Err(anyhow!("Version {} not found", requested_version));
        }
    } else {
        // --- No specific version requested - use current state from the main table row ---
        tracing::debug!(metric_id = %metric_id, "No specific version requested, using current metric file content");
        let current_content = metric_file.content.clone(); // Use the content directly from the fetched MetricFile
        resolved_name = metric_file.name.clone(); // Use main record name
        resolved_description = current_content.description.clone(); // Assume this is already Option<String>
        resolved_time_frame = current_content.time_frame.clone();
        resolved_chart_config = current_content.chart_config.clone();
        resolved_sql = current_content.sql.clone();
        resolved_updated_at = metric_file.updated_at; // Use main record updated_at
                                                      // Determine the latest version number from history, defaulting to 1 if none exist in history
        resolved_version_num = metric_file.version_history.get_version_number();
        resolved_content_for_yaml = current_content; // Use this content for YAML

        tracing::debug!(metric_id = %metric_id, latest_version = resolved_version_num, "Determined latest version number");
    }

    // Convert the selected content to pretty YAML for the 'file' field
    let file = match serde_yaml::to_string(&resolved_content_for_yaml) {
        Ok(yaml) => yaml,
        Err(e) => {
            tracing::error!(metric_id = %metric_id, error = %e, "Failed to serialize selected metric content to YAML");
            return Err(anyhow!("Failed to convert metric content to YAML: {}", e));
        }
    };

    // Map evaluation score - this is not versioned
    let evaluation_score = metric_file.evaluation_score.map(|score| {
        if score >= 0.8 {
            "High".to_string()
        } else if score >= 0.5 {
            "Moderate".to_string()
        } else {
            "Low".to_string()
        }
    });

    let mut conn = get_pg_pool().get().await?;

    // Query dataset IDs from the join table based on the resolved version
    let resolved_dataset_ids = match metric_files_to_datasets::table
        .filter(metric_files_to_datasets::metric_file_id.eq(metric_id))
        .filter(metric_files_to_datasets::metric_version_number.eq(resolved_version_num))
        .select(metric_files_to_datasets::dataset_id)
        .load::<Uuid>(&mut conn)
        .await {
            Ok(ids) => ids,
            Err(e) => {
                tracing::error!("Failed to fetch dataset IDs for metric {} version {}: {}", metric_id, resolved_version_num, e);
                // Return empty or handle error as appropriate
                Vec::new() 
            }
        };

    // Get dataset information for the resolved dataset IDs
    let mut datasets = Vec::new();
    // Fetch datasets based on the resolved_dataset_ids fetched above
    if !resolved_dataset_ids.is_empty() { 
        let dataset_infos = datasets::table
            .filter(datasets::id.eq_any(&resolved_dataset_ids))
            .filter(datasets::deleted_at.is_null())
            .select((datasets::id, datasets::name, datasets::data_source_id))
            .load::<DatasetInfo>(&mut conn)
            .await
            .map_err(|e| {
                tracing::error!("Failed to fetch dataset info for metric {}: {}", metric_id, e);
                anyhow!("Failed to fetch dataset info")
            })?;

        for dataset_info in dataset_infos {
            datasets.push(Dataset {
                id: dataset_info.id.to_string(),
                name: dataset_info.name,
            });
        }
    }

    // Get user information
    // let user_info = users::table
    //     .filter(users::id.eq(metric_file.created_by))
    //     .select((users::name, users::avatar_url))
    //     .first::<UserInfo>(&mut conn)
    //     .await
    //     .map_err(|e| anyhow!("Failed to get user information: {}", e))?;

    let mut versions: Vec<Version> = metric_file
        .version_history
        .0
        .values()
        .map(|v| Version {
            version_number: v.version_number,
            updated_at: v.updated_at,
        })
        .collect();

    // Sort versions by version_number in ascending order
    versions.sort_by(|a, b| a.version_number.cmp(&b.version_number));

    // Query individual permissions for this metric
    let individual_permissions_query = asset_permissions::table
        .inner_join(users::table.on(users::id.eq(asset_permissions::identity_id)))
        .filter(asset_permissions::asset_id.eq(metric_id))
        .filter(asset_permissions::asset_type.eq(AssetType::MetricFile))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .select((asset_permissions::role, users::email, users::name))
        .load::<AssetPermissionInfo>(&mut conn)
        .await;

    // Get the user info for publicly_enabled_by if it exists
    let public_enabled_by_user = if let Some(enabled_by_id) = metric_file.publicly_enabled_by {
        users::table
            .filter(users::id.eq(enabled_by_id))
            .select(users::email)
            .first::<String>(&mut conn)
            .await
            .ok()
    } else {
        None
    };

    // Concurrently fetch associated dashboards and collections
    let metrics_id_clone = *metric_id;
    let user_id_clone = user.id; // Clone user ID for use in async blocks
    let dashboards_future = fetch_associated_dashboards_for_metric(metrics_id_clone, &user_id_clone);
    let collections_future =
        fetch_associated_collections_for_metric(metrics_id_clone, &user_id_clone);

    // Await both futures concurrently
    let (dashboards_result, collections_result) = join(dashboards_future, collections_future).await;

    // Handle results, logging errors but returning empty Vecs for failed tasks
    let dashboards = match dashboards_result {
        Ok(dashboards) => dashboards,
        Err(e) => {
            tracing::error!(
                "Failed to fetch associated dashboards for metric {}: {}",
                metric_id,
                e
            );
            vec![]
        }
    };

    let collections = match collections_result {
        Ok(collections) => collections,
        Err(e) => {
            tracing::error!(
                "Failed to fetch associated collections for metric {}: {}",
                metric_id,
                e
            );
            vec![]
        }
    };

    // Convert AssetPermissionInfo to BusterShareIndividual
    let individual_permissions = match individual_permissions_query {
        Ok(permissions) => {
            if permissions.is_empty() {
                None
            } else {
                Some(
                    permissions
                        .into_iter()
                        .map(|p| crate::metrics::types::BusterShareIndividual {
                            email: p.email,
                            role: p.role,
                            name: p.name,
                        })
                        .collect::<Vec<crate::metrics::types::BusterShareIndividual>>(),
                )
            }
        }
        Err(_) => None,
    };

    // Construct BusterMetric using resolved values
    Ok(BusterMetric {
        id: metric_file.id,
        metric_type: "metric".to_string(),
        name: resolved_name, // Use resolved name
        version_number: resolved_version_num, // Use resolved version number
        description: resolved_description, // Use resolved description
        file_name: metric_file.file_name, // Not versioned
        time_frame: resolved_time_frame, // Use resolved time frame
        datasets, // Fetched based on resolved_dataset_ids (for display purposes only)
        data_source_id: metric_file.data_source_id, // Use canonical ID (Uuid) from main record
        error: None, // Assume ok
        chart_config: Some(resolved_chart_config), // Use resolved chart config
        data_metadata, // Not versioned
        status: metric_file.verification, // Not versioned
        evaluation_score, // Not versioned
        evaluation_summary: metric_file.evaluation_summary.unwrap_or_default(), // Not versioned
        file, // YAML based on resolved content
        created_at: metric_file.created_at, // Not versioned
        updated_at: resolved_updated_at, // Use resolved updated_at (version or main record)
        sent_by_id: metric_file.created_by, // Not versioned
        sent_by_name: "".to_string(), // Placeholder
        sent_by_avatar_url: None, // Placeholder
        code: None, // Placeholder
        dashboards, // Fetched association, not versioned content
        collections, // Fetched association, not versioned content
        versions, // Full version history list
        permission, // Calculated access level
        sql: resolved_sql, // Use resolved SQL
        individual_permissions, // Not versioned
        publicly_accessible: metric_file.publicly_accessible, // Not versioned
        public_expiry_date: metric_file.public_expiry_date, // Not versioned
        public_enabled_by: public_enabled_by_user, // Not versioned
        public_password: metric_file.public_password, // Not versioned
    })
}
