use crate::{
    database::{
        enums::{AssetPermissionRole, AssetType, IdentityType, UserOrganizationRole},
        lib::{get_pg_pool, get_sqlx_pool, ContextJsonBody, MessageResponses},
        models::{AssetPermission, DataSource, Dataset, DatasetColumn, UserToOrganization},
        schema::{
            asset_permissions, data_sources, dataset_columns, dataset_groups, dataset_groups_permissions,
            dataset_permissions, datasets, datasets_to_permission_groups, messages,
            permission_groups_to_identities, teams_to_users, terms, terms_to_datasets, threads,
            users_to_organizations,
        },
    },
    routes::ws::{
        threads_and_messages::{
            messages_utils::MessageDraftState,
            thread_utils::{
                check_if_thread_saved, get_thread_state_by_id, MessageWithUserInfo, ThreadState,
            },
        },
        ws::{SubscriptionRwLock, WsSendMethod},
        ws_utils::{get_key_value, set_key_value, subscribe_to_stream},
    },
    utils::{
        agents::data_analyst_agent::{
            data_analyst_agent, DataAnalystAgentOptions, DatasetWithMetadata, RelevantTerm,
            Thoughts,
        },
        clients::{
            ai::embedding_router::embedding_router,
            sentry_utils::send_sentry_error,
            typesense::{self, CollectionName, SearchRequestObject},
        },
        user::user_info::get_user_organization_id,
    },
};
use anyhow::{anyhow, Result};
use chrono::Utc;
use cohere_rust::{
    api::rerank::{ReRankModel, ReRankRequest},
    Cohere,
};
use diesel::{
    insert_into, update, upsert::excluded, BoolExpressionMethods, ExpressionMethods, JoinOnDsl,
    NullableExpressionMethods, QueryDsl, SelectableHelper,
};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::Row;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio_stream::StreamExt;
use uuid::Uuid;

use crate::{
    database::{
        enums::Verification,
        models::{Message, Thread, User},
    },
    routes::ws::{
        ws::{WsEvent, WsResponseMessage},
        ws_router::WsRoutes,
        ws_utils::send_ws_message,
    },
};

use super::super::threads_router::{ThreadEvent, ThreadRoute};

/// This creates a new thread for a user.  It follows these steps:
///
/// 1. Subscribes the user to a thread channel
/// 2. Creates an empty thread object and returns to the user
/// 3. Saves the thread object and ownership to the database
/// 4. Sends the user progress messages. This consists of streams and such.
/// 5. Go along saving progress to ultimately write to the database

#[derive(Deserialize, Debug, Clone)]
pub struct PostThreadRequest {
    pub prompt: String,
    // dataset_id is only applicable on the first message right now. This selects the dataset and skips the AI step.
    pub dataset_id: Option<Uuid>,
    // thread_id is only applicable after the first message.  It indicates follow up questions.
    pub thread_id: Option<Uuid>,
    // message_id is only applicable after the first message.  It indicates that a message is going to be redone.
    pub message_id: Option<Uuid>,
}

pub struct PostThreadMessage {
    event: ThreadEvent,
    data: Value,
}

impl PostThreadMessage {
    pub fn new<T: Serialize>(event: ThreadEvent, data: T) -> Self {
        Self {
            event,
            data: serde_json::to_value(data).unwrap(),
        }
    }
}

