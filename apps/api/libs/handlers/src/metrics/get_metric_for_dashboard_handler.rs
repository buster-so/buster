use anyhow::{anyhow, Result};
use chrono::Utc;
use database::models::MetricFile;
use diesel::prelude::Queryable;
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use futures::future::join;
use serde_yaml;
use uuid::Uuid;

use crate::metrics::types::{AssociatedCollection, AssociatedDashboard, BusterMetric, Dataset};
use database::enums::AssetPermissionRole; // Keep for hardcoding permission
use database::pool::get_pg_pool;
use database::schema::{
    collections, collections_to_assets, dashboard_files, datasets, metric_files,
    metric_files_to_dashboard_files, metric_files_to_datasets,
};

use super::Version;

#[derive(Queryable)]
struct DatasetInfo {
    id: Uuid,
    name: String,
    data_source_id: Uuid,
}

/// Fetch ALL dashboards associated with the given metric id (no user filtering)
async fn fetch_associated_dashboards_unfiltered(
    metric_id: Uuid,
    conn: &mut AsyncPgConnection,
) -> Result<Vec<AssociatedDashboard>> {
    let associated_dashboards = metric_files_to_dashboard_files::table
        .inner_join(
            dashboard_files::table
                .on(dashboard_files::id.eq(metric_files_to_dashboard_files::dashboard_file_id)),
        )
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
        .filter(dashboard_files::deleted_at.is_null())
        .filter(metric_files_to_dashboard_files::deleted_at.is_null())
        // REMOVED: User permission join/filters
        .select((dashboard_files::id, dashboard_files::name))
        .load::<(Uuid, String)>(conn)
        .await?
        .into_iter()
        .map(|(id, name)| AssociatedDashboard { id, name })
        .collect();
    Ok(associated_dashboards)
}

