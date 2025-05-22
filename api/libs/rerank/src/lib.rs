use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::error::Error;
use dotenv::dotenv;
use std::env;

pub struct Reranker {
    api_key: String,
    base_url: String,
    model: String,
    client: Client,
    environment: String,
}

impl Reranker {
    pub fn new() -> Result<Self, Box<dyn Error>> {
        dotenv().ok();
        let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "production".to_string());
        
        // If local environment, we don't need these values
        let (api_key, model, base_url) = if environment == "local" {
            (String::new(), String::new(), String::new())
        } else {
            (
                env::var("RERANK_API_KEY")?,
                env::var("RERANK_MODEL")?,
                env::var("RERANK_BASE_URL")?,
            )
        };
        
        let client = Client::new();
        Ok(Self {
            api_key,
            base_url,
            model,
            client,
            environment,
        })
    }

    pub async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
        top_n: usize,
    ) -> Result<Vec<RerankResult>, Box<dyn Error>> {
        // Use local fastembed reranking if ENVIRONMENT is set to local
        if self.environment == "local" {
            return self.local_rerank(query, documents, top_n).await;
        }
        
        // Otherwise use the remote API
        let request_body = RerankRequest {
            query: query.to_string(),
            documents: documents.iter().map(|s| s.to_string()).collect(),
            top_n,
            model: self.model.clone(),
        };
        let response = self
            .client
            .post(&self.base_url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&request_body)
            .send()
            .await?;
        let response_body: RerankResponse = response.json().await?;
        Ok(response_body.results)
    }
    
    async fn local_rerank(
        &self,
        query: &str,
        documents: &[&str],
        top_n: usize,
    ) -> Result<Vec<RerankResult>, Box<dyn Error>> {
        use fastembed::{TextRerank, RerankInitOptions, RerankerModel};
        
        // Initialize the reranker model
        let model = TextRerank::try_new(
            RerankInitOptions::new(RerankerModel::JINARerankerV1TurboEn).with_show_download_progress(true),
        )?;
        
        // Limit top_n to the number of documents
        let actual_top_n = std::cmp::min(top_n, documents.len());

        // Perform reranking
        let fastembed_results = model.rerank(query, documents.to_vec(),false, Some(actual_top_n))?;
        
        // Convert fastembed results to our RerankResult format
        let results = fastembed_results
            .iter()
            .map(|result| RerankResult {
                index: result.index,
                relevance_score: result.score,
            })
            .collect();
        
        Ok(results)
    }
}

#[derive(Serialize)]
struct RerankRequest {
    query: String,
    documents: Vec<String>,
    top_n: usize,
    model: String,
}

#[derive(Deserialize)]
struct RerankResponse {
    results: Vec<RerankResult>,
}

#[derive(Deserialize, Clone, Debug)]
pub struct RerankResult {
    pub index: usize,
    pub relevance_score: f32,
} 