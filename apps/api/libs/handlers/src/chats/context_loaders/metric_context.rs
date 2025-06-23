use agents::{Agent, AgentMessage};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::metric_files::fetch_metric_file_with_permissions,
    models::{Dataset, MetricFile},
    pool::get_pg_pool,
    schema::{datasets, metric_files, metric_files_to_datasets},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde_json::Value;
use std::sync::Arc;
use uuid::Uuid;

use super::ContextLoader;

pub struct MetricContextLoader {
    pub metric_id: Uuid,
}

impl MetricContextLoader {
    pub fn new(metric_id: Uuid) -> Self {
        Self { metric_id }
    }
}

#[async_trait]
impl ContextLoader for MetricContextLoader {
    async fn load_context(
        &self,
        user: &AuthenticatedUser,
        agent: &Arc<Agent>,
    ) -> Result<Vec<AgentMessage>> {
        // Note: We don't need a separate connection pool get here,
        // fetch_metric_file_with_permissions handles it internally.

        // 1. Fetch metric file ensuring user has at least view permission
        let metric_with_permission_option =
            fetch_metric_file_with_permissions(&self.metric_id, &user.id)
                .await
                .map_err(|e| {
                    anyhow!(
                        "Failed database lookup for metric {} permissions: {}",
                        self.metric_id,
                        e
                    )
                })?;

        let (metric, permission_level) = match metric_with_permission_option {
            Some(mfwp) => (mfwp.metric_file, mfwp.permission),
            None => {
                tracing::warn!(
                    metric_id = %self.metric_id,
                    user_id = %user.id,
                    "Metric not found or no direct permission found during context load."
                );
                // Even if not found, we need to check if it's maybe publicly accessible?
                // For context loading, let's keep it simple: if no direct record/permission, deny.
                // If public access needs to be considered here, this logic would need expansion,
                // potentially reusing more from get_metric_handler.
                 return Err(anyhow!(
                    "Metric file {} not found or you lack direct permission.",
                    self.metric_id
                ));
            }
        };

        // 2. Verify sufficient permission level (at least CanView)
        // We assume CanView is the minimum required to load context.
        // Adjust if different logic (like public access) should apply here.
        match permission_level {
            Some(AssetPermissionRole::CanView) |
            Some(AssetPermissionRole::CanEdit) |
            Some(AssetPermissionRole::FullAccess) |
            Some(AssetPermissionRole::Owner) => {
                 tracing::debug!(metric_id = %self.metric_id, user_id = %user.id, ?permission_level, "Sufficient permission found for context load.");
            }
            _ => {
                 tracing::warn!(metric_id = %self.metric_id, user_id = %user.id, ?permission_level, "Insufficient permission to load metric context.");
                 return Err(anyhow!(
                    "You don't have sufficient permission (need at least CanView) to load context for metric {}.",
                    self.metric_id
                ));
            }
        }


        // Get a connection for subsequent queries
        let mut conn = get_pg_pool().get().await.map_err(|e| {
            anyhow!(
                "Failed to get database connection for dataset loading: {}",
                e
            )
        })?;

        // Get the metric content as MetricYml
        let metric_yml = metric.content; // Use the metric fetched above

        // --- Optimized Dataset Loading ---

        // Query 1: Fetch associated Dataset IDs from the join table
        let dataset_ids_result = metric_files_to_datasets::table
            .filter(metric_files_to_datasets::metric_file_id.eq(self.metric_id))
            .select(metric_files_to_datasets::dataset_id)
            .load::<Uuid>(&mut conn)
            .await;

        let dataset_ids_vec: Vec<Uuid> = match dataset_ids_result {
            Ok(ids) => ids,
            Err(e) => {
                tracing::error!(
                    "Failed to load associated dataset IDs for metric {}: {}",
                    self.metric_id,
                    e
                );
                // Return an error or handle as appropriate (e.g., empty Vec)
                return Err(anyhow!(
                    "Failed to load dataset associations for metric: {}",
                    e
                ));
            }
        };

        // Query 2: Fetch all Dataset objects at once
        let datasets_vec: Vec<Dataset>; // Explicit type annotation
        let mut failed_dataset_loads: Vec<(Uuid, String)> = Vec::new(); // Explicit type annotation

        if !dataset_ids_vec.is_empty() {
            match datasets::table
                .filter(datasets::id.eq_any(&dataset_ids_vec))
                .load::<Dataset>(&mut conn)
                .await
            {
                Ok(loaded_datasets) => {
                    datasets_vec = loaded_datasets;
                    // Optional: Check if all expected datasets were loaded
                    if datasets_vec.len() != dataset_ids_vec.len() {
                        let found_dataset_ids: std::collections::HashSet<Uuid> =
                            datasets_vec.iter().map(|d| d.id).collect();
                        for missing_id in dataset_ids_vec
                            .iter()
                            .filter(|id| !found_dataset_ids.contains(id))
                        {
                            failed_dataset_loads
                                .push((*missing_id, "Dataset not found in database".to_string()));
                        }
                    }
                }
                Err(e) => {
                    tracing::error!(
                        "Failed to load datasets in bulk for metric {}: {}",
                        self.metric_id,
                        e
                    );
                    datasets_vec = Vec::new(); // Set to empty on failure
                    failed_dataset_loads.extend(
                        dataset_ids_vec
                            .into_iter()
                            .map(|id| (id, format!("Bulk load failed: {}", e))),
                    );
                }
            }
        } else {
            // No associated datasets found
            datasets_vec = Vec::new();
        }

        // Remove the old commented-out loop if present
        // // for dataset_id in dataset_ids {
        // //     match datasets::table
        // //         .filter(datasets::id.eq(dataset_id))
        // //         .first::<Dataset>(&mut conn)
        // //         .await
        // //     {
        // //         Ok(dataset) => datasets_vec.push(dataset),
        // //         Err(e) => failed_dataset_loads.push((dataset_id, e.to_string())),
        // //     }
        // // }
        // --- End Optimized Dataset Loading ---

        if !failed_dataset_loads.is_empty() {
            tracing::warn!(
                "Failed to load some datasets for metric {}: {:?}",
                metric.name,
                failed_dataset_loads
            );
        }

        // NEW: Load data_source_id from agent state
        let data_source_id: Option<Uuid> = match agent.get_state_value("data_source_id").await {
            Some(Value::String(id_str)) => Uuid::parse_str(&id_str).ok(),
            _ => None,
        };

        // Example of potentially using data_source_id (logging it here)
        if let Some(ds_id) = data_source_id {
            tracing::debug!(metric_id = %self.metric_id, data_source_id = %ds_id, "Loading context for metric within data source");
        } else {
            tracing::warn!(metric_id = %self.metric_id, "Data source ID not found in agent state for metric context");
        }

        // Set agent state based on loaded assets
        agent
            .set_state_value(String::from("metrics_available"), Value::Bool(true))
            .await;

        agent
            .set_state_value(String::from("files_available"), Value::Bool(true))
            .await;

        if !datasets_vec.is_empty() {
            agent
                .set_state_value(String::from("data_context"), Value::Bool(true))
                .await;
        };

        // Format the context message with metric and dataset information
        let metric_yaml = serde_yaml::to_string(&metric_yml)
            .map_err(|e| anyhow!("Failed to serialize metric {} to YAML: {}", metric.name, e))?;

        let mut context_message = format!(
            "This conversation is continuing with context from the metric. Here is the relevant information:\n\nMetric Definition:\n{}\n\n",
            metric_yaml
        );

        if !datasets_vec.is_empty() {
            context_message.push_str("Referenced Datasets:\n");
            for dataset in datasets_vec {
                if let Some(yml_content) = dataset.yml_file {
                    context_message.push_str(&format!("\n{}\n", yml_content));
                } else {
                    tracing::warn!("Dataset {} has no YML content", dataset.id);
                }
            }
        }

        Ok(vec![AgentMessage::Assistant {
            id: None,
            content: Some(context_message),
            name: None,
            tool_calls: None,
            progress: litellm::MessageProgress::Complete,
            initial: true,
        }])
    }
}
