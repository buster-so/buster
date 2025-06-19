use anyhow::Result;
use middleware::AuthenticatedUser;

use super::favorites_utils::{list_user_favorites, FavoriteObject};

pub async fn list_favorites(user: &AuthenticatedUser) -> Result<Vec<FavoriteObject>> {
    list_user_favorites(user).await
}