pub async fn post_thread(
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &User,
    req: PostThreadRequest,
) -> Result<()> {
    let organization_id = match get_user_organization_id(&user.id).await {
        Ok(organization_id) => organization_id,
        Err(e) => return Err(anyhow!("Error getting organization ID: {e}")),
    };

    let (mut thread, mut message) = match initialize_thread(
        user,
        &req.thread_id,
        &req.prompt,
        &req.message_id,
        &organization_id,
    )
    .await
    {
        Ok(thread) => thread,
        Err(e) => return Err(e),
    };

    let subscription: String = format!("thread:{}", thread.thread.id.clone());

    match subscribe_to_stream(subscriptions, &subscription, user_group, &user.id).await {
        Ok(_) => (),
        Err(e) => return Err(e),
    };

    match send_initial_thread_to_sub(&subscription, &thread, user).await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Failed to send initial thread to subscription: {:?}", e);
            return Err(e);
        }
    };

    const RESPONSE_MESSAGE_TYPES: [&str; 9] = [
        "generating_sql",
        "master_response",
        "custom_response",
        "running_sql_started",
        "running_sql_completed",
        "visualization_started",
        "visualization_completed",
        "dataset_breakout",
        "failed_to_fix_sql",
    ];

    let responses = Arc::new(tokio::sync::Mutex::new(String::new()));
    let (thread_tx, mut thread_rx) = mpsc::channel::<Value>(100);

    // Spawn the background task and store the handle
    let ws_handle = {
        let user = user.clone();
        let subscription = subscription.clone();
        let thread_id = thread.thread.id.clone();
        let message_id = message.id.clone();
        let responses = responses.clone();

        tokio::spawn(async move {
            while let Some(msg) = thread_rx.recv().await {
                // Check for [DONE] message first
                if let Some(value) = msg.get("value") {
                    if value == "[DONE]" {
                        break;
                    }
                }

                if let Some(name) = msg.get("name").and_then(|n| n.as_str()) {
                    if RESPONSE_MESSAGE_TYPES.contains(&name) {
                        if let Some(value) = msg.get("value").and_then(|v| v.as_str()) {
                            let mut responses = responses.lock().await;
                            responses.push_str(value);
                        }
                    }
                }

                let _ =
                    process_ws_message(&subscription, &msg, &user, &thread_id, &message_id).await;
            }
        })
    };

    let datasets_with_metadata = match get_user_datasets_with_metadata(&user.id).await {
        Ok(datasets_with_metadata) => datasets_with_metadata,
        Err(e) => {
            return Err(anyhow!("Error fetching user datasets: {}", e));
        }
    };

    let reranked_datasets_with_metadata =
        match rerank_datasets(&req.prompt, datasets_with_metadata).await {
            Ok(reranked_datasets_with_metadata) => reranked_datasets_with_metadata,
            Err(e) => {
                return Err(anyhow!("Error reranking datasets: {}", e));
            }
        };

    let dataset_ids = reranked_datasets_with_metadata
        .iter()
        .map(|d| d.dataset.id)
        .collect::<Vec<Uuid>>();

    let terms_handle = {
        let user_id = user.id;
        let prompt = req.prompt.clone();
        let dataset_ids = dataset_ids.clone();
        let organization_id = organization_id.clone();

        tokio::spawn(async move {
            search_for_relevant_terms(&user_id, &prompt, &dataset_ids, &organization_id).await
        })
    };

    let terms = match terms_handle.await {
        Ok(Ok(terms)) => terms,
        Ok(Err(e)) => {
            tracing::error!("Unable to search for relevant terms: {:?}", e);
            vec![]
        }
        Err(e) => {
            tracing::error!("Task join error for terms search: {:?}", e);
            vec![]
        }
    };

    let data_analyst_options = DataAnalystAgentOptions {
        input: req.prompt.clone(),
        message_history: assemble_message_history(&thread),
        output_sender: thread_tx.clone(),
        datasets: reranked_datasets_with_metadata,
        terms,
        relevant_values: vec![], // We'll get these in generate_sql_agent
        thread_id: thread.thread.id,
        message_id: message.id,
        user_id: user.id,
    };

    let result = match data_analyst_agent(data_analyst_options).await {
        Ok(response) => response,
        Err(e) => {
            return Err(anyhow!("Error in data analyst agent: {}", e.error_message));
        }
    };

    // Wait for ws_handle to complete BEFORE reading responses
    match ws_handle.await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("WebSocket handler failed: {:?}", e);
            return Err(anyhow!("WebSocket handler failed: {}", e));
        }
    };

    // Now read responses after websocket handler is done
    let responses_value = &responses.lock().await.to_string();
    message.responses = Some(json!({ "messages": responses_value.clone() }));

    // Extract message fields from result
    let chart_config = result.get("chart_config").cloned();
    let data_metadata = result.get("data_metadata").cloned();
    let code = result.get("sql").and_then(|v| v.as_str()).map(String::from);
    let title = result
        .get("title")
        .and_then(|v| v.as_str())
        .map(String::from);
    let summary = result
        .get("description")
        .and_then(|v| v.as_str())
        .map(String::from);
    let time_frame = result
        .get("time_frame")
        .and_then(|v| v.as_str())
        .map(String::from);
    let dataset_id = result.get("dataset_id").and_then(|v| {
        v.as_str()
            .and_then(|id| Uuid::parse_str(id).ok())
            .or_else(|| {
                v.as_object()
                    .and_then(|obj| obj.get("id"))
                    .and_then(|id| id.as_str())
                    .and_then(|id| Uuid::parse_str(id).ok())
            })
    });

    let sql_evaluation_id = result
        .get("sql_evaluation_id")
        .and_then(|v| v.as_str())
        .map(String::from);

    let title = if let Some(title) = title {
        Some(title)
    } else {
        Some(req.prompt.clone())
    };

    let summary = if let Some(summary) = summary {
        Some(summary)
    } else {
        Some(req.prompt.clone())
    };

    // Update message with extracted fields
    message.chart_config = chart_config;
    message.data_metadata = data_metadata;
    message.code = code;
    message.context = Some(result);
    message.title = title;
    message.summary_question = summary;
    message.time_frame = time_frame;
    message.dataset_id = dataset_id;
    message.sql_evaluation_id = sql_evaluation_id.and_then(|id| Uuid::parse_str(&id).ok());

    let thread_state = match update_thread_and_message(&mut thread, &message).await {
        Ok(thread_state) => thread_state,
        Err(e) => {
            tracing::error!("Failed to update thread and message: {:?}", e);
            return Err(e);
        }
    };

    let _ = send_completed_state_to_sub(&subscription, &thread_state, user).await;

    Ok(())
}

fn assemble_message_history(thread: &ThreadState) -> Vec<Value> {
    let mut message_history = vec![];

    for message in thread.messages.clone() {
        if let Some(mut context) = message.message.context {
            context["chart_config"] = message.message.chart_config.clone().unwrap_or(Value::Null);
            message_history.push(context.clone());
        }
    }

    message_history
}

#[derive(Serialize)]
struct GeneratingResponsePayload {
    message_id: Uuid,
    progress: String,
    text: Option<String>,
    text_chunk: Option<String>,
    thread_id: Uuid,
}

