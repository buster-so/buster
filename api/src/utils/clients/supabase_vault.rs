use std::collections::HashMap;

use crate::database::lib::get_pg_pool;
use anyhow::{anyhow, Result};
use diesel::{deserialize::QueryableByName, sql_types::Text};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

pub async fn create_secret(secret_value: &String) -> Result<Uuid> {
    let secret_id = Uuid::new_v4();

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting client from pool: {}", e)),
    };

    match diesel::sql_query("INSERT INTO vault.secrets (id, secret) VALUES ($1, $2)")
        .bind::<diesel::sql_types::Uuid, _>(&secret_id)
        .bind::<diesel::sql_types::Text, _>(secret_value)
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(secret_id),
        Err(e) => Err(anyhow!("Error inserting secret: {}", e)),
    }
}

pub async fn create_secrets(
    secret_values: &HashMap<String, String>,
) -> Result<HashMap<String, Uuid>> {
    // Log the secret values for Redshift
    for (name, value) in secret_values {
        if value.contains("\"type\":\"redshift\"") {
            tracing::info!("Creating secret for Redshift data source '{}': {}", name, value);
        }
    }

    let secrets: Vec<(Uuid, &String)> = secret_values
        .iter()
        .map(|(_, value)| (Uuid::new_v4(), value))
        .collect();

    let secret_mappings: HashMap<String, Uuid> = secret_values
        .keys()
        .zip(secrets.iter().map(|(id, _)| *id))
        .map(|(name, id)| (name.clone(), id))
        .collect();

    let mut conn = get_pg_pool().get().await?;

    let (ids, values): (Vec<_>, Vec<_>) = secrets.iter().cloned().unzip();
    
    diesel::sql_query(
        "INSERT INTO vault.secrets (id, secret) 
         SELECT * FROM UNNEST($1::uuid[], $2::text[])"
    )
    .bind::<diesel::sql_types::Array<diesel::sql_types::Uuid>, _>(&ids)
    .bind::<diesel::sql_types::Array<diesel::sql_types::Text>, _>(&values)
    .execute(&mut conn)
    .await
    .map_err(|e| anyhow!("Error inserting secrets: {}", e))?;

    Ok(secret_mappings)
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
        "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = $1 LIMIT 1",
    )
    .bind::<diesel::sql_types::Uuid, _>(secret_id)
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

pub async fn update_secret(secret_id: &Uuid, secret_value: &String) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting client from pool: {}", e)),
    };

    match diesel::sql_query("UPDATE vault.secrets SET secret = $1 WHERE id = $2")
        .bind::<diesel::sql_types::Text, _>(secret_value)
        .bind::<diesel::sql_types::Uuid, _>(secret_id)
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error updating secret: {}", e)),
    }
}

pub async fn delete_secret(secret_id: &Uuid) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting client from pool: {}", e)),
    };

    match diesel::sql_query("DELETE FROM vault.secrets WHERE id = $1")
        .bind::<diesel::sql_types::Uuid, _>(secret_id)
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error deleting secret: {}", e)),
    }
}
