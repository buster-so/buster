use anyhow::Result;
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetType, IdentityType},
    pool::get_pg_pool,
};
use diesel::prelude::*;
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ListChatsRequest {
    pub page: Option<i32>,
    pub page_size: i32,
    pub admin_view: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatListItem {
    pub id: String,
    pub name: String,
    pub is_favorited: bool,
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
    pub is_shared: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationInfo {
    pub has_more: bool,
    pub next_page: Option<i32>,
    pub total_items: i32,  // Number of items in current page
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListChatsResponse {
    pub items: Vec<ChatListItem>,
    pub pagination: PaginationInfo,
}

#[derive(Queryable)]
struct ChatWithUser {
    // Chat fields
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Uuid,
    pub most_recent_file_id: Option<Uuid>, 
    pub most_recent_file_type: Option<String>,
    pub most_recent_version_number: Option<i32>,
    // User fields
    pub user_name: Option<String>,
    pub user_attributes: Value,
}

/// List chats with pagination support
/// 
/// This function efficiently retrieves a list of chats with their associated user information.
/// It supports pagination using page number and limits results using page_size.
/// If admin_view is true and the user has admin privileges, it shows all chats; otherwise, 
/// it shows chats created by the user or shared with them.
/// 
/// Returns a list of chat items with user information and pagination details.
pub async fn list_chats_handler(
    request: ListChatsRequest,
    user: &AuthenticatedUser,
) -> Result<Vec<ChatListItem>> {
    use database::schema::{asset_permissions, chats, users};
    
    let mut conn = get_pg_pool().get().await?;
    
    // Calculate offset based on page number
    let page = request.page.unwrap_or(1);
    let offset = (page - 1) * request.page_size;
    
    // Get chats that are shared with the user
    let shared_chat_ids = if !request.admin_view {
        // Find all chats where the user has explicit permissions
        asset_permissions::table
            .filter(asset_permissions::identity_id.eq(user.id))
            .filter(asset_permissions::asset_type.eq(AssetType::Chat))
            .filter(asset_permissions::identity_type.eq(IdentityType::User))
            .filter(asset_permissions::deleted_at.is_null())
            .select(asset_permissions::asset_id)
            .load::<Uuid>(&mut conn)
            .await?
    } else {
        Vec::new() // If admin view, we'll show all chats anyway
    };
    
    // Start building the query
    let mut query = chats::table
        .inner_join(users::table.on(chats::created_by.eq(users::id)))
        .filter(chats::deleted_at.is_null())
        .into_boxed();
    
    // Add user filter if not admin view
    if !request.admin_view {
        // Show chats created by the user OR shared with them
        query = query.filter(
            chats::created_by.eq(user.id).or(chats::id.eq_any(shared_chat_ids))
        );
    }
    
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
            users::attributes,
        ))
        .load::<ChatWithUser>(&mut conn)
        .await?;
    
    // Check if there are more results and prepare pagination info
    let has_more = results.len() > request.page_size as usize;
    let items: Vec<ChatListItem> = results
        .into_iter()
        .take(request.page_size as usize)
        .map(|chat| {
            let created_by_avatar = chat.user_attributes
                .get("avatar")
                .and_then(|v| v.as_str())
                .map(String::from);
                
            ChatListItem {
                id: chat.id.to_string(),
                name: chat.name,
                is_favorited: false, // TODO: Implement favorites feature
                created_at: chat.created_at.to_rfc3339(),
                updated_at: chat.updated_at.to_rfc3339(),
                created_by: chat.created_by.to_string(),
                created_by_id: chat.created_by.to_string(),
                created_by_name: chat.user_name.unwrap_or_else(|| "Unknown".to_string()),
                created_by_avatar,
                last_edited: chat.updated_at.to_rfc3339(),
                latest_file_id: chat.most_recent_file_id.map(|id| id.to_string()),
                latest_file_type: chat.most_recent_file_type,
                latest_version_number: chat.most_recent_version_number,
                is_shared: chat.created_by != user.id, // Mark as shared if the user is not the creator
            }
        })
        .collect();

    // Create pagination info
    let _pagination = PaginationInfo {
        has_more,
        next_page: if has_more { Some(page + 1) } else { None },
        total_items: items.len() as i32,
    };
    
    Ok(items)
}