async fn process_ws_message(
    subscription: &String,
    message: &Value,
    user: &User,
    thread_id: &Uuid,
    message_id: &Uuid,
) -> Result<()> {
    let (event, content) = match message.get("name") {
        Some(Value::String(name))
            if [
                "generating_sql",
                "master_response",
                "custom_response",
                "failed_to_fix_sql",
                "dataset_breakout",
                "orchestrator_started",
                "orchestrator_completed",
                "dataset_selector_started",
                "dataset_selector_completed",
                "running_sql_started",
                "running_sql_completed",
                "visualization_started",
                "visualization_completed",
            ]
            .contains(&name.as_str()) =>
        {
            let value = message.get("value").cloned().unwrap_or(Value::Null);
            let text_chunk = value.as_str().map(String::from);

            let payload = GeneratingResponsePayload {
                message_id: message_id.clone(),
                progress: "inProgress".to_string(),
                text: None,
                text_chunk,
                thread_id: thread_id.clone(),
            };

            (
                WsEvent::Threads(ThreadEvent::GeneratingResponse),
                Some(serde_json::to_value(payload)?),
            )
        }
        Some(Value::String(name)) if ["fetching_data_finished"].contains(&name.as_str()) => {
            let data = match message.get("value").and_then(|v| v.get("data")) {
                Some(data) => data.clone(),
                None => Value::Null,
            };

            let chart_config = match message.get("value").and_then(|v| v.get("chart_config")) {
                Some(chart_config) => chart_config.clone(),
                None => Value::Null,
            };

            let data_metadata = match message.get("value").and_then(|v| v.get("data_metadata")) {
                Some(data_metadata) => data_metadata.clone(),
                None => Value::Null,
            };

            let title = match message.get("value").and_then(|v| v.get("title")) {
                Some(title) => title.clone(),
                None => Value::Null,
            };

            let description = match message.get("value").and_then(|v| v.get("description")) {
                Some(description) => description.clone(),
                None => Value::Null,
            };

            let time_frame = match message.get("value").and_then(|v| v.get("time_frame")) {
                Some(time_frame) => time_frame.clone(),
                None => Value::Null,
            };

            let dataset_name = match message.get("value").and_then(|v| v.get("dataset_name")) {
                Some(dataset_name) => dataset_name.clone(),
                None => Value::Null,
            };

            let dataset_id = match message.get("value").and_then(|v| v.get("dataset_id")) {
                Some(dataset_id) => dataset_id.clone(),
                None => Value::Null,
            };

            let code = match message.get("value").and_then(|v| v.get("code")) {
                Some(code) => code.clone(),
                None => Value::Null,
            };

            let payload = json!({
                "thread_id": thread_id,
                "message_id": message_id,
                "progress": "completed",
                "data": data,
                "code": code,
                "chart_config": chart_config,
                "data_metadata": data_metadata,
                "title": title,
                "description": description,
                "time_frame": time_frame,
                "dataset_name": dataset_name,
                "dataset_id": dataset_id
            });

            (WsEvent::Threads(ThreadEvent::FetchingData), Some(payload))
        }
        Some(Value::String(name)) if ["title"].contains(&name.as_str()) => {
            let value = message.get("value").cloned().unwrap_or(Value::Null);
            let text_chunk = value.as_str().map(String::from);

            let payload = json!({
                "message_id": message_id,
                "progress": "inProgress",
                "metric_title": null,
                "metric_title_chunk": text_chunk,
                "thread_id": thread_id
            });

            (
                WsEvent::Threads(ThreadEvent::GeneratingMetricTitle),
                Some(serde_json::to_value(payload)?),
            )
        }
        Some(Value::String(name)) if ["timeframe"].contains(&name.as_str()) => {
            let value = message.get("value").cloned().unwrap_or(Value::Null);
            let text_chunk = value.as_str().map(String::from);

            let payload = json!({
                "message_id": message_id,
                "progress": "inProgress",
                "time_frame": null,
                "time_frame_chunk": text_chunk,
                "thread_id": thread_id
            });

            (
                WsEvent::Threads(ThreadEvent::GeneratingTimeFrame),
                Some(serde_json::to_value(payload)?),
            )
        }
        Some(Value::String(name)) if ["summary"].contains(&name.as_str()) => {
            let value = message.get("value").cloned().unwrap_or(Value::Null);
            let text_chunk = value.as_str().map(String::from);

            let payload = json!({
                "message_id": message_id,
                "progress": "inProgress",
                "description": null,
                "description_chunk": text_chunk,
                "thread_id": thread_id
            });

            (
                WsEvent::Threads(ThreadEvent::GeneratingSummaryQuestion),
                Some(serde_json::to_value(payload)?),
            )
        }
        Some(Value::String(name)) if ["completed_thread"].contains(&name.as_str()) => {
            let value = message.get("value").cloned().unwrap_or(Value::Null);
            let completed_thread = value;

            (
                WsEvent::Threads(ThreadEvent::CompletedThread),
                Some(completed_thread),
            )
        }
        Some(Value::String(name)) if ["sql_same"].contains(&name.as_str()) => {
            let value = message.get("value").cloned().unwrap_or(Value::Null);
            let mut sql = value;

            sql["message_id"] = message_id.to_string().into();
            sql["thread_id"] = thread_id.to_string().into();
            sql["progress"] = "completed".into();
            sql["sql_chunk"] = Value::Null;

            (WsEvent::Threads(ThreadEvent::GeneratingSql), Some(sql))
        }
        Some(Value::String(name)) if ["modify_visualization"].contains(&name.as_str()) => {
            let value = message.get("value").cloned().unwrap_or(Value::Null);

            let modify_visualization_json = json!({
                "thread_id": thread_id,
                "message_id": message_id,
                "progress": "completed",
                "payload": value
            });

            (
                WsEvent::Threads(ThreadEvent::ModifyVisualization),
                Some(modify_visualization_json),
            )
        }
        Some(Value::String(name)) if ["thought"].contains(&name.as_str()) => {
            let mut value = message.get("value").cloned().unwrap_or(Value::Null);

            value["message_id"] = message_id.to_string().into();
            value["thread_id"] = thread_id.to_string().into();
            value["progress"] = "inProgress".into();

            (WsEvent::Threads(ThreadEvent::Thought), Some(value))
        }
        Some(Value::String(name)) if ["thought_finished"].contains(&name.as_str()) => {
            let mut value = message.get("value").cloned().unwrap_or(Value::Null);

            value["message_id"] = message_id.to_string().into();
            value["thread_id"] = thread_id.to_string().into();
            value["progress"] = "completed".into();

            (WsEvent::Threads(ThreadEvent::Thought), Some(value))
        }
        _ => (
            WsEvent::Threads(ThreadEvent::GeneratingResponse),
            Some(message.clone()),
        ),
    };

    let thread_ws_response = WsResponseMessage::new(
        WsRoutes::Threads(ThreadRoute::Post),
        event,
        content,
        None,
        user,
        WsSendMethod::All,
    );

    match send_ws_message(subscription, &thread_ws_response).await {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Failed to send thread message to subscription: {:?}", e);
            send_sentry_error(&e.to_string(), None);
        }
    }

    Ok(())
}

fn get_current_chart_config(chart_config: Value) -> Option<Value> {
    let chart_type = match chart_config.get("selected_chart_type") {
        Some(Value::String(chart_type)) => Some(chart_type.to_string()),
        _ => None,
    };

    let chart_options = match chart_config.get("chart_options") {
        Some(Value::Object(chart_options)) => Some(chart_options),
        _ => None,
    };

    if let (Some(chart_type), Some(chart_options)) = (chart_type, chart_options) {
        match chart_options.get(&chart_type) {
            Some(chart_options) => Some(chart_options.clone()),
            _ => None,
        }
    } else {
        None
    }
}

