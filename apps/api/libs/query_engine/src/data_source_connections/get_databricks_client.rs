use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::credentials::DatabricksCredentials;

pub async fn get_databricks_client(credentials: &DatabricksCredentials) -> Result<Databricks> {
    let databricks_client = Databricks::new(credentials).await;

    Ok(databricks_client)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DatabricksColumn {
    pub name: String,
    pub type_name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DatabricksTable {
    pub name: String,
    pub catalog_name: String,
    pub schema_name: String,
    pub table_type: String,
    pub columns: Vec<DatabricksColumn>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DatabricksTableResponse {
    pub tables: Vec<DatabricksTable>,
}

#[derive(Clone)]
pub struct Databricks {
    pub host: String,
    pub api_key: String,
    pub catalog_name: String,
    pub warehouse_id: String,
}

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct DatabricksQuery {
    pub warehouse_id: String,
    pub catalog: String,
    pub statement: String,
}

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct Status {
    pub state: String,
}

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct Schema {
    pub column_count: i32,
    pub columns: Vec<DatabricksColumn>,
}

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct DatabricksResult {
    pub row_count: Option<i32>,
    pub row_offset: Option<i32>,
    pub data_array: Option<Vec<Vec<String>>>,
}

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct Manifest {
    pub format: String,
    pub schema: Schema,
}

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct QueryResponse {
    pub statement_id: String,
    pub status: Status,
    pub manifest: Manifest,
    pub result: DatabricksResult,
}

impl Databricks {
    pub async fn new(databricks_credentials: &DatabricksCredentials) -> Self {
        Databricks {
            host: databricks_credentials.host.clone(),
            api_key: databricks_credentials.api_key.clone(),
            catalog_name: databricks_credentials.default_catalog.clone(),
            warehouse_id: databricks_credentials.warehouse_id.clone(),
        }
    }

    pub async fn query(self, statement: String) -> Result<QueryResponse> {
        let client = reqwest::Client::new();

        let databricks_query = DatabricksQuery {
            warehouse_id: self.warehouse_id,
            catalog: self.catalog_name,
            statement,
        };

        let query_result = match client
            .post(format!(
                "https://{host}/api/2.0/sql/statements/",
                host = self.host
            ))
            .headers({
                let mut headers = reqwest::header::HeaderMap::new();
                headers.insert(
                    reqwest::header::AUTHORIZATION,
                    format!("Bearer {}", self.api_key).parse().unwrap(),
                );
                headers
            })
            .timeout(Duration::from_secs(300))
            .json(&databricks_query)
            .send()
            .await
        {
            Ok(res) => res,
            Err(e) => return Err(anyhow!(e.to_string())),
        };

        let response: QueryResponse = match query_result.json().await {
            Ok(res) => res,
            Err(e) => return Err(anyhow!(e.to_string())),
        };

        Ok(response)
    }
}
