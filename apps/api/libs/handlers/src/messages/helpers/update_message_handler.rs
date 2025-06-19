use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{pool::get_pg_pool, schema::messages};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Update a message with new properties
///
/// # Arguments
/// * `user` - The authenticated user
/// * `message_id` - The ID of the message to update
/// * `feedback` - Optional feedback for the message ("positive" or "negative")
///
/// # Returns
/// * `Ok(())` - If the message was successfully updated
/// * `Err(anyhow::Error)` - If there was an error updating the message
pub async fn update_message_handler(
    user: AuthenticatedUser,
    message_id: Uuid,
    feedback: Option<String>,
) -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    // Check if the message exists and belongs to the user
    let message_exists = diesel::dsl::select(diesel::dsl::exists(
        messages::table.filter(
            messages::id.eq(message_id)
                .and(messages::created_by.eq(user.id)),
        ),
    ))
    .get_result::<bool>(&mut conn)
    .await?;

    if !message_exists {
        return Err(anyhow!("Message not found or you don't have permission to update it"));
    }

    // Build update parameters - don't execute the set operation yet
    let update_statement = diesel::update(messages::table)
        .filter(messages::id.eq(message_id));

    // Add feedback if provided
    if let Some(fb_str) = feedback {
        // Update the feedback column directly
        update_statement
            .set((
                messages::updated_at.eq(Utc::now()),
                messages::feedback.eq(fb_str)
            ))
            .execute(&mut conn)
            .await?;
    } else {
        // If no feedback, just update the timestamp
        update_statement
            .set(messages::updated_at.eq(Utc::now()))
            .execute(&mut conn)
            .await?;
    }

    Ok(())
}