pub async fn get_user_datasets_with_metadata(user_id: &Uuid) -> Result<Vec<DatasetWithMetadata>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    // Get user's organization and role
    let user_organization_record = match users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .select(users_to_organizations::all_columns)
        .first::<UserToOrganization>(&mut conn)
        .await
    {
        Ok(organization_id) => organization_id,
        Err(e) => return Err(anyhow!("Unable to get organization from database: {}", e)),
    };

    let datasets_with_metadata = match &user_organization_record.role {
        UserOrganizationRole::WorkspaceAdmin
        | UserOrganizationRole::DataAdmin
        | UserOrganizationRole::Querier => {
            get_org_datasets_with_metadata(&user_organization_record.organization_id).await?
        }
        UserOrganizationRole::RestrictedQuerier => {
            get_restricted_user_datasets_with_metadata(user_id).await?
        }
        UserOrganizationRole::Viewer => Vec::new(),
    };

    Ok(datasets_with_metadata)
}

async fn get_org_datasets_with_metadata(
    organization_id: &Uuid,
) -> Result<Vec<DatasetWithMetadata>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    let dataset_records = match datasets::table
        .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
        .filter(datasets::organization_id.eq(organization_id))
        .filter(datasets::deleted_at.is_null())
        .filter(datasets::enabled.eq(true))
        .select((Dataset::as_select(), DataSource::as_select()))
        .load::<(Dataset, DataSource)>(&mut conn)
        .await
    {
        Ok(records) => records,
        Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
    };

    process_dataset_records(dataset_records).await
}

async fn get_restricted_user_datasets_with_metadata(
    user_id: &Uuid,
) -> Result<Vec<DatasetWithMetadata>> {
    // Direct dataset access
    let direct_user_permissioned_datasets_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let result = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id)),
                )
                .filter(dataset_permissions::permission_id.eq(user_id))
                .filter(dataset_permissions::permission_type.eq("user"))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .filter(data_sources::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
                .select((Dataset::as_select(), DataSource::as_select()))
                .load::<(Dataset, DataSource)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(result)
        })
    };

    // Permission group access
    let permission_group_datasets_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let result = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id)),
                )
                .inner_join(
                    permission_groups_to_identities::table.on(
                        permission_groups_to_identities::identity_id.eq(user_id)
                            .and(permission_groups_to_identities::identity_type.eq(IdentityType::User))
                    )
                )
                .filter(
                    dataset_permissions::permission_id
                        .eq(permission_groups_to_identities::permission_group_id)
                )
                .filter(dataset_permissions::permission_type.eq("permission_group"))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(permission_groups_to_identities::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .filter(data_sources::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
                .select((Dataset::as_select(), DataSource::as_select()))
                .load::<(Dataset, DataSource)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(result)
        })
    };

    // Dataset group access
    let dataset_group_datasets_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let result = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id))
                )
                .inner_join(
                    dataset_groups_permissions::table.on(
                        dataset_groups_permissions::permission_id.eq(user_id)
                            .and(dataset_groups_permissions::permission_type.eq("user"))
                    )
                )
                .inner_join(
                    dataset_groups::table.on(
                        dataset_groups::id.eq(dataset_groups_permissions::dataset_group_id)
                    )
                )
                .filter(dataset_permissions::permission_id.eq(dataset_groups::id))
                .filter(dataset_permissions::permission_type.eq("dataset_group"))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(dataset_groups_permissions::deleted_at.is_null())
                .filter(dataset_groups::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .filter(data_sources::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
                .select((Dataset::as_select(), DataSource::as_select()))
                .load::<(Dataset, DataSource)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(result)
        })
    };

    // Permission group to dataset group access
    let permission_group_dataset_groups_handle = {
        let user_id = user_id.clone();
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
            };

            let result = match datasets::table
                .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
                .inner_join(
                    dataset_permissions::table.on(dataset_permissions::dataset_id.eq(datasets::id))
                )
                .inner_join(
                    dataset_groups::table.on(
                        dataset_groups::id.eq(dataset_permissions::permission_id)
                            .and(dataset_permissions::permission_type.eq("dataset_group"))
                    )
                )
                .inner_join(
                    dataset_groups_permissions::table.on(
                        dataset_groups::id.eq(dataset_groups_permissions::dataset_group_id)
                    )
                )
                .inner_join(
                    permission_groups_to_identities::table.on(
                        permission_groups_to_identities::identity_id.eq(user_id)
                            .and(permission_groups_to_identities::identity_type.eq(IdentityType::User))
                            .and(dataset_groups_permissions::permission_id
                                .eq(permission_groups_to_identities::permission_group_id))
                            .and(dataset_groups_permissions::permission_type.eq("permission_group"))
                    )
                )
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(dataset_groups_permissions::deleted_at.is_null())
                .filter(dataset_groups::deleted_at.is_null())
                .filter(permission_groups_to_identities::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .filter(data_sources::deleted_at.is_null())
                .filter(datasets::enabled.eq(true))
                .select((Dataset::as_select(), DataSource::as_select()))
                .load::<(Dataset, DataSource)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => return Err(anyhow!("Unable to get datasets from database: {}", e)),
            };

            Ok(result)
        })
    };

    let mut all_datasets = Vec::new();

    // Collect results from all handles
    match direct_user_permissioned_datasets_handle.await {
        Ok(Ok(datasets)) => all_datasets.extend(datasets),
        Ok(Err(e)) => return Err(anyhow!("Unable to get direct datasets: {}", e)),
        Err(e) => return Err(anyhow!("Task join error for direct datasets: {}", e)),
    }

    match permission_group_datasets_handle.await {
        Ok(Ok(datasets)) => all_datasets.extend(datasets),
        Ok(Err(e)) => return Err(anyhow!("Unable to get permission group datasets: {}", e)),
        Err(e) => return Err(anyhow!("Task join error for permission group datasets: {}", e)),
    }

    match dataset_group_datasets_handle.await {
        Ok(Ok(datasets)) => all_datasets.extend(datasets),
        Ok(Err(e)) => return Err(anyhow!("Unable to get dataset group datasets: {}", e)),
        Err(e) => return Err(anyhow!("Task join error for dataset group datasets: {}", e)),
    }

    match permission_group_dataset_groups_handle.await {
        Ok(Ok(datasets)) => all_datasets.extend(datasets),
        Ok(Err(e)) => return Err(anyhow!("Unable to get permission group dataset group datasets: {}", e)),
        Err(e) => return Err(anyhow!("Task join error for permission group dataset group datasets: {}", e)),
    }

    // Deduplicate based on dataset id
    all_datasets.sort_by_key(|k| k.0.id);
    all_datasets.dedup_by_key(|k| k.0.id);

    process_dataset_records(all_datasets).await
}

