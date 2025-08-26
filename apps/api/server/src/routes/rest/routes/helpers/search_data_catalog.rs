use axum::{routing::post, Extension, Json, Router};
use cohere_rust::{
    api::rerank::{ReRankModel, ReRankRequest},
    Cohere,
};
use database::{pool::get_pg_pool, schema::datasets};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use futures::stream::{self, StreamExt};
use litellm::{AgentMessage, ChatCompletionRequest, LiteLLMClient, Metadata, ResponseFormat};
use middleware::types::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use secrets::get_secret_sync_or_default;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct SearchDataCatalogRequest {
    queries: Vec<String>,
    user_request: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SearchDataCatalogResponse {
    results: Vec<DatasetResult>,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq, Hash)]
pub struct DatasetResult {
    id: Uuid,
    name: Option<String>,
    yml_content: Option<String>,
}

// Model representing a dataset from the database
#[derive(Debug, Queryable, Selectable, Clone)]
#[diesel(table_name = datasets)]
#[diesel(check_for_backend(diesel::pg::Pg))]
struct Dataset {
    id: Uuid,
    name: String,
    #[diesel(column_name = "yml_file")]
    yml_content: Option<String>,
    // Other fields omitted for query
}

#[derive(Debug, Clone)]
struct RankedDataset {
    dataset: Dataset,
    relevance_score: f64,
}

#[derive(Debug, Deserialize)]
struct LLMFilterResponse {
    results: Vec<FilteredDataset>,
}

#[derive(Debug, Deserialize)]
struct FilteredDataset {
    id: String,
    reason: String,
}

const LLM_FILTER_PROMPT: &str = r#"
You are a dataset relevance evaluator. Your task is to determine which datasets might contain information relevant to the user's query based on their structure and metadata. Be inclusive in your evaluation - if there's a reasonable chance the dataset could be useful, include it.

USER REQUEST: {user_request}
SEARCH QUERY: {query}

Below is a list of datasets that were identified as potentially relevant by an initial semantic ranking system.
For each dataset, review its description in the YAML format and determine if its structure could potentially be suitable for the user's query.
Include datasets that have even a reasonable possibility of containing relevant information.

DATASETS:
{datasets_json}

Return a JSON response with the following structure:
```json
{
  "results": [
    {
      "id": "dataset-uuid-here",
      "reason": "Brief explanation of why this dataset's structure might be relevant"
    },
    // ... more potentially relevant datasets
  ]
}
```

IMPORTANT GUIDELINES:
1. Be inclusive - if there's a reasonable possibility the dataset could be useful, include it
2. Consider both direct and indirect relationships to the query
3. For example, if a user asks about "red bull sales", consider datasets about:
   - Direct relevance: products, sales, inventory
   - Indirect relevance: marketing campaigns, customer demographics, store locations
4. Evaluate based on whether the dataset's schema, fields, or description MIGHT contain or relate to the relevant information
5. Include datasets that could provide contextual or supporting information
6. When in doubt about relevance, lean towards including the dataset
7. Ensure the "id" field exactly matches the dataset's UUID
8. Use both the USER REQUEST and SEARCH QUERY to understand the user's information needs broadly
9. Consider these elements in the dataset metadata:
   - Column names and their data types
   - Entity relationships
   - Predefined metrics
   - Table schemas
   - Dimension hierarchies
   - Related or connected data structures
10. While you shouldn't assume specific data exists, you can be optimistic about the potential usefulness of related data structures
11. A dataset is relevant if its structure could reasonably support or contribute to answering the query, either directly or indirectly
"#;

pub fn router() -> Router {
    Router::new().route("/", post(handle_search_data_catalog))
}

