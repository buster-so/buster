use anyhow::Result;
use reqwest::{
    header::{HeaderMap, HeaderValue},
    Client,
};
use std::error::Error as StdError;

use super::{
    PostDataSourcesRequest, DeployDatasetsRequest, ValidateApiKeyRequest, ValidateApiKeyResponse,
    DeployDatasetsResponse, GenerateApiRequest, GenerateApiResponse,
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
            .timeout(std::time::Duration::from_secs(120))  // Increase timeout to 2 minutes for larger operations
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
        headers.insert(
            reqwest::header::ACCEPT,
            HeaderValue::from_static("*/*"),
        );
        headers.insert(
            reqwest::header::USER_AGENT,
            HeaderValue::from_static("buster-cli"),
        );

        let url = format!("{}/api/v1/api_keys/validate", self.base_url);

        let request = self
            .client
            .post(&url)
            .headers(headers)
            .json(&request);

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
            Ok(validate_response) => {
                Ok(validate_response.valid)
            }
            Err(e) => {
                Err(anyhow::anyhow!(
                    "Failed to parse validate API key response: {}",
                    e
                ))
            }
        }
    }

    pub async fn post_data_sources(&self, req_body: Vec<PostDataSourcesRequest>) -> Result<()> {
        let headers = self.build_headers()?;

        // Debug log the request body
        println!("DEBUG: post_data_sources request body: {}", serde_json::to_string_pretty(&req_body).unwrap_or_else(|_| "Failed to serialize request".to_string()));

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
                Ok(())
            }
            Err(e) => Err(anyhow::anyhow!("POST /api/v1/data_sources failed: {}", e)),
        }
    }

    pub async fn deploy_datasets(&self, req_body: Vec<DeployDatasetsRequest>) -> Result<DeployDatasetsResponse> {
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
                    return Err(anyhow::anyhow!(
                        "POST /api/v1/datasets/deploy failed: {}",
                        res.text().await?
                    ));
                }
                Ok(res.json().await?)
            }
            Err(e) => Err(anyhow::anyhow!("POST /api/v1/datasets/deploy failed: {}", e)),
        }
    }

    pub async fn generate_datasets(&self, req_body: GenerateApiRequest) -> Result<GenerateApiResponse> {
        let headers = self.build_headers()?;

        println!("🔄 Sending request to generate {} models from data source '{}' in schema '{}'",
            req_body.model_names.len(),
            req_body.data_source_name,
            req_body.schema
        );

        match self
            .client
            .post(format!("{}/api/v1/datasets/generate", self.base_url))
            .headers(headers)
            .json(&req_body)
            .send()
            .await
        {
            Ok(res) => {
                let status = res.status();
                if !status.is_success() {
                    let error_text = res.text().await?;
                    println!("❌ API request failed with status {}: {}", status, error_text);
                    return Err(anyhow::anyhow!(
                        "POST /api/v1/datasets/generate failed with status {}: {}",
                        status,
                        error_text
                    ));
                }
                
                let response_text = res.text().await?;
                
                match serde_json::from_str::<GenerateApiResponse>(&response_text) {
                    Ok(parsed) => {
                        // Log error summary if there are errors
                        if !parsed.errors.is_empty() {
                            println!("⚠️ API returned errors for {} out of {} models:", 
                                parsed.errors.len(), 
                                req_body.model_names.len()
                            );
                        }
                        Ok(parsed)
                    },
                    Err(e) => {
                        println!("❌ Failed to parse API response: {}", e);
                        println!("📄 Raw API response (first 1000 chars): {}", 
                            if response_text.len() > 1000 {
                                format!("{}... (truncated)", &response_text[..1000])
                            } else {
                                response_text.clone()
                            }
                        );
                        Err(anyhow::anyhow!(
                            "Failed to parse API response: {}. Please check your server logs.",
                            e
                        ))
                    }
                }
            }
            Err(e) => {
                println!("❌ API request failed: {}", e);
                println!("🔍 Check network connectivity and API server status");
                Err(anyhow::anyhow!("POST /api/v1/datasets/generate failed: {}", e))
            },
        }
    }
}
