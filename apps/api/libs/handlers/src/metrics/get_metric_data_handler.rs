use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    pool::get_pg_pool,
    schema::{dashboard_files, metric_files, metric_files_to_dashboard_files},
    types::{data_metadata::DataMetadata, MetricYml},
};
use diesel::{BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use query_engine::data_types::DataType;

use crate::metrics::{get_metric_for_dashboard_handler, get_metric_handler, BusterMetric};

/// Request structure for the get_metric_data handler
#[derive(Debug, Deserialize)]
pub struct GetMetricDataRequest {
    pub metric_id: Uuid,
    pub version_number: Option<i32>,
    pub limit: Option<i64>,
    pub password: Option<String>,
}

/// Structure for the metric data response
#[derive(Debug, Serialize)]
pub struct MetricDataResponse {
    pub metric_id: Uuid,
    pub data: Vec<IndexMap<String, DataType>>,
    pub data_metadata: DataMetadata,
}

/// Handler to retrieve both the metric definition and its associated data
pub async fn get_metric_data_handler(
    request: GetMetricDataRequest,
    user: AuthenticatedUser,
) -> Result<MetricDataResponse> {
    tracing::info!(
        "Getting metric data for metric_id: {}, user_id: {}",
        request.metric_id,
        user.id
    );

    // --- Step 1: Try retrieving metric with standard permission checks ---
    let metric_result = get_metric_handler(
        &request.metric_id,
        &user,
        request.version_number,
        request.password.clone(), // Clone password for potential reuse/logging
    )
    .await;

    let metric: BusterMetric = match metric_result {
        Ok(metric) => {
            tracing::debug!("Successfully retrieved metric via standard permissions.");
            metric
        }
        Err(e) => {
            // --- Step 2: Handle potential permission error ---
            let error_string = e.to_string().to_lowercase();
            let is_permission_error = error_string.contains("permission")
                || error_string.contains("expired")
                || error_string.contains("password");

            if is_permission_error {
                tracing::warn!(
                    "Initial metric access failed due to potential permission issue: {}. Checking public dashboard access.",
                    e
                );

                // --- Step 3: Check if metric belongs to a valid public dashboard ---
                let mut conn_check = get_pg_pool().get().await?;
                let now = Utc::now();

                let public_dashboard_exists = match metric_files_to_dashboard_files::table
                    .inner_join(dashboard_files::table.on(
                        dashboard_files::id.eq(metric_files_to_dashboard_files::dashboard_file_id),
                    ))
                    .filter(metric_files_to_dashboard_files::metric_file_id.eq(request.metric_id))
                    .filter(dashboard_files::publicly_accessible.eq(true))
                    .filter(dashboard_files::deleted_at.is_null())
                    .filter(
                        dashboard_files::public_expiry_date
                            .is_null()
                            .or(dashboard_files::public_expiry_date.gt(now)),
                    )
                    .select(dashboard_files::id) // Select any column to check existence
                    .first::<Uuid>(&mut conn_check) // Try to get the first matching ID
                    .await
                {
                    Ok(id) => Some(id),
                    Err(diesel::NotFound) => None,
                    Err(e) => {
                        tracing::error!("Error checking if public dashboard exists: {}", e);
                        return Err(anyhow!("Error checking if public dashboard exists: {}", e));
                    }
                };

                if public_dashboard_exists.is_some() {
                    // --- Step 4: Public dashboard found, fetch metric bypassing permissions ---
                    tracing::info!("Found associated public dashboard. Fetching metric definition without direct permissions.");
                    match get_metric_for_dashboard_handler(
                        &request.metric_id,
                        request.version_number,
                    )
                    .await
                    {
                        Ok(metric_via_dashboard) => {
                            tracing::debug!(
                                "Successfully retrieved metric via public dashboard association."
                            );
                            metric_via_dashboard // Use this metric definition
                        }
                        Err(fetch_err) => {
                            // If fetching via dashboard fails unexpectedly, return that error
                            tracing::error!("Failed to fetch metric via dashboard context even though public dashboard exists: {}", fetch_err);
                            return Err(fetch_err);
                        }
                    }
                } else {
                    // No public dashboard association found, return the original permission error
                    tracing::warn!("No valid public dashboard association found for metric. Returning original error.");
                    return Err(e);
                }
            } else {
                // Error was not permission-related, return original error
                tracing::error!("Metric retrieval failed for non-permission reason: {}", e);
                return Err(e);
            }
        }
    };

    // --- Step 5: Proceed with data fetching using the obtained metric definition ---
    tracing::debug!("Parsing metric definition from YAML to get SQL.");
    // Parse the metric definition from YAML to get SQL
    let metric_yml: MetricYml = match serde_yaml::from_str(&metric.file) {
        Ok(yml) => yml,
        Err(parse_err) => {
            tracing::error!("Failed to parse metric YAML: {}", parse_err);
            return Err(anyhow!("Failed to parse metric definition: {}", parse_err));
        }
    };
    let sql = metric_yml.sql;

    // --- USE DIRECT DATA SOURCE ID ---
    let data_source_id = metric.data_source_id; // Already a Uuid
    tracing::debug!(metric_id = %request.metric_id, data_source_id = %data_source_id, "Using direct data source ID from metric");

    tracing::info!(
        "Querying data for metric {}. Data source: {}, Limit: {:?}", // Removed dataset name as we don't fetch it anymore
        request.metric_id,
        data_source_id, // Use the direct ID
        request.limit
    );

    // Try to get cached metadata first
    let mut conn_meta = get_pg_pool().get().await?;
    let cached_metadata = metric_files::table
        .filter(metric_files::id.eq(request.metric_id))
        .select(metric_files::data_metadata)
        .first::<Option<DataMetadata>>(&mut conn_meta)
        .await
        .map_err(|e| anyhow!("Error retrieving cached metadata: {}", e))?;
    tracing::debug!("Cached metadata found: {}", cached_metadata.is_some());

    // Execute the query to get the metric data
    let query_result = match query_engine::data_source_query_routes::query_engine::query_engine(
        &data_source_id, // Use the direct ID
        &sql,
        request.limit,
    )
    .await
    {
        Ok(result) => {
            tracing::info!(
                "Successfully executed metric query. Rows returned: {}",
                result.data.len()
            );
            result
        }
        Err(e) => {
            tracing::error!(
                "Error executing metric query for metric {}: {}",
                request.metric_id,
                e
            );
            return Err(anyhow!("Error executing metric query: {}", e));
        }
    };

    // Determine which metadata to use
    let final_metadata = if let Some(metadata) = cached_metadata {
        tracing::debug!(
            "Using cached metadata. Cached rows: {}, Query rows: {}",
            metadata.row_count,
            query_result.data.len()
        );
        // Use cached metadata but update row count if it differs significantly or if cached count is 0
        // (We update if different because the cache might be stale regarding row count)
        if metadata.row_count != query_result.data.len() as i64 {
            tracing::debug!("Row count changed. Updating metadata row count.");
            let mut updated_metadata = metadata.clone();
            updated_metadata.row_count = query_result.data.len() as i64;
            // Potentially update updated_at? For now, just row count.
            updated_metadata
        } else {
            metadata
        }
    } else {
        tracing::debug!("No cached metadata found. Using metadata from query result.");
        // No cached metadata, use the one from query_result
        query_result.metadata.clone()
    };

    // Construct and return the response
    tracing::info!(
        "Successfully retrieved data for metric {}. Returning response.",
        request.metric_id
    );
    Ok(MetricDataResponse {
        metric_id: request.metric_id,
        data: query_result.data,
        data_metadata: final_metadata,
    })
}