async fn process_dataset_records(
    dataset_records: Vec<(Dataset, DataSource)>,
) -> Result<Vec<DatasetWithMetadata>> {
    let mut datasets_with_metadata = Vec::new();
    let mut column_fetch_tasks = Vec::new();

    // Create concurrent tasks for fetching columns
    for (dataset, data_source) in dataset_records {
        let dataset_id = dataset.id;

        let column_task = tokio::spawn(async move {
            let mut conn = get_pg_pool().get().await?;
            let columns = dataset_columns::table
                .filter(dataset_columns::dataset_id.eq(dataset_id))
                .filter(dataset_columns::deleted_at.is_null())
                .load::<DatasetColumn>(&mut conn)
                .await?;

            Ok::<(Dataset, DataSource, Vec<DatasetColumn>), anyhow::Error>((
                dataset,
                data_source,
                columns,
            ))
        });

        column_fetch_tasks.push(column_task);
    }

    // Gather all results
    for task in column_fetch_tasks {
        match task.await {
            Ok(Ok((dataset, data_source, columns))) => {
                let dataset_ddl = create_dataset_ddl(&dataset, &columns);

                datasets_with_metadata.push(DatasetWithMetadata {
                    dataset,
                    columns,
                    data_source,
                    dataset_ddl,
                });
            }
            Ok(Err(e)) => return Err(anyhow!("Error fetching columns: {}", e)),
            Err(e) => return Err(anyhow!("Task join error: {}", e)),
        }
    }

    Ok(datasets_with_metadata)
}

fn create_dataset_ddl(dataset: &Dataset, dataset_columns: &Vec<DatasetColumn>) -> String {
    let mut ddl = String::new();

    // Add header with table name and description
    ddl.push_str(&format!("-- Dataset Readable Name: {}\n", dataset.name));
    if let Some(when_to_use) = &dataset.when_to_use {
        ddl.push_str(&format!("    -- Description: {}\n", when_to_use));
    }
    ddl.push_str(&format!(
        "    CREATE TABLE {}.{} (\n",
        dataset.schema, dataset.database_name
    ));

    // Add columns
    for (i, column) in dataset_columns.iter().enumerate() {
        // Add column definition
        ddl.push_str(&format!(
            "        {} {} {}",
            column.name,
            column.type_,
            if column.nullable { "NULL" } else { "NOT NULL" }
        ));

        // Add comma if not last column
        if i < dataset_columns.len() - 1 {
            ddl.push_str(",\n");
        } else {
            ddl.push('\n');
        }

        // Add column description as comment if present
        if let Some(description) = &column.description {
            ddl.push_str(&format!("        -- {}\n", description));
        }
    }

    ddl.push_str("    );");
    ddl
}

async fn initialize_thread(
    user: &User,
    thread_id: &Option<Uuid>,
    prompt: &String,
    message_id: &Option<Uuid>,
    organization_id: &Uuid,
) -> Result<(ThreadState, Message)> {
    let (thread, message) = if let Some(thread_id) = thread_id {
        match follow_up_thread(user, &thread_id, prompt, message_id).await {
            Ok(thread) => thread,
            Err(e) => {
                tracing::error!("Failed to get a thread to follow up on: {:?}", e);
                return Err(e);
            }
        }
    } else {
        match create_thread(&user, prompt, &organization_id).await {
            Ok(thread) => thread,
            Err(e) => {
                tracing::error!("Failed to create a new thread: {:?}", e);
                return Err(e);
            }
        }
    };

    Ok((thread, message))
}

