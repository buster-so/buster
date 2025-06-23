// Export favorites handlers
mod favorites_utils;
mod list_favorites;
mod create_favorite;
mod delete_favorite;
mod update_favorites;

pub use list_favorites::list_favorites;
pub use create_favorite::{create_favorite, create_favorites_bulk, CreateFavoriteReq};
pub use delete_favorite::{delete_favorite, delete_favorites_bulk};
pub use update_favorites::update_favorites;
pub use favorites_utils::{FavoriteObject, FavoriteIdAndType, UserFavoritesReq};
