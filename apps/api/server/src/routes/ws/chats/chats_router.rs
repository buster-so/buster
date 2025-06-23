use std::sync::Arc;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use middleware::AuthenticatedUser;

use crate::routes::ws::ws::SubscriptionRwLock;

use super::post_chat::post_thread;

#[derive(Deserialize, Serialize, Debug, Clone)]
pub enum ChatsRoute {
    #[serde(rename = "/chats/post")]
    Post,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum ChatEvent {
    Thought,
    InitializeThread,
    ModifyVisualization,
    InitializeDraftSession,
    CheckpointThread,
    CompletedThread,
    JoinedThread,
    LeftThread,
    GeneratingResponse,
    GeneratingMetricTitle,
    #[serde(rename = "GeneratingDescription")]
    GeneratingSummaryQuestion,
    GeneratingTimeFrame,
    FixingSql,
    GetThreadState,
    UpdateThreadState,
    GetThreadsList,
    UpdateThreadsList,
    PostThread,
    IdentifyingDataset,
    IdentifyingTerms,
    GeneratingSql,
    FetchingData,
    DeleteThreadState,
    BulkDeleteThreads,
    SearchThreads,
    Unsubscribed,
    DuplicateThread,
    SqlEvaluation,
    InitializeChat,
    GeneratingTitle,
    GeneratingResponseMessage,
    GeneratingReasoningMessage,
    Complete,
    GetChat,
}

pub async fn chats_router(
    route: ChatsRoute,
    data: Value,
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &AuthenticatedUser,
) -> Result<()> {
    match route {
        ChatsRoute::Post => {
            let req = serde_json::from_value(data)?;

            post_thread(user, req).await?;
        }
    };

    Ok(())
}

impl ChatsRoute {
    pub fn from_str(path: &str) -> Result<Self> {
        match path {
            "/chats/post" => Ok(Self::Post),
            _ => Err(anyhow!("Invalid path")),
        }
    }
}
