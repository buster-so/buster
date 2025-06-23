use anyhow::{anyhow, Error};
use gcp_bigquery_client::{yup_oauth2::ServiceAccountKey, Client};

use crate::credentials::BigqueryCredentials;

pub async fn get_bigquery_client(
    credentials: &BigqueryCredentials,
) -> Result<(Client, String), Error> {
    let sa_key: ServiceAccountKey = serde_json::from_value(credentials.credentials_json.clone())
        .map_err(|e| {
            tracing::error!("Failed to deserialize service account key: {}", e);
            anyhow!(e)
        })?;

    let client = Client::from_service_account_key(sa_key, false)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create BigQuery client: {}", e);
            anyhow!(e)
        })?;

    Ok((client, credentials.default_project_id.clone()))
}
