use anyhow::{anyhow, Error};
use snowflake_api::SnowflakeApi;

use crate::utils::query_engine::credentials::SnowflakeCredentials;

pub async fn get_snowflake_client(
    credentials: &SnowflakeCredentials,
) -> Result<SnowflakeApi, Error> {
    let snowflake_client = match SnowflakeApi::with_password_auth(
        &credentials.account_id,
        None,
        Some(credentials.database_id.as_str()),
        None,
        &credentials.username,
        credentials.role.as_deref(),
        &credentials.password,
    ) {
        Ok(snowflake) => snowflake,
        Err(e) => {
            tracing::error!("Error creating SnowflakeApi: {}", e);
            return Err(anyhow!(e));
        }
    };

    Ok(snowflake_client)
}