async fn follow_up_thread(
    user: &User,
    thread_id: &Uuid,
    prompt: &String,
    message_id: &Option<Uuid>,
) -> Result<(ThreadState, Message)> {
    let draft_session_id = get_draft_session_id(&thread_id).await?;

    let draft_session_id = if let Some(draft_session_id) = draft_session_id {
        Some(Uuid::parse_str(&draft_session_id).unwrap())
    } else {
        let thread_saved = match check_if_thread_saved(&thread_id).await {
            Ok(result) => result,
            Err(e) => {
                return Err(anyhow!("Unable to check if thread is saved: {}", e));
            }
        };

        let draft_session_id = if thread_saved {
            let draft_session_key = format!("draft:thread:{}", thread_id);
            let draft_session_id = Uuid::new_v4();
            set_key_value(&draft_session_key, &draft_session_id.to_string()).await?;
            Some(draft_session_id)
        } else {
            None
        };

        draft_session_id
    };

    let mut thread = match get_thread_state_by_id(&user.id, thread_id, &draft_session_id).await {
        Ok(thread) => thread,
        Err(e) => return Err(e),
    };

    let dataset_used = match thread.messages.last() {
        Some(last_message) => last_message.message.dataset_id.clone(),
        None => return Err(anyhow!("Thread has no messages")),
    };

    let mut draft_state = false;

    if let Some(_) = &draft_session_id {
        draft_state = true;
    };

    let message_context = ContextJsonBody { steps: vec![] };
    let message_response = MessageResponses { messages: vec![] };

    let new_message = match message_id {
        Some(message_id) => {
            let existing_message = thread
                .messages
                .iter()
                .find(|msg| msg.message.id == *message_id)
                .cloned()
                .ok_or_else(|| anyhow!("Message with id {} not found", message_id))?;

            let new_message = Message {
                id: Uuid::new_v4(),
                thread_id: thread_id.clone(),
                sent_by: user.id,
                message: prompt.clone(),
                responses: Some(serde_json::to_value(&message_response).unwrap()),
                code: None,
                context: Some(serde_json::to_value(&message_context).unwrap()),
                title: Some("".to_string()),
                feedback: None,
                dataset_id: dataset_used,
                chart_recommendations: None,
                time_frame: None,
                data_metadata: None,
                created_at: existing_message.message.created_at.clone(),
                updated_at: existing_message.message.updated_at.clone(),
                deleted_at: None,
                verification: Verification::NotRequested,
                chart_config: None,
                draft_session_id,
                draft_state: None,
                summary_question: None,
                sql_evaluation_id: None,
            };

            new_message
        }
        None => {
            let new_message = Message {
                id: Uuid::new_v4(),
                thread_id: thread_id.clone(),
                sent_by: user.id,
                message: prompt.clone(),
                responses: Some(serde_json::to_value(&message_response).unwrap()),
                code: None,
                context: Some(serde_json::to_value(&message_context).unwrap()),
                title: Some("".to_string()),
                feedback: None,
                dataset_id: dataset_used,
                chart_recommendations: None,
                time_frame: None,
                data_metadata: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted_at: None,
                verification: Verification::NotRequested,
                chart_config: None,
                draft_session_id,
                draft_state: None,
                summary_question: None,
                sql_evaluation_id: None,
            };

            new_message
        }
    };

    let mut messages_to_upsert = Vec::new();

    // Remove the old message and any messages created after it from the thread
    let now = Utc::now();
    let (retained_messages, deleted_messages): (Vec<_>, Vec<_>) =
        thread.messages.into_iter().partition(|msg| {
            if let Some(message_id) = message_id {
                // If we're redoing a specific message, keep all messages created before it
                msg.message.id != *message_id && msg.message.created_at < new_message.created_at
            } else {
                // If we're adding a new message, keep all messages created before it
                msg.message.created_at < new_message.created_at
            }
        });

    thread.messages = retained_messages;

    // Mark deleted messages and add them to messages_to_upsert
    for mut msg in deleted_messages {
        if let Some(draft_session_id) = draft_session_id {
            // If there's a draft session, update the draft_state instead of deleting
            msg.message.draft_state = Some(serde_json::to_value(MessageDraftState {
                draft_session_id,
                deleted_at: Some(now),
                title: None,
                chart_config: None,
                code: None,
            })?);
        } else {
            // If there's no draft session, mark as deleted
            msg.message.deleted_at = Some(now);
        }
        messages_to_upsert.push(msg.message);
    }

    // Add the new message to the thread
    thread.messages.push(MessageWithUserInfo {
        message: new_message.clone(),
        dataset_name: None,
        sent_by_name: user.name.clone().unwrap_or(user.email.clone()),
        sent_by_id: user.id,
        sent_by_avatar: None,
        response: None,
        evaluation_summary: None,
        evaluation_score: None,
        error: None,
        thoughts: Some(serde_json::to_value(Thoughts {
            thoughts: vec![],
            title: "Understanding your request...".to_string(),
        })?),
    });

    if !draft_state {
        thread.thread.state_message_id = Some(new_message.id);
    }

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Unable to get connection from pool: {:?}", e);
            let err = anyhow!("Unable to get connection from pool: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err(err);
        }
    };

    messages_to_upsert.push(new_message.clone());

    // Perform bulk upsert
    match diesel::insert_into(messages::table)
        .values(&messages_to_upsert)
        .on_conflict(messages::id)
        .do_update()
        .set((
            messages::draft_state.eq(excluded(messages::draft_state)),
            messages::deleted_at.eq(excluded(messages::deleted_at)),
            messages::updated_at.eq(Utc::now()),
        ))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => {
            tracing::error!("Error in message upsert: {:?}", e);
            return Err(anyhow!("Error in message upsert: {}", e));
        }
    }

    Ok((thread, new_message))
}

async fn get_draft_session_id(thread_id: &Uuid) -> Result<Option<String>> {
    let draft_session_key = format!("draft:thread:{}", thread_id);
    let draft_session_id = get_key_value(&draft_session_key).await?;
    Ok(draft_session_id)
}

async fn search_for_relevant_terms(
    user_id: &Uuid,
    prompt: &String,
    dataset_ids: &Vec<Uuid>,
    organization_id: &Uuid,
) -> Result<Vec<RelevantTerm>> {
    let mut conn = match get_sqlx_pool().acquire().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error acquiring search pool: {}", e)),
    };

    let prompt_embedding = match embedding_router(vec![prompt.clone()], true).await {
        Ok(embedding) => serde_json::to_string(&embedding[0]).unwrap(),
        Err(e) => return Err(anyhow!("Error embedding prompt: {}", e)),
    };

    let terms_search_query = format!(
        r#"
        with full_text as (
  select
    id,
    row_number() over(order by ts_rank_cd(fts, websearch_to_tsquery('{prompt}')) desc) as rank_ix
  from
    terms_search
  where
    fts @@ websearch_to_tsquery('{prompt}')
  order by rank_ix
  limit least(10, 30) * 2
),
semantic as (
  select
    id,
    row_number() over (order by embedding <#> '{prompt_embedding}') as rank_ix
  from
    terms_search
  order by rank_ix
  limit least(10, 30) * 2
)
select
  terms_search.term_id,
  terms_search.content,
  terms_search.definition,
  terms_to_datasets.dataset_id
from
  full_text
  full outer join semantic
    on full_text.id = semantic.id
  join terms_search
    on coalesce(full_text.id, semantic.id) = terms_search.id
  inner join terms_to_datasets
    on terms_search.term_id = terms_to_datasets.term_id
order by
  coalesce(1.0 / (50 + full_text.rank_ix), 0.0) * 1 +
  coalesce(1.0 / (50 + semantic.rank_ix), 0.0) * 1 
  desc
limit
  least(10, 30)
        "#,
    );

    let mut results = sqlx::raw_sql(&terms_search_query).fetch(&mut *conn);
    let mut terms = Vec::new();

    while let Some(row) = results.try_next().await? {
        let id: Uuid = match row.try_get("term_id") {
            Ok(id) => id,
            Err(e) => return Err(anyhow!("Error getting term_id: {:?}", e)),
        };
        let name: String = match row.try_get("content") {
            Ok(name) => name,
            Err(e) => return Err(anyhow!("Error getting content: {:?}", e)),
        };

        let definition: String = match row.try_get("definition") {
            Ok(definition) => definition,
            Err(e) => return Err(anyhow!("Error getting definition: {:?}", e)),
        };

        let dataset_id: Uuid = match row.try_get("dataset_id") {
            Ok(dataset_id) => dataset_id,
            Err(e) => return Err(anyhow!("Error getting dataset_id: {:?}", e)),
        };

        terms.push(RelevantTerm {
            id,
            name,
            definition,
            sql_snippet: None,
            dataset_id,
        });
    }

    Ok(terms)
}

