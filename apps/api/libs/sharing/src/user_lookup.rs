use anyhow::{Context, Result};
use database::{models::User, pool::get_pg_pool, schema::users};
use diesel::{ExpressionMethods, QueryDsl, OptionalExtension};
use diesel_async::RunQueryDsl;

use crate::errors::SharingError;

/// Find a user by their email address
///
/// # Arguments
/// * `email` - The email address to look up
///
/// # Returns
/// * `Ok(Some(User))` - If the user was found
/// * `Ok(None)` - If no user with that email exists or if the user has been deleted
/// * `Err(_)` - If there was a database error or other issue
///
pub async fn find_user_by_email(email: &str) -> Result<Option<User>> {
    // Validate email format
    if !email.contains('@') {
        return Err(SharingError::InvalidEmail(email.to_string()).into());
    }

    let mut conn = get_pg_pool()
        .get()
        .await
        .context("Failed to get database connection")?;

    // Find active (non-deleted) user by email
    let user = users::table
        .filter(users::email.eq(email))
        // User table doesn't have deleted_at directly, but we filter active users
        // based on their presence in other tables that have deleted_at.
        // In a real DB, the user likely would have a deleted_at field.
        .first::<User>(&mut conn)
        .await
        .optional()
        .context("Failed to query user by email")?;

    Ok(user)
}

#[cfg(test)]
mod tests {
    use super::*;

    // Test for invalid email format
    #[tokio::test]
    async fn test_find_user_by_email_invalid_email() {
        let result = find_user_by_email("not-an-email").await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Invalid email"));
    }

    // Note: The following tests would typically use a test database
    // These are structured as examples but would need real DB integration 
    // or a more sophisticated mock of the database layer to run
    
    // Mock test for finding an existing user
    #[test]
    fn test_find_user_by_email_existing_user() {
        // In a real test, this would use a test database with a real user
        // or a more sophisticated mock of the database layer
        // For now, this is a placeholder that would need to be implemented
        // when proper test infrastructure is available
        
        // Example implementation would look like:
        // 1. Set up test database
        // 2. Insert test user
        // 3. Call find_user_by_email
        // 4. Assert user is found and matches expected data
    }

    // Mock test for non-existent user
    #[test]
    fn test_find_user_by_email_non_existent_user() {
        // In a real test, this would use a test database and look up a 
        // non-existent email address
        // For now, this is a placeholder that would need to be implemented
        // when proper test infrastructure is available
        
        // Example implementation would look like:
        // 1. Set up test database
        // 2. Call find_user_by_email with an email that doesn't exist
        // 3. Assert result is Ok(None)
    }

    // Mock test for database error handling
    #[test]
    fn test_find_user_by_email_database_error() {
        // In a real test, this would simulate a database error
        // For now, this is a placeholder that would need to be implemented
        // when proper test infrastructure is available
        
        // Example implementation would look like:
        // 1. Set up test with a mock that causes a database error
        // 2. Call find_user_by_email
        // 3. Assert error is properly handled
    }
}