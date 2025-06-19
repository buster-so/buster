use crate::pool::get_pg_pool;
use anyhow::{anyhow, Result};
use diesel::{
    deserialize::QueryableByName,
    sql_types::{Nullable, Text, Uuid as SqlUuid},
};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

// Creates a new secret using the vault extension function
// Takes secret value, name, and an optional description
// Returns the Uuid of the newly created secret
pub async fn create_secret(
    secret_value: &str,
    name: &str,
    description: Option<&str>,
) -> Result<()> {
    let mut conn = get_pg_pool()
        .get()
        .await
        .map_err(|e| anyhow!("Error getting client from pool: {}", e))?;

    // Call the vault function to create the secret and return its ID
    match diesel::sql_query("SELECT vault.create_secret($1, $2, $3)")
        .bind::<Text, _>(secret_value)
        .bind::<Text, _>(name)
        .bind::<Text, _>(description.unwrap_or(""))
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error creating secret via vault function: {}", e)),
    }
}

#[derive(QueryableByName)]
struct Secret {
    #[diesel(sql_type = Text)]
    decrypted_secret: String,
}

pub async fn read_secret(secret_id: &Uuid) -> Result<String> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting client from pool: {}", e)),
    };

    let secret = match diesel::sql_query(
        "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = $1 LIMIT 1",
    )
    .bind::<Text, _>(secret_id.to_string())
    .get_result::<Secret>(&mut conn)
    .await
    {
        Ok(row) => row.decrypted_secret,
        Err(e) => {
            tracing::error!("Unable to read secret from database: {:?}", e);
            return Err(anyhow!("Unable to read secret from database: {}", e));
        }
    };

    Ok(secret)
}

// Updates an existing secret using the vault extension function
// Takes the secret's Uuid, new value, new name, and optional new description
pub async fn update_secret(
    secret_id: &Uuid,
    secret_value: &str,
    name: &str,
    description: Option<&str>,
) -> Result<()> {
    let mut conn = get_pg_pool()
        .get()
        .await
        .map_err(|e| anyhow!("Error getting client from pool: {}", e))?;

    // Call the vault function to update the secret
    match diesel::sql_query("SELECT vault.update_secret($1, $2, $3, $4)")
        .bind::<SqlUuid, _>(secret_id)
        .bind::<Text, _>(secret_value)
        .bind::<Text, _>(name)
        .bind::<Nullable<Text>, _>(description)
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error updating secret via vault function: {}", e)),
    }
}

// Deletes an existing secret using the vault extension function
pub async fn delete_secret(secret_id: &Uuid) -> Result<()> {
    let mut conn = get_pg_pool()
        .get()
        .await
        .map_err(|e| anyhow!("Error getting client from pool: {}", e))?;

    // Call the vault function to delete the secret
    match diesel::sql_query("SELECT vault.delete_secret($1)")
        .bind::<Text, _>(secret_id.to_string())
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error deleting secret via vault function: {}", e)),
    }
}
