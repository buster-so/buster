use anyhow::Result;
use reqwest::{
    header::{HeaderMap, HeaderValue},
    Client,
};
use std::error::Error as StdError;

use super::{
    DeployDatasetsRequest, DeployDatasetsResponse, GenerateApiRequest, GenerateApiResponse,
    PostDataSourcesRequest, ValidateApiKeyRequest, ValidateApiKeyResponse,
};

pub struct BusterClient {
    client: Client,
    base_url: String,
    api_key: String,
}

impl BusterClient {
    pub fn new(base_url: String, api_key: String) -> Result<Self> {
        let client = Client::builder()
            .use_rustls_tls()
            .timeout(std::time::Duration::from_secs(30))
            .build()?;

        Ok(Self {
            client,
            base_url,
            api_key,
        })
    }

    fn build_headers(&self) -> Result<HeaderMap> {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Authorization",
            HeaderValue::from_str(&format!("Bearer {}", self.api_key))?,
        );
        Ok(headers)
    }

    pub async fn validate_api_key(&self) -> Result<bool> {
        let request = ValidateApiKeyRequest {
            api_key: self.api_key.clone(),
        };

        let mut headers = HeaderMap::new();
        headers.insert(
            reqwest::header::CONTENT_TYPE,
            HeaderValue::from_static("application/json"),
        );
        headers.insert(reqwest::header::ACCEPT, HeaderValue::from_static("*/*"));
        headers.insert(
            reqwest::header::USER_AGENT,
            HeaderValue::from_static("buster-cli"),
        );

        let url = format!("{}/api/v1/api_keys/validate", self.base_url);

        let request = self.client.post(&url).headers(headers).json(&request);

        let response = match request.send().await {
            Ok(resp) => resp,
            Err(e) => {
                return Err(anyhow::anyhow!("Request failed: {}", e));
            }
        };

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await?;
            return Err(anyhow::anyhow!(
                "Failed to validate API key. Status: {}, Response: {}",
                status,
                text
            ));
        }

        match response.json::<ValidateApiKeyResponse>().await {
            Ok(validate_response) => Ok(validate_response.valid),
            Err(e) => Err(anyhow::anyhow!(
                "Failed to parse validate API key response: {}",
                e
            )),
        }
    }

    pub async fn post_data_sources(&self, req_body: PostDataSourcesRequest) -> Result<()> {
        let headers = self.build_headers()?;

        // The API expects a single object, not an array, but also our endpoint accepts bulk
        // Let's stick with the current approach but make sure we're sending the data correctly

        match self
            .client
            .post(format!("{}/api/v1/data_sources", self.base_url))
            .headers(headers)
            .json(&req_body)
            .send()
            .await
        {
            Ok(res) => {
                if !res.status().is_success() {
                    return Err(anyhow::anyhow!(
                        "POST /api/v1/data_sources failed: {}",
                        res.text().await?
                    ));
                }
            }
            Err(e) => return Err(anyhow::anyhow!("POST /api/v1/data_sources failed: {}", e)),
        }

        Ok(())
    }

    pub async fn deploy_datasets(
        &self,
        req_body: Vec<DeployDatasetsRequest>,
    ) -> Result<DeployDatasetsResponse> {
        let headers = self.build_headers()?;

        match self
            .client
            .post(format!("{}/api/v1/datasets/deploy", self.base_url))
            .headers(headers)
            .json(&req_body)
            .send()
            .await
        {
            Ok(res) => {
                if !res.status().is_success() {
                    let status = res.status();
                    let body = res.text().await?;
                    return Err(anyhow::anyhow!(
                        "POST /api/v1/datasets/deploy failed with status {}: {}",
                        status,
                        body
                    ));
                }
                match res.json().await {
                    Ok(json_response) => Ok(json_response),
                    Err(e) => Err(anyhow::anyhow!("Failed to parse successful deploy response: {}", e)),
                }
            }
            Err(e) => Err(anyhow::anyhow!(
                "POST /api/v1/datasets/deploy request failed: {}",
                e
            )),
        }
    }

    pub async fn generate_datasets(
        &self,
        req_body: GenerateApiRequest,
    ) -> Result<GenerateApiResponse> {
        let headers = self.build_headers()?;

        match self
            .client
            .post(format!("{}/api/v1/datasets/generate", self.base_url))
            .headers(headers)
            .json(&req_body)
            .send()
            .await
        {
            Ok(res) => {
                if !res.status().is_success() {
                    return Err(anyhow::anyhow!(
                        "POST /api/v1/datasets/generate failed: {}",
                        res.text().await?
                    ));
                }

                let response_text = res.text().await?;

                match serde_json::from_str::<GenerateApiResponse>(&response_text) {
                    Ok(parsed) => Ok(parsed),
                    Err(e) => Err(anyhow::anyhow!("Failed to parse API response: {}", e)),
                }
            }
            Err(e) => Err(anyhow::anyhow!(
                "POST /api/v1/datasets/generate failed: {}",
                e
            )),
        }
    }
}