async fn create_thread(
    user: &User,
    prompt: &String,
    organization_id: &Uuid,
) -> Result<(ThreadState, Message)> {
    let message_uuid = Uuid::new_v4();

    let thread = Thread {
        id: Uuid::new_v4(),
        created_by: user.id,
        updated_by: user.id,
        created_at: Utc::now(),
        state_message_id: Some(message_uuid),
        parent_thread_id: None,
        updated_at: Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        password_secret_id: None,
        organization_id: organization_id.clone(),
    };

    let message_context = ContextJsonBody { steps: vec![] };
    let message_response = MessageResponses { messages: vec![] };

    let message = Message {
        id: message_uuid,
        thread_id: thread.id,
        sent_by: user.id,
        message: prompt.clone(),
        responses: Some(serde_json::to_value(&message_response).unwrap()),
        code: None,
        context: Some(serde_json::to_value(&message_context).unwrap()),
        title: Some("".to_string()),
        feedback: None,
        dataset_id: None,
        chart_recommendations: None,
        time_frame: None,
        data_metadata: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        verification: Verification::NotRequested,
        chart_config: Some(json!({})),
        draft_session_id: None,
        draft_state: None,
        summary_question: None,
        sql_evaluation_id: None,
    };

    let thread_insert_body = thread.clone();
    let message_insert_body = message.clone();

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Unable to get connection from pool: {:?}", e);
            let err = anyhow!("Unable to get connection from pool: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err(err);
        }
    };
    match insert_into(threads::table)
        .values(&thread_insert_body)
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Unable to insert thread into database: {}", e)),
    }

    let asset_permission_handle = {
        let asset_permission_insert_body = AssetPermission {
            identity_id: user.id,
            identity_type: IdentityType::User,
            asset_id: thread.id,
            asset_type: AssetType::Thread,
            role: AssetPermissionRole::Owner,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            created_by: user.id,
            updated_by: user.id,
        };

        tokio::spawn(async move {
            let mut conn = get_pg_pool().get().await?;

            match insert_into(asset_permissions::table)
                .values(&asset_permission_insert_body)
                .execute(&mut conn)
                .await
            {
                Ok(_) => Ok(()),
                Err(e) => {
                    tracing::error!("Unable to insert user to thread into database: {:?}", e);
                    send_sentry_error(&e.to_string(), None);
                    Err(anyhow!(
                        "Unable to insert user to thread into database: {}",
                        e
                    ))
                }
            }
        })
    };

    let mut messages_to_upsert = Vec::new();
    messages_to_upsert.push(message_insert_body);

    let message_handle = {
        let messages_to_upsert = messages_to_upsert.clone();
        tokio::spawn(async move {
            let mut conn = get_pg_pool().get().await?;

            match diesel::insert_into(messages::table)
                .values(&messages_to_upsert)
                .on_conflict(messages::id)
                .do_update()
                .set((
                    messages::deleted_at.eq(excluded(messages::deleted_at)),
                    messages::updated_at.eq(Utc::now()),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => (),
                Err(e) => {
                    tracing::error!("Error in message upsert: {:?}", e);
                    return Err(anyhow!("Error in message upsert: {}", e));
                }
            };

            Ok(())
        })
    };

    let (asset_permission_result, message_result) =
        tokio::join!(asset_permission_handle, message_handle);

    if let Err(e) = asset_permission_result {
        tracing::error!("Error in asset permission insertion: {:?}", e);
    }
    if let Err(e) = message_result {
        tracing::error!("Error in message insertion: {:?}", e);
    }

    let message_with_user_info = MessageWithUserInfo {
        message: message.clone(),
        dataset_name: None,
        sent_by_name: user.name.clone().unwrap_or(user.email.clone()),
        sent_by_id: user.id,
        sent_by_avatar: None,
        response: None,
        evaluation_summary: None,
        evaluation_score: None,
        error: None,
        thoughts: Some(serde_json::to_value(Thoughts {
            thoughts: vec![],
            title: "Understanding your request...".to_string(),
        })?),
    };

    let thread = ThreadState {
        thread,
        title: message.message.clone(),
        messages: vec![message_with_user_info],
        dashboards: vec![],
        collections: vec![],
        dataset_id: None,
        dataset_name: None,
        permission: Some(AssetPermissionRole::Owner),
        individual_permissions: None,
        team_permissions: None,
        organization_permissions: false,
        public_password: None,
        draft_session_id: None,
    };

    Ok((thread, message))
}

async fn send_completed_state_to_sub(
    subscription: &String,
    thread: &ThreadState,
    user: &User,
) -> Result<()> {
    let thread_ws_response = WsResponseMessage::new(
        WsRoutes::Threads(ThreadRoute::Post),
        WsEvent::Threads(ThreadEvent::CompletedThread),
        Some(thread),
        None,
        user,
        WsSendMethod::All,
    );

    match send_ws_message(&subscription, &thread_ws_response).await {
        Ok(_) => (),
        Err(e) => return Err(e),
    }

    Ok(())
}

async fn send_initial_thread_to_sub(
    subscription: &String,
    thread: &ThreadState,
    user: &User,
) -> Result<()> {
    let thread_ws_response = WsResponseMessage::new(
        WsRoutes::Threads(ThreadRoute::Post),
        WsEvent::Threads(ThreadEvent::InitializeThread),
        Some(thread),
        None,
        user,
        WsSendMethod::All,
    );

    match send_ws_message(&subscription, &thread_ws_response).await {
        Ok(_) => (),
        Err(e) => return Err(e),
    }

    Ok(())
}

