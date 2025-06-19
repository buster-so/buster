use axum::{
    extract::Path,
    http::StatusCode,
    Extension, Json,
};
use handlers::chats::sharing::UpdateChatSharingRequest;
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Update sharing permissions for a chat
///
/// This endpoint updates sharing permissions for a chat with the provided details.
/// Requires Owner or FullAccess permission.
///
/// Request body format:
/// ```json
/// {
///     "users": [
///         {
///             "email": "user@example.com",
///             "role": "CanView"
///         }
///     ],
///     "publicly_accessible": true,
///     "public_password": {
///         "update": "password" 
///     },
///     "public_expiry_date": {
///         "update": "2023-12-31T23:59:59Z"
///     }
/// }
/// ```
/// All fields are optional. Field update options:
/// - `users`: List of users to share with. If omitted, existing shares are not changed.
/// - `publicly_accessible`: Boolean flag. If `true`, asset becomes public; if `false`, asset becomes private.
/// - `public_password`: Object with one of these values:
///   - `"no_change"`: Keep existing password (default if field omitted)
///   - `"set_null"`: Remove existing password
///   - `{"update": "new_password"}`: Set a new password
/// - `public_expiry_date`: Object with one of these values:
///   - `"no_change"`: Keep existing expiry date (default if field omitted)
///   - `"set_null"`: Remove existing expiry date
///   - `{"update": "2023-12-31T23:59:59Z"}`: Set a new expiry date (ISO-8601 format)
/// 
/// Note: Currently, chats don't support public sharing. The `public_*` fields are included for API consistency
/// but are ignored in the implementation.
/// 



pub async fn update_chat_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateChatSharingRequest>,
) -> Result<Json<String>, (StatusCode, String)> {
    tracing::info!("Processing PUT request for chat sharing with ID: {}, user_id: {}", id, user.id);

    // Call the handler from the handlers crate with the updated request format
    match handlers::chats::sharing::update_chat_sharing_handler(&id, &user, request).await {
        Ok(_) => Ok(Json("Sharing permissions updated successfully".to_string())),
        Err(e) => {
            tracing::error!("Error updating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Chat not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update sharing permissions: {}", e)))
        }
    }
}