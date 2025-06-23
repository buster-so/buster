use std::sync::Arc;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use middleware::AuthenticatedUser;

use super::{
    chats::chats_router::{chats_router, ChatsRoute},
    ws::SubscriptionRwLock,
};

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(untagged)]
pub enum WsRoutes {
    Chats(ChatsRoute),
}

impl WsRoutes {
    pub fn from_str(path: &str) -> Result<Self> {
        let first_segment = path
            .split('/')
            .nth(1)
            .ok_or_else(|| anyhow!("Invalid path"))?;

        match first_segment {
            "chats" => Ok(Self::Chats(ChatsRoute::from_str(path)?)),
            _ => Err(anyhow!("Invalid path")),
        }
    }
}

pub async fn ws_router(
    route: String,
    payload: Value,
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &AuthenticatedUser,
) -> Result<()> {
    let parsed_route: WsRoutes = match WsRoutes::from_str(&route) {
        Ok(parsed_route) => parsed_route,
        Err(e) => {
            return Err(anyhow!("Error parsing route: {:?}", e));
        }
    };

    let result = match parsed_route {
        WsRoutes::Chats(threads_route) => {
            chats_router(threads_route, payload, subscriptions, user_group, user).await
        }
    };

    if let Err(e) = result {
        tracing::error!("Error: {}", e);
    }

    Ok(())
}