async fn update_thread_and_message(
    thread: &mut ThreadState,
    message: &Message,
) -> Result<Arc<ThreadState>> {
    if let Some(title) = &message.title {
        thread.title = title.clone();
    }

    if let Some(thread_message) = thread
        .messages
        .iter_mut()
        .find(|msg| msg.message.id == message.id)
    {
        thread_message.message = message.clone();

        let response = if let Some(responses) = &message.responses {
            match responses.get("messages") {
                Some(messages) => {
                    // First unescape the JSON string properly
                    let clean_message =
                        serde_json::from_value::<String>(messages.clone()).unwrap_or_default();
                    Some(clean_message)
                }
                None => None,
            }
        } else {
            None
        };

        let thoughts = if let Some(context) = &message.context {
            match context.get("thoughts") {
                Some(thoughts) => Some(thoughts.clone()),
                None => None,
            }
        } else {
            None
        };

        let dataset_name = if let Some(context) = &message.context {
            match context.get("dataset_name") {
                Some(dataset_name) => match dataset_name.clone() {
                    Value::String(name) => Some(name),
                    _ => None,
                },
                None => None,
            }
        } else {
            None
        };

        let error = if let Some(context) = &message.context {
            match context.get("error") {
                Some(Value::String(error)) => Some(error.clone()),
                _ => None,
            }
        } else {
            None
        };

        thread.dataset_id = message.dataset_id;
        thread.dataset_name = dataset_name;

        thread_message.response = response;
        thread_message.thoughts = thoughts;
        thread_message.error = error;
    }

    let update_thread = thread.thread.clone();

    let thread_handle = tokio::spawn(async move {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Unable to get connection from pool: {:?}", e);
                send_sentry_error(&e.to_string(), None);
                return;
            }
        };

        match update(threads::table)
            .filter(threads::id.eq(&update_thread.id))
            .set(&update_thread)
            .execute(&mut conn)
            .await
        {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Unable to insert thread: {:?}", e);
                send_sentry_error(&e.to_string(), None);
                return;
            }
        }
    });

    let update_message = message.clone();

    let message_handle = tokio::spawn(async move {
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Unable to get connection from pool: {:?}", e);
                send_sentry_error(&e.to_string(), None);
                return;
            }
        };

        // Explicitly specify all fields that need to be updated
        match diesel::update(messages::table)
            .filter(messages::id.eq(&update_message.id))
            .set((
                messages::responses.eq(&update_message.responses),
                messages::chart_config.eq(&update_message.chart_config),
                messages::data_metadata.eq(&update_message.data_metadata),
                messages::code.eq(&update_message.code),
                messages::context.eq(&update_message.context),
                messages::title.eq(&update_message.title),
                messages::summary_question.eq(&update_message.summary_question),
                messages::time_frame.eq(&update_message.time_frame),
                messages::dataset_id.eq(&update_message.dataset_id),
                messages::updated_at.eq(Utc::now()),
                messages::sql_evaluation_id.eq(&update_message.sql_evaluation_id),
            ))
            .execute(&mut conn)
            .await
        {
            Ok(_) => (),
            Err(e) => {
                tracing::error!("Unable to update message: {:?}", e);
                send_sentry_error(&e.to_string(), None);
            }
        }
    });

    let thread_id = thread.thread.id.clone();
    let summary_question = message.summary_question.clone();
    let title = thread.title.clone();
    let organization_id = thread.thread.organization_id.clone();
    let message_code = message.code.clone();

    let thread_search_handle = tokio::spawn(async move {
        // Skip search record creation if there's no code
        if message_code.is_none() {
            return;
        }

        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Unable to get connection from pool: {:?}", e);
                send_sentry_error(&e.to_string(), None);
                return;
            }
        };

        let query = diesel::sql_query(
            "INSERT INTO asset_search (asset_id, asset_type, content, organization_id) 
             VALUES ($1, 'thread', $2, $3)
             ON CONFLICT (asset_id, asset_type) 
             DO UPDATE SET
                 content = EXCLUDED.content,
                 updated_at = NOW()",
        )
        .bind::<diesel::sql_types::Uuid, _>(thread_id)
        .bind::<diesel::sql_types::Text, _>(summary_question.unwrap_or(title))
        .bind::<diesel::sql_types::Uuid, _>(organization_id);

        if let Err(e) = query.execute(&mut conn).await {
            tracing::error!("Failed to update asset search: {:?}", e);
            send_sentry_error(&e.to_string(), None);
        }
    });

    let (thread_result, message_result, thread_search_result) =
        tokio::join!(thread_handle, message_handle, thread_search_handle);

    if let Err(e) = thread_result {
        tracing::error!("Error in thread update: {:?}", e);
    }
    if let Err(e) = message_result {
        tracing::error!("Error in message update: {:?}", e);
    }
    if let Err(e) = thread_search_result {
        tracing::error!("Error in thread search update: {:?}", e);
    }

    Ok(Arc::new(thread.clone()))
}

async fn rerank_datasets(
    input: &String,
    datasets: Vec<DatasetWithMetadata>,
) -> Result<Vec<DatasetWithMetadata>> {
    let dataset_strings = datasets
        .iter()
        .map(|d| d.dataset_ddl.clone())
        .collect::<Vec<String>>();

    let co = Cohere::default();

    let request = ReRankRequest {
        query: input,
        documents: &dataset_strings,
        model: ReRankModel::EnglishV3,
        top_n: Some(20),
        max_chunks_per_doc: None,
    };

    let response = match co.rerank(&request).await {
        Ok(res) => res,
        Err(e) => {
            tracing::error!("Error reranking datasets: {:?}", e);
            return Ok(datasets);
        }
    };

    let mut reranked_datasets = vec![];

    for result in response {
        reranked_datasets.push(datasets[result.index as usize].clone());
    }

    Ok(reranked_datasets)
}
