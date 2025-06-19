use crate::Agent;
use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc; // Assuming Agent is accessible at this path

pub mod analysis;
pub mod data_catalog_search;
pub mod follow_up_initialization;
pub mod initialization;
pub mod planning;
pub mod review;

// Renaming from the attached file listing for clarity
// pub use analysis::AgentState as AnalysisAgentState;
// pub use data_catalog_search::AgentState as DataCatalogSearchAgentState;

// --- Shared Mode Structures ---

/// Data required by different modes to generate their configuration.
#[derive(Clone)] // Cloneable if needed to pass around easily
pub struct ModeAgentData {
    pub dataset_with_descriptions: Arc<Vec<String>>,
    pub todays_date: Arc<String>,
    // Add other shared data if needed by modes, e.g., user_id, session_id if not in Agent state
}

/// Configuration specific to an agent mode.
pub struct ModeConfiguration {
    /// The system prompt to use for the LLM call in this mode.
    pub prompt: String,
    /// The specific LLM model identifier (e.g., "gemini-2.5-pro-exp-03-25") to use for this mode.
    pub model: String,
    /// An async function/closure responsible for clearing existing tools
    /// and loading the specific tools required for this mode onto the agent.
    pub tool_loader:
        Box<dyn Fn(&Arc<Agent>) -> Pin<Box<dyn Future<Output = Result<()>> + Send>> + Send + Sync>,
    /// A list of tool names that, upon successful execution in this mode,
    /// should terminate the agent's processing loop.
    pub terminating_tools: Vec<String>,
}

// --- Agent State Definition and Determination ---
// It's better to have a single unified AgentState enum if possible.
// Moving the definition from buster_multi_agent.rs here seems appropriate.

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum AgentState {
    Initializing,
    DataCatalogSearch,
    Planning,
    AnalysisExecution,
    Review,
}

// Moving the state determination logic here as well.
// This function determines the *logical* state the agent should be in based on its memory.
pub fn determine_agent_state(state: &HashMap<String, Value>) -> AgentState {
    let is_follow_up = state
        .get("is_follow_up")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let searched_catalog = state
        .get("searched_data_catalog")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    // Let's refine this: check if data_context has meaningful content, not just if key exists
    let has_data_context = state.get("data_context").map_or(false, |v| {
        !v.is_null() && (!v.is_string() || !v.as_str().unwrap_or("").is_empty())
    });
    let has_plan = state
        .get("plan_available")
        .and_then(Value::as_bool)
        .unwrap_or(false); // Check if plan is marked available
    let needs_review = state
        .get("review_needed")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let has_user_prompt = state.contains_key("user_prompt"); // Check if latest user prompt is stored

    // 1. Handle the state before the user provides their first prompt in this turn
    //    If it's not a follow-up and there's no prompt, it's the initial state.
    //    If it IS a follow-up, we proceed to the next checks even without a new prompt,
    //    as the follow-up flag indicates we should continue the existing flow.
    if !has_user_prompt && !is_follow_up {
        return AgentState::Initializing;
    }

    // 2. Review always takes precedence after user speaks (or if flagged from previous turn)
    if needs_review {
        return AgentState::Review;
    }

    // 3. If we haven't searched the catalog yet (or need to search again for follow-up), do that now.
    //    This applies to both initial requests and follow-ups that might require new data.
    if !searched_catalog {
        return AgentState::DataCatalogSearch;
    }

    // 4. If we have context but no plan, plan.
    //    This covers initial runs after search and follow-ups needing planning.
    if has_data_context && !has_plan {
        return AgentState::Planning;
    }

    // 5. If we have context and a plan, execute analysis.
    //    This covers initial runs and follow-ups continuing analysis.
    if has_data_context && has_plan {
        return AgentState::AnalysisExecution;
    }

    // 6. Fallback: If state is ambiguous (e.g., search done, no context added, no review needed).
    //    Maybe the search found nothing relevant. In this case, Planning is the next logical step
    //    to decide how to respond (e.g., using Done tool).
    //    This covers both initial and follow-up scenarios where planning is needed after an inconclusive search.
    if searched_catalog && !has_data_context && !has_plan {
        return AgentState::Planning;
    }

    // 7. Default fallback if no other state fits. Revert to Initializing.
    //    This handles unexpected state combinations.
    AgentState::Initializing

    // Old logic:
    // // 1. Handle states before the user provides their first prompt in this turn/session
    // if !has_user_prompt {
    //     return if is_follow_up {
    //         AgentState::FollowUpInitialization // Removed
    //     } else {
    //         AgentState::Initializing
    //     };
    // }
    //
    // // 2. Review always takes precedence after user speaks
    // if needs_review {
    //     return AgentState::Review;
    // }
    //
    // // 3. If we haven't searched the catalog yet, do that now (initial or follow-up)
    // //    This is the key change: check this condition before others like has_data_context
    // if !searched_catalog {
    //     return AgentState::DataCatalogSearch;
    // }
    //
    // // 4. If we have context but no plan, plan
    // if has_data_context && !has_plan {
    //     return AgentState::Planning;
    // }
    //
    // // 5. If we have context and a plan, execute analysis
    // if has_data_context && has_plan {
    //     return AgentState::AnalysisExecution;
    // }
    //
    // // 6. Fallback: If the state is ambiguous after searching and without needing review
    // //    (e.g., search happened but no context was added, or no plan needed).
    // //    Revert to an earlier appropriate state.
    // if is_follow_up {
    //     // If it was a follow-up, perhaps return to follow-up init or planning?
    //     // Let's choose FollowUpInitialization as a safe default if planning/analysis aren't ready.
    //     AgentState::FollowUpInitialization // Removed
    // } else {
    //      // If it was initial, perhaps return to init or planning?
    //      // Let's choose Initializing as a safe default if planning/analysis aren't ready.
    //     AgentState::Initializing
    // }
}
