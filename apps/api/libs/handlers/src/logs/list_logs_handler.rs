use chrono::{DateTime, Utc};
use database::enums::ChatType;
use database::pool::get_pg_pool;
use diesel::prelude::*;
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ListLogsRequest {
    pub page: Option<i32>,
    pub page_size: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogListItem {
    pub id: String,
    pub name: String,
    pub updated_at: String,
    pub created_at: String,
    pub created_by: String,
    pub created_by_id: String,
    pub created_by_name: String,
    pub created_by_avatar: Option<String>,
    pub last_edited: String,
    pub latest_file_id: Option<String>,
    pub latest_file_type: Option<String>,
    pub latest_version_number: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationInfo {
    pub has_more: bool,
    pub next_page: Option<i32>,
    pub total_items: i32, // Number of items in current page
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListLogsResponse {
    pub items: Vec<LogListItem>,
    pub pagination: PaginationInfo,
}

#[derive(Queryable)]
struct ChatWithUser {
    // Chat fields
    pub id: Uuid,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Uuid,
    pub most_recent_file_id: Option<Uuid>,
    pub most_recent_file_type: Option<database::enums::AssetType>,
    pub most_recent_version_number: Option<i32>,
    // User fields
    pub user_name: Option<String>,
    pub user_email: String,
    pub user_avatar_url: Option<String>,
}

/// List logs with pagination support
///
/// This function efficiently retrieves a list of chats (logs) with their associated user information.
/// It supports pagination using page number and limits results using page_size.
/// Unlike the regular chats endpoint, logs are not restricted to the user and are visible to everyone.
///
/// Returns a list of log items with user information and pagination details.
pub async fn list_logs_handler(
    request: ListLogsRequest,
    organization_id: Uuid,
) -> Result<ListLogsResponse, anyhow::Error> {
    use database::schema::{chats, messages, users};

    let mut conn = get_pg_pool().get().await?;

    // Start building the query
    let mut query = chats::table
        .inner_join(users::table.on(chats::created_by.eq(users::id)))
        .filter(chats::deleted_at.is_null())
        .filter(chats::organization_id.eq(organization_id))
        .filter(chats::title.ne("")) // Filter out empty titles
        .filter(chats::title.ne(" ")) // Filter out single space
        .filter(chats::chat_type.eq(Some(ChatType::Analyst)))
        .filter(
            diesel::dsl::exists(
                messages::table
                    .filter(messages::chat_id.eq(chats::id))
                    .filter(messages::request_message.is_not_null())
                    .filter(messages::deleted_at.is_null())
            ).or(
                diesel::dsl::sql::<diesel::sql_types::Bool>(
                    "(SELECT COUNT(*) FROM messages WHERE messages.chat_id = chats.id AND messages.deleted_at IS NULL) > 1"
                )
            )
        )
        .into_boxed();

    // Calculate offset based on page number
    let page = request.page.unwrap_or(1);
    let offset = (page - 1) * request.page_size;

    // Order by updated date descending and apply pagination
    query = query
        .order_by(chats::updated_at.desc())
        .offset(offset as i64)
        .limit((request.page_size + 1) as i64);

    // Execute query and select required fields
    let results: Vec<ChatWithUser> = query
        .select((
            chats::id,
            chats::title,
            chats::created_at,
            chats::updated_at,
            chats::created_by,
            chats::most_recent_file_id,
            chats::most_recent_file_type,
            chats::most_recent_version_number,
            users::name.nullable(),
            users::email,
            users::avatar_url.nullable(),
        ))
        .load::<ChatWithUser>(&mut conn)
        .await?;

    // Check if there are more results and prepare pagination info
    let has_more = results.len() > request.page_size as usize;
    let items: Vec<LogListItem> = results
        .into_iter()
        .filter(|chat| !chat.title.trim().is_empty()) // Filter out titles with only whitespace
        .take(request.page_size as usize)
        .map(|chat| {
            LogListItem {
                id: chat.id.to_string(),
                name: chat.title,
                created_at: chat.created_at.to_rfc3339(),
                updated_at: chat.updated_at.to_rfc3339(),
                created_by: chat.created_by.to_string(),
                created_by_id: chat.created_by.to_string(),
                created_by_name: chat.user_name.unwrap_or_else(|| chat.user_email.clone()),
                created_by_avatar: chat.user_avatar_url,
                last_edited: chat.updated_at.to_rfc3339(),
                latest_file_id: chat.most_recent_file_id.map(|id| id.to_string()),
                latest_file_type: chat.most_recent_file_type.map(|t| t.to_string().to_string()),
                latest_version_number: chat.most_recent_version_number,
            }
        })
        .collect();

    // Create pagination info
    let pagination = PaginationInfo {
        has_more,
        next_page: if has_more { Some(page + 1) } else { None },
        total_items: items.len() as i32,
    };

    Ok(ListLogsResponse { items, pagination })
}
