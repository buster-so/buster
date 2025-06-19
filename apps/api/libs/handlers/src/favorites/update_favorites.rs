use anyhow::Result;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use super::favorites_utils::{list_user_favorites, update_favorites as update_favorites_util, FavoriteObject};

pub async fn update_favorites(
    user: &AuthenticatedUser,
    favorites: &[Uuid],
) -> Result<Vec<FavoriteObject>> {
    match update_favorites_util(user, favorites).await {
        Ok(_) => (),
        Err(e) => return Err(e),
    };

    list_user_favorites(user).await
}
