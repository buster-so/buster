use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{insert_into, update, upsert::excluded, ExpressionMethods};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{enums::AssetType, models::UserFavorite, pool::get_pg_pool, schema::user_favorites};

use super::favorites_utils::{list_user_favorites, FavoriteObject};

#[derive(Deserialize, Serialize, Clone)]
pub struct CreateFavoriteReq {
    pub id: Uuid,
    #[serde(alias = "type")]
    pub asset_type: AssetType,
    pub index: Option<usize>,
}

// Maintain backward compatibility with single item operations
pub async fn create_favorite(
    user: &AuthenticatedUser,
    req: &CreateFavoriteReq,
) -> Result<Vec<FavoriteObject>> {
    create_favorites_bulk(user, &[req.clone()]).await
}

// New function to handle bulk operations
pub async fn create_favorites_bulk(
    user: &AuthenticatedUser,
    favorites: &[CreateFavoriteReq],
) -> Result<Vec<FavoriteObject>> {
    if favorites.is_empty() {
        return list_user_favorites(user).await;
    }

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    // Find the minimum index to know where to start shifting existing favorites
    let min_index = favorites
        .iter()
        .map(|f| f.index.unwrap_or(0))
        .min()
        .unwrap_or(0);

    // Shift existing favorites to make room for new ones (one operation for all)
    match update(user_favorites::table)
        .set(user_favorites::order_index.eq(user_favorites::order_index + favorites.len() as i32))
        .filter(user_favorites::user_id.eq(user.id))
        .filter(user_favorites::order_index.ge(min_index as i32))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error updating user favorites: {}", e)),
    };

    // Prepare all new favorites for bulk insertion
    let user_favorites: Vec<UserFavorite> = favorites
        .iter()
        .enumerate()
        .map(|(i, req)| {
            let index = req.index.unwrap_or(0) + i;
            UserFavorite {
                asset_type: req.asset_type,
                user_id: user.id,
                asset_id: req.id,
                order_index: index as i32,
                created_at: Utc::now(),
                deleted_at: None,
            }
        })
        .collect();

    // Insert all favorites in a single operation
    match insert_into(user_favorites::table)
        .values(&user_favorites)
        .on_conflict((
            user_favorites::user_id,
            user_favorites::asset_id,
            user_favorites::asset_type,
        ))
        .do_update()
        .set((
            user_favorites::deleted_at.eq(excluded(user_favorites::deleted_at)),
            user_favorites::order_index.eq(excluded(user_favorites::order_index)),
        ))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error inserting or updating user favorites: {}", e)),
    };

    list_user_favorites(user).await
}
