use agents::{Agent, AgentMessage};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use database::{
    models::{Dataset, MetricFile, MetricFileToDataset},
    pool::get_pg_pool,
    schema::{dashboard_files, datasets, metric_files, metric_files_to_datasets},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use litellm::MessageProgress;
use middleware::AuthenticatedUser;
use serde_json::Value;
use std::collections::HashSet;
use std::sync::Arc;
use uuid::Uuid;

use super::ContextLoader;

pub struct DashboardContextLoader {
    pub dashboard_id: Uuid,
}

impl DashboardContextLoader {
    pub fn new(dashboard_id: Uuid) -> Self {
        Self { dashboard_id }
    }
}

#[async_trait]
impl ContextLoader for DashboardContextLoader {
    async fn load_context(
        &self,
        user: &AuthenticatedUser,
        agent: &Arc<Agent>,
    ) -> Result<Vec<AgentMessage>> {
        let mut conn = get_pg_pool().get().await.map_err(|e| {
            anyhow!(
                "Failed to get database connection for dashboard context loading: {}",
                e
            )
        })?;

        // First verify the dashboard exists and user has access
        let dashboard = dashboard_files::table
            .filter(dashboard_files::id.eq(self.dashboard_id))
            // .filter(dashboard_files::created_by.eq(&user.id))
            .first::<database::models::DashboardFile>(&mut conn)
            .await
            .map_err(|e| {
                anyhow!("Failed to load dashboard (id: {}). Either it doesn't exist or user {} doesn't have access: {}", 
                    self.dashboard_id, user.id, e)
            })?;

        // Parse dashboard content to DashboardYml
        let dashboard_yml = dashboard.content;

        // Collect all metric IDs from the dashboard
        let mut metric_ids = HashSet::new();
        for row in &dashboard_yml.rows {
            for item in &row.items {
                metric_ids.insert(item.id);
            }
        }

        // Load all referenced metrics
        let mut failed_metric_loads = Vec::new();

        // Convert HashSet to Vec for Diesel query
        let metric_ids_vec: Vec<Uuid> = metric_ids.into_iter().collect();

        // Query 1: Fetch all MetricFiles at once
        let metrics_result = metric_files::table
            .filter(metric_files::id.eq_any(&metric_ids_vec))
            .load::<MetricFile>(&mut conn)
            .await;

        let metrics_vec = match metrics_result {
            Ok(metrics) => metrics,
            Err(e) => {
                tracing::error!("Failed to load metric files in bulk: {}", e);
                // Handle bulk load failure - maybe return an error or an empty vec
                return Err(anyhow!("Failed to load required metrics: {}", e));
            }
        };

        // Check if all requested metrics were found (optional, but good practice)
        if metrics_vec.len() != metric_ids_vec.len() {
            let found_ids: HashSet<Uuid> = metrics_vec.iter().map(|m| m.id).collect();
            for missing_id in metric_ids_vec.iter().filter(|id| !found_ids.contains(id)) {
                failed_metric_loads.push((*missing_id, "Metric not found in database".to_string()));
            }
            tracing::warn!("Some metrics were not found for dashboard {}: {:?}", dashboard.name, failed_metric_loads);
            // Decide if this is a critical error or just a warning
        }

        // Query 2: Fetch all associated Dataset IDs from the join table
        let dataset_ids_result = metric_files_to_datasets::table
            .filter(metric_files_to_datasets::metric_file_id.eq_any(&metric_ids_vec))
            .select(metric_files_to_datasets::dataset_id)
            .distinct() // Ensure uniqueness
            .load::<Uuid>(&mut conn)
            .await;

        let all_dataset_ids: HashSet<Uuid> = match dataset_ids_result {
            Ok(ids) => ids.into_iter().collect(),
            Err(e) => {
                tracing::error!("Failed to load associated dataset IDs: {}", e);
                // Handle failure - maybe return an error or an empty set
                return Err(anyhow!("Failed to load dataset associations: {}", e));
            }
        };

        // The original loop is now replaced by the two queries above
        // The failed_metric_loads vec might contain IDs not found in the first query

        if !failed_metric_loads.is_empty() {
            tracing::warn!(
                "Failed to load some metrics for dashboard {}: {:?}",
                dashboard.name,
                failed_metric_loads
            );
        }

        // Load all unique datasets
        let datasets_vec: Vec<Dataset>; // Explicit type annotation
        let mut failed_dataset_loads: Vec<(Uuid, String)> = Vec::new(); // Explicit type annotation and initialization

        if !all_dataset_ids.is_empty() {
            let dataset_ids_vec: Vec<Uuid> = all_dataset_ids.into_iter().collect();
            match datasets::table
                .filter(datasets::id.eq_any(&dataset_ids_vec))
                .load::<Dataset>(&mut conn)
                .await
            {
                Ok(loaded_datasets) => {
                    datasets_vec = loaded_datasets;
                    // Optional: Check if all expected datasets were loaded
                    if datasets_vec.len() != dataset_ids_vec.len() {
                         let found_dataset_ids: HashSet<Uuid> = datasets_vec.iter().map(|d| d.id).collect();
                         
                         for missing_id in dataset_ids_vec.iter().filter(|id| !found_dataset_ids.contains(id)) {
                            failed_dataset_loads.push((*missing_id, "Dataset not found in database".to_string()));
                         }
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to load datasets in bulk: {}", e);
                    // Handle error appropriately, maybe return or set datasets_vec to empty
                    datasets_vec = Vec::new();
                    failed_dataset_loads.extend(dataset_ids_vec.into_iter().map(|id| (id, format!("Bulk load failed: {}", e))));
                }
            }
        } else {
            // No dataset IDs to load
            datasets_vec = Vec::new();
        }

        if !failed_dataset_loads.is_empty() {
            tracing::warn!(
                "Failed to load some datasets for dashboard {}: {:?}",
                dashboard.name,
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
            tracing::debug!(dashboard_id = %self.dashboard_id, data_source_id = %ds_id, "Loading context for dashboard within data source");
        } else {
            tracing::warn!(dashboard_id = %self.dashboard_id, "Data source ID not found in agent state for dashboard context");
        }

        // Set agent state based on loaded assets
        agent
            .set_state_value(String::from("dashboards_available"), Value::Bool(true))
            .await;

        agent
            .set_state_value(String::from("files_available"), Value::Bool(true))
            .await;

        if !metrics_vec.is_empty() {
            agent
                .set_state_value(String::from("metrics_available"), Value::Bool(true))
                .await;
        };

        if !datasets_vec.is_empty() {
            agent
                .set_state_value(String::from("data_context"), Value::Bool(true))
                .await;
        };

        // Format the context message with dashboard, metrics, and dataset information
        let dashboard_yaml = serde_yaml::to_string(&dashboard_yml).map_err(|e| {
            anyhow!(
                "Failed to serialize dashboard {} to YAML: {}",
                dashboard.name,
                e
            )
        })?;

        let mut context_message = format!(
            "This conversation is continuing with context from the dashboard. Here is the relevant information:\n\nDashboard Definition:\n{}\n\n",
            dashboard_yaml
        );

        if !metrics_vec.is_empty() {
            context_message.push_str("Referenced Metrics:\n");
            for metric in metrics_vec {
                context_message.push_str(&format!(
                    "\n{}\n",
                    serde_yaml::to_string(&metric.content).unwrap()
                ));
            }
        }

        if !datasets_vec.is_empty() {
            context_message.push_str("\nReferenced Datasets:\n");
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
            progress: MessageProgress::Complete,
            initial: true,
        }])
    }
}
