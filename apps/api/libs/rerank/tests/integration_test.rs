use rerank::{Reranker, RerankResult};
use std::error::Error;

#[tokio::test]
async fn test_reranker_integration() -> Result<(), Box<dyn Error>> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();

    // Initialize the reranker
    let reranker = Reranker::new()?;

    // Define a sample query and documents
    let query = "What is the capital of France?";
    let documents = vec![
        "Paris is a major European city and a global center for art, fashion, gastronomy and culture.",
        "London is the capital and largest city of England and the United Kingdom.",
        "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France.",
        "Berlin is the capital and largest city of Germany by both area and population.",
    ];
    let top_n = 2;

    // Perform reranking
    let results: Vec<RerankResult> = reranker.rerank(query, &documents, top_n).await?;

    // Assertions
    assert_eq!(results.len(), top_n, "Should return top_n results");

    // Check that indices are within the bounds of the original documents
    for result in &results {
        assert!(result.index < documents.len(), "Result index should be valid");
    }

    // Optional: Print results for manual verification (can be removed later)
    println!("Query: {}", query);
    for result in &results {
        println!(
            "Document Index: {}, Score: {:.4}, Document: {}",
            result.index,
            result.relevance_score,
            documents[result.index]
        );
    }
    
    // Example assertion: if we expect Paris-related documents to be ranked higher.
    // This is a very basic check and might need adjustment based on actual model behavior.
    if !results.is_empty() {
        let first_result_doc = documents[results[0].index];
        assert!(
            first_result_doc.to_lowercase().contains("paris"),
            "The top result for 'capital of France' should ideally mention Paris. Model output: {}",
            first_result_doc
        );
    }

    Ok(())
} 