async fn handle_search_data_catalog(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<SearchDataCatalogRequest>,
) -> ApiResponse<SearchDataCatalogResponse> {
    // Basic validation
    if request.queries.is_empty() {
        return ApiResponse::JsonData(SearchDataCatalogResponse { results: vec![] });
    }

    // Get the user's organization ID (using the first organization)
    let org_id = match user.organizations.get(0) {
        Some(org) => org.id,
        None => {
            error!("User has no organizations");
            return ApiResponse::JsonData(SearchDataCatalogResponse { results: vec![] });
        }
    };

    // Retrieve datasets for the organization
    let datasets = match get_datasets_for_organization(org_id).await {
        Ok(datasets) => datasets,
        Err(e) => {
            error!("Failed to retrieve datasets: {}", e);
            return ApiResponse::JsonData(SearchDataCatalogResponse { results: vec![] });
        }
    };

    if datasets.is_empty() {
        return ApiResponse::JsonData(SearchDataCatalogResponse { results: vec![] });
    }

    // Extract YML content for reranking
    let documents: Vec<String> = datasets
        .iter()
        .filter_map(|dataset| dataset.yml_content.clone())
        .collect();

    if documents.is_empty() {
        warn!("No datasets with YML content found");
        return ApiResponse::JsonData(SearchDataCatalogResponse { results: vec![] });
    }

    // Store user_request for passing to process_query
    let user_request = request.user_request.clone();

    // Process all queries concurrently using Cohere reranking
    let ranked_datasets_futures = stream::iter(request.queries)
        .map(|query| {
            process_query(
                query,
                datasets.clone(),
                documents.clone(),
                &user,
                user_request.clone(),
            )
        })
        .buffer_unordered(5) // Process up to 5 queries concurrently
        .collect::<Vec<_>>()
        .await;

    // Combine and deduplicate results
    let mut unique_datasets = HashSet::new();
    let results = ranked_datasets_futures
        .into_iter()
        .flat_map(|result| match result {
            Ok(datasets) => datasets,
            Err(e) => {
                error!("Failed to process query: {}", e);
                vec![]
            }
        })
        .filter(|result| unique_datasets.insert(result.clone()))
        .collect();

    ApiResponse::JsonData(SearchDataCatalogResponse { results })
}

async fn get_datasets_for_organization(org_id: Uuid) -> Result<Vec<Dataset>, anyhow::Error> {
    use database::schema::datasets::dsl::*;

    let mut conn = get_pg_pool().get().await?;

    let results = datasets
        .filter(organization_id.eq(org_id))
        .filter(deleted_at.is_null())
        .filter(yml_file.is_not_null())
        .select((id, name, yml_file))
        .load::<Dataset>(&mut conn)
        .await?;

    Ok(results)
}

async fn process_query(
    query: String,
    all_datasets: Vec<Dataset>,
    documents: Vec<String>,
    user: &AuthenticatedUser,
    user_request: Option<String>,
) -> Result<Vec<DatasetResult>, anyhow::Error> {
    // Step 1: Rerank datasets using Cohere
    let ranked_datasets = rerank_datasets(&query, &all_datasets, &documents).await?;

    if ranked_datasets.is_empty() {
        info!(
            "No datasets were relevant after reranking for query: '{}'",
            query
        );
        return Ok(vec![]);
    }

    // Step 2: Filter with LLM for true relevance
    let filtered_datasets =
        filter_datasets_with_llm(&query, ranked_datasets, user, user_request).await?;

    Ok(filtered_datasets)
}

