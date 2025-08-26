use anyhow::Result;
use chrono::Local;
use dataset_security::get_permissioned_datasets;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use secrets::get_secret_sync_or_default;
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

// Import the modes and necessary types
use crate::agents::modes::{
    // Assuming modes/mod.rs is one level up
    self, // Import the module itself for functions like determine_agent_state
    determine_agent_state,
    AgentState,
    ModeAgentData,
    ModeConfiguration,
};

// Import Agent related types
use crate::{agent::ModeProvider, Agent, AgentError, AgentExt, AgentThread}; // Added ModeProvider and corrected path

use litellm::AgentMessage;

// Import the semantic layer models
use semantic_layer::models::Model; // Assuming models.rs is accessible like this

// Import AgentState and determine_agent_state (assuming they are pub in modes/mod.rs or similar)
// If not, they might need to be moved or re-exported.
// For now, let's assume they are accessible via crate::agents::modes::{AgentState, determine_agent_state}
// If this path is wrong, adjust it based on where these are defined.

#[derive(Debug, Serialize, Deserialize)]
pub struct BusterSuperAgentOutput {
    pub message: String,
    pub duration: i64,
    pub thread_id: Uuid,
    pub messages: Vec<AgentMessage>,
    pub message_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BusterSuperAgentInput {
    pub prompt: String,
    pub thread_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
}

// Create a struct to hold the data needed by the provider
#[derive(Clone)]
struct BusterModeProvider {
    agent_data: ModeAgentData,
}

#[async_trait::async_trait]
impl ModeProvider for BusterModeProvider {
    async fn get_configuration_for_state(
        &self,
        state: &HashMap<String, Value>,
    ) -> Result<ModeConfiguration> {
        let current_mode = determine_agent_state(state);

        // Extract syntax (it might be None if not set yet, which is fine)
        let data_source_syntax = state
            .get("data_source_syntax")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Call the appropriate get_configuration function based on the mode
        // Pass the extracted syntax (or None) to all modes
        let mode_config = match current_mode {
            AgentState::Initializing => {
                modes::initialization::get_configuration(&self.agent_data, data_source_syntax)
            }
            AgentState::DataCatalogSearch => {
                modes::data_catalog_search::get_configuration(&self.agent_data, data_source_syntax)
            }
            AgentState::Planning => {
                modes::planning::get_configuration(&self.agent_data, data_source_syntax)
            }
            AgentState::AnalysisExecution => {
                // Syntax is guaranteed to be extracted here or passed as None
                modes::analysis::get_configuration(&self.agent_data, data_source_syntax)
            }
            AgentState::Review => {
                modes::review::get_configuration(&self.agent_data, data_source_syntax)
            }
        };

        Ok(mode_config)
    }
}

// --- BusterMultiAgent ---

pub struct BusterMultiAgent {
    agent: Arc<Agent>,
}

impl AgentExt for BusterMultiAgent {
    // Update AgentExt implementation to return the Arc
    fn get_agent_arc(&self) -> &Arc<Agent> {
        &self.agent
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatasetWithDescriptions {
    pub name: String,
    pub description: String,
}

impl DatasetWithDescriptions {
    pub fn to_string(&self) -> String {
        format!("{}: {}", self.name, self.description)
    }
}

// Define structs for YAML parsing
// #[derive(Debug, Deserialize)]
// struct YamlRoot {
// models: Vec<ModelInfo>,
// }

// #[derive(Debug, Deserialize)]
// struct ModelInfo {
// name: String,
// description: String,
// }

impl BusterMultiAgent {
    pub async fn new(user_id: Uuid, session_id: Uuid, is_follow_up: bool) -> Result<Self> {
        // Prepare data for modes
        let todays_date = Arc::new(Local::now().format("%Y-%m-%d").to_string());

        // Get permissioned datasets and extract names/descriptions from the first model
        let permissioned_datasets = get_permissioned_datasets(&user_id, 0, 10000).await?;
        let dataset_descriptions: Vec<String> = permissioned_datasets
            .into_iter()
            .filter_map(|ds| ds.yml_content) // Get Some(String), filter out None
            .map(|content| serde_yaml::from_str::<Model>(&content)) // Parse String -> Result<SemanticLayerSpec, Error>
            .filter_map(|result| {
                // Handle Result
                match result {
                    Ok(model) => {
                        // Extract info from the first model if available
                        // model.description is Option<String>, handle it
                        let description = model
                            .description
                            .as_deref()
                            .unwrap_or("No description available");
                        Some(format!("{}: {}", model.name, description))
                    }
                    Err(e) => {
                        tracing::warn!("Failed to parse dataset YAML: {}", e);
                        None // Filter out errors
                    }
                }
            })
            .collect();
        let dataset_descriptions = Arc::new(dataset_descriptions); // Wrap in Arc

        let agent_data = ModeAgentData {
            dataset_with_descriptions: dataset_descriptions, // Use the correct field name 'dataset_with_descriptions'
            todays_date,
        };

        // Create the mode provider
        let mode_provider = Arc::new(BusterModeProvider { agent_data });

        let model = if get_secret_sync_or_default("ENVIRONMENT", "development") == "local" {
            "o4-mini".to_string()
        } else {
            "o4-mini".to_string()
        };

        // Create agent, passing the provider
        let agent = Arc::new(Agent::new(
            model, // Initial model (can be overridden by first mode)
            user_id,
            session_id,
            "buster_multi_agent".to_string(),
            None,          // api_key
            None,          // base_url
            mode_provider, // Pass the provider
        ));

        // Set the initial is_follow_up flag in state
        agent
            .set_state_value("is_follow_up".to_string(), Value::Bool(is_follow_up))
            .await;

        let buster_agent = Self { agent };

        Ok(buster_agent)
    }

    pub async fn run(
        self: &Arc<Self>,
        thread: &mut AgentThread,
    ) -> Result<broadcast::Receiver<Result<AgentMessage, AgentError>>> {
        if let Some(user_prompt) = self.get_latest_user_message(thread) {
            self.agent // Use self.agent directly
                .set_state_value("user_prompt".to_string(), Value::String(user_prompt))
                .await;
        } else {
            // Handle case where there might not be a user message yet (e.g., agent starts convo?)
            self.agent
                .set_state_value("user_prompt".to_string(), Value::Null)
                .await;
        }

        // Mode configuration now happens inside Agent::process_thread_with_depth via the provider

        // Start processing using the configured agent
        // Call stream_process_thread using the AgentExt trait method on self
        let rx = self.stream_process_thread(thread).await?;

        Ok(rx)
    }

    /// Shutdown the manager agent and all its tools
    pub async fn shutdown(&self) -> Result<()> {
        self.agent.shutdown().await // Use self.agent directly
    }

    /// Gets the most recent user message from the agent thread
    pub fn get_latest_user_message(&self, thread: &AgentThread) -> Option<String> {
        // Iterate through messages in reverse order to find the most recent user message
        for message in thread.messages.iter().rev() {
            if let AgentMessage::User { content, .. } = message {
                return Some(content.clone());
            }
        }
        None
    }
}

// Make sure the imports for tools are correct, potentially needing adjustment
// if tools were moved or their paths changed relative to this file.