/// Fetch ALL collections associated with the given metric id (no user filtering)
async fn fetch_associated_collections_unfiltered(
    metric_id: Uuid,
    conn: &mut AsyncPgConnection,
) -> Result<Vec<AssociatedCollection>> {
    let associated_collections = collections_to_assets::table
        .inner_join(collections::table.on(collections::id.eq(collections_to_assets::collection_id)))
        // REMOVED: User permission join/filters
        .filter(collections_to_assets::asset_id.eq(metric_id))
        .filter(collections_to_assets::asset_type.eq(database::enums::AssetType::MetricFile)) // Keep asset type filter
        .filter(collections::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .select((collections::id, collections::name))
        .load::<(Uuid, String)>(conn)
        .await?
        .into_iter()
        .map(|(id, name)| AssociatedCollection { id, name })
        .collect();
    Ok(associated_collections)
}

/// Handler to retrieve a metric by ID for display within a dashboard.
/// Assumes authentication/permission checks were done at the dashboard level.
/// Skips all metric-specific permission checks.
pub async fn get_metric_for_dashboard_handler(
    metric_id: &Uuid,
    version_number: Option<i32>,
) -> Result<BusterMetric> {
    let mut conn = get_pg_pool().get().await?;

    // 1. Fetch metric file directly by ID - NO PERMISSION CHECK
    let metric_file = metric_files::table
        .find(metric_id)
        .filter(metric_files::deleted_at.is_null())
        .first::<MetricFile>(&mut conn)
        .await
        .map_err(|e| {
            tracing::warn!(metric_id = %metric_id, "Metric file not found or DB error during direct fetch: {}", e);
            anyhow!("Metric file not found") // Keep error generic
        })?;

    // --- Permission is implicitly CanView because access is via dashboard ---
    let permission = AssetPermissionRole::CanView;

    // Declare variables to hold potentially versioned data
    let resolved_name: String;
    let resolved_description: Option<String>;
    let resolved_time_frame: String;
    let resolved_chart_config: database::types::ChartConfig;
    let resolved_sql: String;
    let resolved_updated_at: chrono::DateTime<Utc>;
    let resolved_version_num: i32;
    let resolved_content_for_yaml: database::types::MetricYml;

    // Data metadata always comes from the main table record (current state)
    let data_metadata: Option<database::types::DataMetadata> = metric_file.data_metadata;

    if let Some(requested_version) = version_number {
        // --- Specific version requested ---
        tracing::debug!(metric_id = %metric_id, version = requested_version, "Attempting to retrieve specific version for dashboard context");
        if let Some(v) = metric_file.version_history.get_version(requested_version) {
            match &v.content {
                database::types::VersionContent::MetricYml(content) => {
                    let version_content = (**content).clone(); // Deref the Box and clone
                    resolved_name = version_content.name.clone();
                    resolved_description = version_content.description.clone();
                    resolved_time_frame = version_content.time_frame.clone();
                    resolved_chart_config = version_content.chart_config.clone();
                    resolved_sql = version_content.sql.clone();
                    resolved_updated_at = v.updated_at;
                    resolved_version_num = v.version_number;
                    resolved_content_for_yaml = version_content; // Use this content for YAML

                    tracing::debug!(metric_id = %metric_id, version = requested_version, "Successfully retrieved specific version content for dashboard");
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
        tracing::debug!(metric_id = %metric_id, "No specific version requested, using current metric file content for dashboard");
        let current_content = metric_file.content.clone(); // Use the content directly from the fetched MetricFile
        resolved_name = metric_file.name.clone(); // Use main record name
        resolved_description = current_content.description.clone();
        resolved_time_frame = current_content.time_frame.clone();
        resolved_chart_config = current_content.chart_config.clone();
        resolved_sql = current_content.sql.clone();
        resolved_updated_at = metric_file.updated_at; // Use main record updated_at
        resolved_version_num = metric_file.version_history.get_version_number();
        resolved_content_for_yaml = current_content; // Use this content for YAML

        tracing::debug!(metric_id = %metric_id, latest_version = resolved_version_num, "Determined latest version number for dashboard");
    }

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
                // Return empty or handle error as appropriate for dashboard context
                Vec::new() 
            }
        };

    // Get dataset information for the resolved dataset IDs (using the fetched IDs)
    let mut datasets = Vec::new();
    if !resolved_dataset_ids.is_empty() {
        // Fetch only if there are IDs to prevent unnecessary query
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

    // Concurrently fetch associated dashboards and collections (unfiltered versions)
    let metrics_id_clone = *metric_id;

    // Await both futures concurrently - NOTE: Need to handle connection borrowing carefully.
    // It's safer to get the connection again or pass it differently if needed.
    // For now, let's assume the initial `conn` can be reused or handle potential errors.
    // A better approach might involve passing the pool and getting connections inside helpers.
    // Re-getting connection for safety:
    let mut conn_dash = get_pg_pool().get().await?;
    let mut conn_coll = get_pg_pool().get().await?;
    let dashboards_future = fetch_associated_dashboards_unfiltered(metrics_id_clone, &mut conn_dash);
    let collections_future = fetch_associated_collections_unfiltered(metrics_id_clone, &mut conn_coll);

    let (dashboards_result, collections_result) = join(dashboards_future, collections_future).await;


    // Handle results, logging errors but returning empty Vecs for failed tasks
    let dashboards = match dashboards_result {
        Ok(dashboards) => dashboards,
        Err(e) => {
            tracing::error!(
                "Failed to fetch associated dashboards (unfiltered) for metric {}: {}",
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
                "Failed to fetch associated collections (unfiltered) for metric {}: {}",
                metric_id,
                e
            );
            vec![]
        }
    };

    // Convert the selected content to pretty YAML for the 'file' field
    let file = match serde_yaml::to_string(&resolved_content_for_yaml) {
        Ok(yaml) => yaml,
        Err(e) => {
            tracing::error!(metric_id = %metric_id, error = %e, "Failed to serialize selected metric content to YAML for dashboard");
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

    // Construct BusterMetric using resolved values
    Ok(BusterMetric {
        id: metric_file.id,
        metric_type: "metric".to_string(),
        name: resolved_name,
        version_number: resolved_version_num,
        description: resolved_description,
        file_name: metric_file.file_name,
        time_frame: resolved_time_frame,
        datasets,
        data_source_id: metric_file.data_source_id, // Use canonical Uuid from main record
        error: None, // Assume ok
        chart_config: Some(resolved_chart_config),
        data_metadata,
        status: metric_file.verification,
        evaluation_score,
        evaluation_summary: metric_file.evaluation_summary.unwrap_or_default(),
        file, // YAML based on resolved content
        created_at: metric_file.created_at,
        updated_at: resolved_updated_at,
        sent_by_id: metric_file.created_by,
        sent_by_name: "".to_string(), // Placeholder - user info not needed/fetched
        sent_by_avatar_url: None,    // Placeholder - user info not needed/fetched
        code: None, // Placeholder
        dashboards, // Unfiltered associations
        collections, // Unfiltered associations
        versions, // Full version history list
        permission, // Hardcoded to CanView
        sql: resolved_sql,
        // Sharing fields are irrelevant/defaulted in this context
        individual_permissions: None,
        publicly_accessible: false, // Default value
        public_expiry_date: None,   // Default value
        public_enabled_by: None,    // Default value
        public_password: None,      // Default value
    })
} 