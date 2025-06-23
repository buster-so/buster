use anyhow::{anyhow, Error};
use snowflake_api::SnowflakeApi;

use crate::credentials::SnowflakeCredentials;

// TODO: make sure that can handle database attached to  datasets or other option
pub async fn get_snowflake_client(
    credentials: &SnowflakeCredentials,
) -> Result<SnowflakeApi, Error> {
    let snowflake_client = match SnowflakeApi::with_password_auth(
        &credentials.account_id,
        Some(&credentials.warehouse_id),
        Some(&credentials.default_database),
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
