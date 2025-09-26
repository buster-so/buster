use anyhow::Result;
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetType, IdentityType, WorkspaceSharing},
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
    use database::schema::{asset_permissions, chats, messages, users, user_favorites};
    
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
        .filter(chats::title.ne("")) // Filter out empty titles
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
    
    // Add user filter if not admin view
    if !request.admin_view {
        // Show chats created by the user OR shared with them
        query = query.filter(
            chats::created_by.eq(user.id).or(chats::id.eq_any(shared_chat_ids))
        );
    }
    
    // Order by updated date descending (no pagination yet)
    query = query
        .order_by(chats::updated_at.desc());
    
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
    
    // Get user's organization IDs  
    let user_org_ids: Vec<Uuid> = user.organizations.iter().map(|org| org.id).collect();
    
    // Get user's favorited chat IDs
    let favorited_chat_ids: Vec<Uuid> = if !request.admin_view {
        asset_permissions::table
            .filter(asset_permissions::identity_id.eq(user.id))
            .filter(asset_permissions::asset_type.eq(AssetType::Chat))
            .filter(asset_permissions::identity_type.eq(IdentityType::User))
            .filter(asset_permissions::deleted_at.is_null())
            .select(asset_permissions::asset_id)
            .union(
                user_favorites::table
                    .filter(user_favorites::user_id.eq(user.id))
                    .filter(user_favorites::asset_type.eq(AssetType::Chat))
                    .filter(user_favorites::deleted_at.is_null())
                    .select(user_favorites::asset_id)
            )
            .load::<Uuid>(&mut conn)
            .await?
    } else {
        Vec::new()
    };

    // Second query: Get workspace-shared chats that the user doesn't have direct access to
    // but has either contributed to or favorited
    let workspace_shared_chats = if !request.admin_view && !user_org_ids.is_empty() {
        chats::table
            .inner_join(users::table.on(chats::created_by.eq(users::id)))
            .filter(chats::deleted_at.is_null())
            .filter(chats::title.ne(""))
            .filter(chats::organization_id.eq_any(&user_org_ids))
            .filter(chats::workspace_sharing.ne(WorkspaceSharing::None))
            // Exclude chats we already have direct access to
            .filter(
                chats::created_by.ne(user.id).and(
                    diesel::dsl::not(diesel::dsl::exists(
                        asset_permissions::table
                            .filter(asset_permissions::asset_id.eq(chats::id))
                            .filter(asset_permissions::asset_type.eq(AssetType::Chat))
                            .filter(asset_permissions::identity_id.eq(user.id))
                            .filter(asset_permissions::identity_type.eq(IdentityType::User))
                            .filter(asset_permissions::deleted_at.is_null())
                    ))
                )
            )
            // Only include if user has contributed (created or updated a message) or favorited
            .filter(
                // User has favorited the chat
                chats::id.eq_any(&favorited_chat_ids)
                .or(
                    // User has created a message in the chat
                    diesel::dsl::exists(
                        messages::table
                            .filter(messages::chat_id.eq(chats::id))
                            .filter(messages::created_by.eq(user.id))
                            .filter(messages::deleted_at.is_null())
                    )
                )
                .or(
                    // User has updated the chat
                    chats::updated_by.eq(user.id)
                )
            )
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
            .order_by(chats::updated_at.desc())
            .load::<ChatWithUser>(&mut conn)
            .await?
    } else {
        vec![]
    };

    // Process all chats first
    let mut all_items: Vec<ChatListItem> = Vec::new();
    
    // Process directly-accessed chats
    for chat in results {
        if !chat.title.trim().is_empty() {
            all_items.push(ChatListItem {
                id: chat.id.to_string(),
                name: chat.title,
                is_favorited: false, // TODO: Implement favorites feature
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
                is_shared: chat.created_by != user.id, // Mark as shared if the user is not the creator
            });
        }
    }

    // Add all workspace-shared chats
    for chat in workspace_shared_chats {
        if !chat.title.trim().is_empty() {
            all_items.push(ChatListItem {
                id: chat.id.to_string(),
                name: chat.title,
                is_favorited: false,
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
                is_shared: true, // Always true for workspace-shared chats
            });
        }
    }

    // Sort all items by updated_at descending
    all_items.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    
    // Apply pagination
    let total_items = all_items.len();
    let start_index = offset as usize;
    let end_index = (start_index + request.page_size as usize).min(total_items);
    
    let paginated_items: Vec<ChatListItem> = all_items.into_iter()
        .skip(start_index)
        .take(request.page_size as usize)
        .collect();
    
    // Check if there are more results
    let has_more = end_index < total_items;
    
    // Create pagination info
    let _pagination = PaginationInfo {
        has_more,
        next_page: if has_more { Some(page + 1) } else { None },
        total_items: paginated_items.len() as i32,
    };
    
    Ok(paginated_items)
}
