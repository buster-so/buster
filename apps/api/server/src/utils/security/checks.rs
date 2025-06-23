use anyhow::Result;
use middleware::AuthenticatedUser;
use serde_json::Value;
use uuid::Uuid;

/// Checks if a user has workspace admin or data admin privileges
///
/// # Arguments
/// * `user_id` - UUID of the user to check permissions for
///
/// # Returns
/// * `bool` - True if user is workspace admin or data admin, false otherwise
///
/// # Errors
/// * Database connection errors
/// * User not found errors
pub async fn is_user_workspace_admin_or_data_admin(
    user: &AuthenticatedUser,
    organization_id: &Uuid,
) -> Result<bool> {
    let user_organization_id = match user.attributes.get("organization_id") {
        Some(Value::String(id)) => Uuid::parse_str(id).map_err(|e| anyhow::anyhow!(e))?,
        Some(_) => return Err(anyhow::anyhow!("User organization id not found")),
        None => return Err(anyhow::anyhow!("User organization id not found")),
    };

    let user_role = match user.attributes.get("organization_role") {
        Some(Value::String(role)) => role,
        Some(_) => return Err(anyhow::anyhow!("User role not found")),
        None => return Err(anyhow::anyhow!("User role not found")),
    };

    if &user_organization_id == organization_id {
        if vec!["workspace_admin", "data_admin"].contains(&user_role.as_str()) {
            Ok(true)
        } else {
            Ok(false)
        }
    } else {
        Ok(false)
    }
}
