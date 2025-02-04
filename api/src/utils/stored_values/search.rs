use anyhow::Result;
use cohere_rust::{api::rerank::{ReRankModel, ReRankRequest}, Cohere};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::utils::clients::ai::embedding_router::embedding_router;

use super::search_stored_values;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredValue {
    pub value: String,
    pub dataset_id: Uuid,
    pub column_name: String,
    pub column_id: Uuid,
}

pub async fn search_values_for_dataset(
    organization_id: &Uuid,
    dataset_id: &Uuid,
    query: String,
) -> Result<Vec<StoredValue>> {
    // Create embedding for the search query
    let query_vec = vec![query.clone()];
    let query_embedding = embedding_router(query_vec, true).await?[0].clone();

    // Get initial candidates using vector similarity
    let candidates = search_stored_values(
        organization_id,
        dataset_id,
        query_embedding,
        Some(25), // Get more candidates for reranking
    ).await?;

    // Extract just the values for reranking
    let candidate_values: Vec<String> = candidates.iter().map(|(value, _, _)| value.clone()).collect();

    // Rerank the candidates using the cohere client
    let co = Cohere::default();
    let request = ReRankRequest {
        query: query.as_str(),
        documents: &candidate_values,
        model: ReRankModel::EnglishV3,
        top_n: Some(10),
        ..Default::default()
    };

    let response = co.rerank(&request).await?;
    
    // Convert to StoredValue structs
    let values = response.into_iter()
        .map(|result| {
            let (value, column_name, column_id) = candidates[result.index as usize].clone();
            StoredValue {
                value,
                dataset_id: *dataset_id,
                column_name,
                column_id,
            }
        })
        .collect();

    Ok(values)
} 