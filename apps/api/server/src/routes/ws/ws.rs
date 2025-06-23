use std::{
    cmp::min,
    collections::HashSet,
    sync::Arc,
    time::{Duration, Instant},
};

use async_compression::tokio::bufread::GzipDecoder;
use axum::{
    extract::{
        ws::{Message, WebSocket},
        WebSocketUpgrade,
    },
    response::IntoResponse,
    Extension,
};
use database::pool::get_redis_pool;
use futures::{
    sink::SinkExt,
    stream::{SplitSink, StreamExt},
};
use redis::{streams::StreamReadOptions, AsyncCommands};
use serde::{Deserialize, Serialize};
use serde_json::{to_value, Value};
use tokio::sync::broadcast;
use tokio::task::JoinSet;
use tokio::{
    io::{AsyncReadExt, BufReader},
    sync::{oneshot, Mutex, RwLock},
};
use uuid::Uuid;

use middleware::AuthenticatedUser;

use super::{
    chats::chats_router::ChatEvent,
    ws_router::{ws_router, WsRoutes},
    ws_utils::{subscribe_to_stream, unsubscribe_from_stream},
};

const CLIENT_TIMEOUT: Duration = Duration::from_secs(900);
const PING_INTERVAL: Duration = Duration::from_secs(15);
const PING_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Deserialize, Clone)]
pub struct WsRequestMessage {
    pub route: String,
    pub payload: Value,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum WsEvent {
    Threads(ChatEvent),
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WsErrorCode {
    InternalServerError,
    NotFound,
    Unauthorized,
    BadRequest,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct WsError {
    pub code: WsErrorCode,
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct WsSentBy {
    pub id: Uuid,
    pub name: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct WsResponseMessage {
    pub route: WsRoutes,
    pub event: WsEvent,
    pub payload: Value,
    pub sent_by: Option<WsSentBy>,
    pub error: Option<WsError>,
    pub send_method: WsSendMethod,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum WsSendMethod {
    SenderOnly,
    AllButSender,
    All,
}

impl WsResponseMessage {
    pub fn new<T: Serialize>(
        route: WsRoutes,
        event: WsEvent,
        data: T,
        error: Option<WsError>,
        user: &AuthenticatedUser,
        send_method: WsSendMethod,
    ) -> Self {
        let payload = match to_value(data) {
            Ok(value) => value,
            Err(_e) => {
                return WsResponseMessage {
                    route,
                    event,
                    payload: Value::Null,
                    error: Some(WsError {
                        code: WsErrorCode::InternalServerError,
                        message: "Failed to serialize data".to_string(),
                    }),
                    sent_by: Some(WsSentBy {
                        id: user.id,
                        name: user.name.as_ref().unwrap_or(&user.email).to_string(),
                    }),
                    send_method,
                };
            }
        };
        WsResponseMessage {
            route,
            event,
            payload,
            error,
            sent_by: Some(WsSentBy {
                id: user.id,
                name: user.name.as_ref().unwrap_or(&user.email).to_string(),
            }),
            send_method,
        }
    }

    pub fn new_no_user<T: Serialize>(
        route: WsRoutes,
        event: WsEvent,
        data: T,
        error: Option<WsError>,
        send_method: WsSendMethod,
    ) -> Self {
        let payload = match to_value(data) {
            Ok(value) => value,
            Err(_e) => {
                return WsResponseMessage {
                    route,
                    event,
                    payload: Value::Null,
                    error: Some(WsError {
                        code: WsErrorCode::InternalServerError,
                        message: "Failed to serialize data".to_string(),
                    }),
                    sent_by: None,
                    send_method,
                };
            }
        };
        WsResponseMessage {
            route,
            event,
            payload,
            error,
            sent_by: None,
            send_method,
        }
    }
}

#[derive(Serialize)]
pub struct WsErrorMessage {
    pub error: String,
}

pub struct SubscriptionRwLock {
    pub subscriptions: RwLock<HashSet<String>>,
}

impl SubscriptionRwLock {
    pub fn new() -> Self {
        SubscriptionRwLock {
            subscriptions: RwLock::new(HashSet::new()),
        }
    }

    pub async fn write(&self, subscription: String) {
        let mut subs = self.subscriptions.write().await;
        subs.insert(subscription.clone());
        drop(subs);
    }

    pub async fn remove(&self, subscription: String) {
        let mut subs = self.subscriptions.write().await;
        subs.remove(&subscription);
        drop(subs);
    }

    pub async fn read(&self) -> HashSet<String> {
        self.subscriptions.read().await.clone()
    }
}

pub async fn ws(
    ws: WebSocketUpgrade,
    Extension(user): Extension<AuthenticatedUser>,
    Extension(shutdown_tx): Extension<Arc<broadcast::Sender<()>>>,
) -> impl IntoResponse {
    ws.on_upgrade(|ws| async move {
        ws_handler(ws, user, shutdown_tx).await;
    })
}

async fn ws_handler(
    stream: WebSocket,
    user: AuthenticatedUser,
    shutdown_tx: Arc<broadcast::Sender<()>>,
) {
    let mut shutdown_rx = shutdown_tx.subscribe();

    let (sender, mut receiver) = stream.split();

    let subscriptions = Arc::new(SubscriptionRwLock::new());

    let user_group = format!(
        "user:{}:{}",
        user.id.to_string(),
        Uuid::new_v4().to_string()
    );

    let consumer_group = format!("consumer:{}", Uuid::new_v4().to_string());

    let sender = Arc::new(Mutex::new(sender));

    match subscribe_to_stream(&subscriptions, &user.id.to_string(), &user_group, &user.id).await {
        Ok(_) => (),
        Err(_) => {
            tracing::info!("Stream already subscribed to");
        }
    };

    let (stop_tx, stop_rx) = oneshot::channel();

    let redis_handler = tokio::spawn(redis_stream_task(
        subscriptions.clone(),
        user_group.clone(),
        consumer_group.clone(),
        user.id.clone(),
        sender.clone(),
        stop_rx,
    ));

    let mut tasks = JoinSet::new();

    let last_pong = Arc::new(Mutex::new(Instant::now()));

    let (ping_timeout_tx, mut ping_timeout_rx) = oneshot::channel();

    let ping_sender = sender.clone();
    let last_pong_clone = last_pong.clone();
    let ping_task = tokio::spawn(async move {
        let mut ping_interval = tokio::time::interval(PING_INTERVAL);
        let mut last_ping_time = None;

        loop {
            tokio::select! {
                _ = ping_interval.tick() => {
                    tracing::debug!("Sending ping");
                    if ping_sender
                        .lock()
                        .await
                        .send(Message::Ping(vec![1]))
                        .await
                        .is_err()
                    {
                        break;
                    }
                    last_ping_time = Some(Instant::now());
                }
                _ = tokio::time::sleep(Duration::from_millis(100)) => {
                    if let Some(ping_time) = last_ping_time {
                        let last_pong = *last_pong_clone.lock().await;
                        if last_pong < ping_time && ping_time.elapsed() > PING_TIMEOUT {
                            tracing::warn!("Ping timeout - no pong received within timeout period");
                            let _ = ping_timeout_tx.send(());
                            break;
                        }
                    }
                }
            }
        }
    });

    let last_activity = Arc::new(Mutex::new(Instant::now()));

    loop {
        tokio::select! {
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        *last_activity.lock().await = Instant::now();
                        if let Ok(message) = serde_json::from_str::<WsRequestMessage>(&text) {
                            let subscriptions = subscriptions.clone();
                            let user_group = user_group.clone();
                            let user = user.clone();

                            tasks.spawn(async move {
                                if let Err(e) = ws_router(message.route, message.payload, &subscriptions, &user_group, &user).await {
                                    tracing::error!("Error processing websocket message: {:?}", e);
                                }
                            });
                        }
                    },
                    Some(Ok(Message::Ping(_))) => {
                        let _ = sender.lock().await.send(Message::Pong(vec![])).await;
                    },
                    Some(Ok(Message::Pong(_))) => {
                        tracing::debug!("Received pong, updating last_pong");
                        *last_pong.lock().await = Instant::now();
                        continue;
                    },
                    Some(Ok(Message::Binary(_))) => {
                        continue;
                    },
                    Some(Ok(Message::Close(_))) | None => {
                        tracing::info!("WebSocket connection closed");
                        let _ = sender.lock().await.send(Message::Close(None)).await;
                        break;
                    },
                    Some(Err(_e)) => {
                        tracing::error!("WebSocket error: {:?}", _e);
                        break;
                    },
                }
            },
            _ = tokio::time::sleep(Duration::from_millis(100)) => {
                if last_activity.lock().await.elapsed() > CLIENT_TIMEOUT {
                    tracing::info!("Client connection timed out after {} seconds of inactivity", CLIENT_TIMEOUT.as_secs());
                    let _ = sender.lock().await.send(Message::Close(None)).await;
                    break;
                }
            },
            Some(result) = tasks.join_next() => {
                if let Err(e) = result {
                    tracing::error!("Task failed: {:?}", e);
                }
            },
            _ = shutdown_rx.recv() => {
                tracing::info!("Shutdown signal received");
                break;
            },
            _ = &mut ping_timeout_rx => {
                tracing::info!("Ping timeout detected, closing connection");
                let _ = sender.lock().await.send(Message::Close(None)).await;
                break;
            }
        }
    }

    // Cleanup section
    tracing::info!("Cleaning up websocket tasks...");

    // Abort all running tasks
    tasks.abort_all();
    // Wait for tasks to finish
    while tasks.join_next().await.is_some() {}

    // Signal all tasks to stop
    let _ = stop_tx.send(());

    // Wait for both handlers
    if let Err(e) = redis_handler.await {
        tracing::error!("Error waiting for redis_handler: {:?}", e);
    }

    // Unsubscribe from all streams
    let unsubscribe_task = tokio::spawn(async move {
        let subscriptions_to_unsubscribe: Vec<String> = {
            let subs = subscriptions.read().await;
            subs.iter().cloned().collect()
        };

        for subscription in subscriptions_to_unsubscribe {
            match unsubscribe_from_stream(&subscriptions, &subscription, &user_group, &user.id)
                .await
            {
                Ok(_) => (),
                Err(e) => tracing::error!("Error unsubscribing from stream: {}", e),
            };
        }
    });

    if let Err(e) = unsubscribe_task.await {
        tracing::error!("Error waiting for unsubscribe_task: {:?}", e);
    }

    if let Err(e) = ping_task.await {
        tracing::error!("Error waiting for ping_task: {:?}", e);
    }
}

async fn redis_stream_task(
    subscriptions: Arc<SubscriptionRwLock>,
    user_group: String,
    consumer_group: String,
    user_id: Uuid,
    sender: Arc<Mutex<SplitSink<WebSocket, Message>>>,
    mut stop_rx: oneshot::Receiver<()>,
) {
    let min_block_time = Duration::from_millis(5);
    let max_block_time = Duration::from_secs(30);
    let mut current_block_time = min_block_time;
    let mut last_activity = Instant::now();

    let redis_task = tokio::spawn(async move {
        let mut redis_conn = match get_redis_pool().get().await {
            Ok(conn) => conn,
            Err(_) => return,
        };

        loop {
            let subs = { subscriptions.read().await.clone() };

            if subs.is_empty() {
                continue;
            }

            let group_read_options = StreamReadOptions::default()
                .group(&user_group, &consumer_group)
                .block(current_block_time.as_millis() as usize)
                .count(250);

            let keys = subs.iter().collect::<Vec<&String>>();
            let ids = vec![">".to_string(); keys.len()];

            match redis_conn
                .xread_options::<&String, String, Option<redis::Value>>(
                    keys.as_slice(),
                    ids.as_slice(),
                    &group_read_options,
                )
                .await
            {
                Ok(Some(messages)) => {
                    last_activity = Instant::now();
                    current_block_time = min_block_time;

                    let processed_messages = process_messages(messages, user_id).await;
                    for message in processed_messages {
                        if let Ok(json) = serde_json::to_string(&message) {
                            if sender.lock().await.send(Message::Text(json)).await.is_err() {
                                return;
                            }
                        }
                    }
                }
                Ok(None) => {
                    let time_since_last_activity = last_activity.elapsed();
                    if time_since_last_activity > current_block_time {
                        // Increase block time exponentially, but cap it at max_block_time
                        current_block_time = min(
                            max_block_time,
                            Duration::from_nanos(
                                (current_block_time.as_nanos() as f64 * 1.5) as u64,
                            ),
                        );
                    }
                }
                Err(_) => {
                    for key in &keys {
                        if let Err(sub_err) =
                            subscribe_to_stream(&subscriptions, key, &user_group, &user_id).await
                        {
                            tracing::error!(
                                "Failed to resubscribe to stream {}: {:?}",
                                key,
                                sub_err
                            );
                        } else {
                            tracing::info!("Resubscribed to stream: {}", key);
                        }
                    }
                    current_block_time = min_block_time;
                }
            }
        }
    });

    tokio::select! {
        _ = &mut stop_rx => {
            tracing::info!("Redis stream task stopped");
            redis_task.abort();
        }
    }

    return;
}

async fn process_messages(messages: redis::Value, user_id: Uuid) -> Vec<WsResponseMessage> {
    let messages = match messages.as_sequence() {
        Some(messages) => messages,
        None => return vec![],
    };

    let mut data_vec = Vec::new();

    for message in messages {
        let message = match message.as_map_iter() {
            Some(message) => message,
            None => continue,
        };

        for (_, message) in message {
            let records = match message.as_sequence() {
                Some(data) => data,
                None => continue,
            };
            for record in records {
                let record = match record.as_map_iter() {
                    Some(record) => record,
                    None => continue,
                };
                for (_, value) in record {
                    let data = match value.as_map_iter() {
                        Some(data) => data,
                        None => continue,
                    };

                    for (_, data) in data {
                        data_vec.push(data.clone());
                    }
                }
            }
        }
    }

    let mut messages = Vec::new();

    for data in data_vec {
        let bytes = match data {
            redis::Value::BulkString(data) => data,
            _ => continue,
        };

        let reader = BufReader::new(&bytes[..]);
        let mut decoder = GzipDecoder::new(reader);
        let mut text = String::new();

        if let Err(_e) = decoder.read_to_string(&mut text).await {
            continue;
        }

        if let Ok(ws_response_message) = serde_json::from_str::<WsResponseMessage>(&text) {
            match ws_response_message.send_method {
                WsSendMethod::SenderOnly => {
                    if ws_response_message.sent_by.is_some()
                        && ws_response_message.sent_by.as_ref().unwrap().id != user_id
                    {
                        continue;
                    }
                }
                WsSendMethod::AllButSender => {
                    if ws_response_message.sent_by.is_some()
                        && ws_response_message.sent_by.as_ref().unwrap().id == user_id
                    {
                        continue;
                    }
                }
                WsSendMethod::All => {}
            }
            messages.push(ws_response_message);
        }
    }

    messages
}