async fn rerank_datasets(
    query: &str,
    all_datasets: &[Dataset],
    documents: &[String],
) -> Result<Vec<RankedDataset>, anyhow::Error> {
    // Initialize Cohere client
    let co = Cohere::default();

    // Create rerank request
    let request = ReRankRequest {
        query,
        documents,
        model: ReRankModel::EnglishV3,
        top_n: Some(30),
        ..Default::default()
    };

    // Get reranked results
    let rerank_results = co.rerank(&request).await?;

    // Map results back to datasets
    let mut ranked_datasets = Vec::new();
    for result in rerank_results {
        if let Some(dataset) = all_datasets.get(result.index as usize) {
            ranked_datasets.push(RankedDataset {
                dataset: dataset.clone(),
                relevance_score: result.relevance_score,
            });
        } else {
            error!("Invalid dataset index from Cohere: {}", result.index);
        }
    }

    // Sort by relevance score (highest first)
    ranked_datasets.sort_by(|a, b| {
        b.relevance_score
            .partial_cmp(&a.relevance_score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    // Only keep results with meaningful relevance scores
    // This threshold is arbitrary and may need tuning
    let relevant_datasets = ranked_datasets.into_iter().collect::<Vec<_>>();

    Ok(relevant_datasets)
}

async fn filter_datasets_with_llm(
    query: &str,
    ranked_datasets: Vec<RankedDataset>,
    user: &AuthenticatedUser,
    user_request: Option<String>,
) -> Result<Vec<DatasetResult>, anyhow::Error> {
    debug!(
        "Filtering {} datasets with LLM for query: {}",
        ranked_datasets.len(),
        query
    );

    // Format datasets for LLM prompt
    let datasets_json = ranked_datasets
        .iter()
        .map(|ranked| {
            serde_json::json!({
                "id": ranked.dataset.id.to_string(),
                "name": ranked.dataset.name,
                "yml_content": ranked.dataset.yml_content.clone().unwrap_or_default(),
                "relevance_score": ranked.relevance_score
            })
        })
        .collect::<Vec<_>>();

    // Format the prompt
    let user_request_text = user_request.unwrap_or_else(|| query.to_string());
    let prompt = LLM_FILTER_PROMPT
        .replace("{user_request}", &user_request_text)
        .replace("{query}", query)
        .replace(
            "{datasets_json}",
            &serde_json::to_string_pretty(&datasets_json)?,
        );

    // Initialize LiteLLM client
    let llm_client = LiteLLMClient::new(None, None);

    let model =
        if get_secret_sync_or_default("ENVIRONMENT", "development") == "local" {
            "gpt-4.1-nano".to_string()
        } else {
            "gemini-2.0-flash-001".to_string()
        };

    // Create the request
    let request = ChatCompletionRequest {
        model, // Using a small model for cost efficiency
        messages: vec![AgentMessage::User {
            id: None,
            content: prompt,
            name: None,
        }],
        stream: Some(false),
        response_format: Some(ResponseFormat {
            type_: "json_object".to_string(),
            json_schema: None,
        }),
        store: Some(true),
        metadata: Some(Metadata {
            generation_name: "filter_data_catalog".to_string(),
            user_id: user.id.to_string(),
            session_id: Uuid::new_v4().to_string(),
            trace_id: Uuid::new_v4().to_string(),
        }),
        // reasoning_effort: Some(String::from("low")),
        max_completion_tokens: Some(8096),
        temperature: Some(0.0),
        ..Default::default()
    };

    // Get response from LLM
    let response = llm_client.chat_completion(request).await?;

    // Parse LLM response
    let content = match &response.choices[0].message {
        AgentMessage::Assistant {
            content: Some(content),
            ..
        } => content,
        _ => {
            error!("LLM response missing content");
            return Err(anyhow::anyhow!("LLM response missing content"));
        }
    };

    // Parse into typed response
    let filter_response: LLMFilterResponse = match serde_json::from_str(content) {
        Ok(response) => response,
        Err(e) => {
            error!("Failed to parse LLM response: {}", e);
            return Err(anyhow::anyhow!("Failed to parse LLM response: {}", e));
        }
    };

    // Create a map for quick lookups of dataset IDs
    let dataset_map: HashMap<Uuid, &Dataset> = ranked_datasets
        .iter()
        .map(|ranked| (ranked.dataset.id, &ranked.dataset))
        .collect();

    // Convert filtered relevant datasets to DatasetResult
    let filtered_datasets: Vec<DatasetResult> = filter_response
        .results
        .into_iter()
        .filter_map(|result| {
            // Parse the UUID
            match Uuid::parse_str(&result.id) {
                Ok(id) => {
                    // Get the dataset
                    dataset_map.get(&id).map(|dataset| DatasetResult {
                        id: dataset.id,
                        name: Some(dataset.name.clone()),
                        yml_content: dataset.yml_content.clone(),
                    })
                }
                Err(_) => None,
            }
        })
        .collect();

    debug!(
        "LLM filtering complete, keeping {} relevant datasets",
        filtered_datasets.len()
    );
    Ok(filtered_datasets)
}
