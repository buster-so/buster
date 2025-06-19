use anyhow::Result;
use crate::{
    types::{SemanticLayer, ValidationMode},
    errors::SqlAnalyzerError,
    utils::semantic,
};

/// Validates a SQL query against semantic layer rules.
///
/// (Original documentation and examples included here)
/// # Examples
/// ```no_run
/// use sql_analyzer::{validate_semantic_query, SemanticLayer, ValidationMode};
/// 
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "SELECT u.id, metric_UserSpending FROM users u JOIN orders o ON u.id = o.user_id";
///     let semantic_layer = SemanticLayer::new();
///     // Add tables, metrics, filters, and relationships to semantic_layer...
///     
///     let result = validate_semantic_query(sql.to_string(), semantic_layer, ValidationMode::Strict).await;
///     match result {
///         Ok(_) => println!("Query is valid according to semantic layer rules"),
///         Err(e) => println!("Validation failed: {}", e),
///     }
///     Ok(())
/// }
/// ```
pub async fn validate_semantic_query(
    sql: String,
    semantic_layer: SemanticLayer,
    mode: ValidationMode,
) -> Result<(), SqlAnalyzerError> {
    tokio::task::spawn_blocking(move || {
        semantic::validate_query(&sql, &semantic_layer, mode)
    })
    .await
    .map_err(|e| SqlAnalyzerError::Internal(anyhow::anyhow!("Task join error: {}", e)))??;

    Ok(())
}

/// Substitutes metrics and filters in a SQL query with their expressions.
///
/// (Original documentation and examples included here)
/// # Examples
/// ```no_run
/// use sql_analyzer::{substitute_semantic_query, SemanticLayer};
/// 
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "SELECT u.id, metric_UserSpending FROM users u JOIN orders o ON u.id = o.user_id";
///     let semantic_layer = SemanticLayer::new();
///     // Add tables, metrics, filters, and relationships to semantic_layer...
///     
///     let substituted_sql = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
///     println!("Substituted SQL: {}", substituted_sql);
///     Ok(())
/// }
/// ```
pub async fn substitute_semantic_query(
    sql: String,
    semantic_layer: SemanticLayer,
) -> Result<String, SqlAnalyzerError> {
    // Use the actual implementation in utils::semantic for all cases
    let substituted = tokio::task::spawn_blocking(move || {
        semantic::substitute_query(&sql, &semantic_layer)
    })
    .await
    .map_err(|e| SqlAnalyzerError::Internal(anyhow::anyhow!("Task join error: {}", e)))??;

    Ok(substituted)
}

/// Validates and substitutes a SQL query using semantic layer rules.
///
/// (Original documentation and examples included here)
/// # Examples
/// ```no_run
/// use sql_analyzer::{validate_and_substitute_semantic_query, SemanticLayer, ValidationMode};
/// 
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "SELECT u.id, metric_UserSpending FROM users u JOIN orders o ON u.id = o.user_id";
///     let semantic_layer = SemanticLayer::new();
///     // Add tables, metrics, filters, and relationships to semantic_layer...
///     
///     let result = validate_and_substitute_semantic_query(
///         sql.to_string(), 
///         semantic_layer, 
///         ValidationMode::Flexible
///     ).await;
///     
///     match result {
///         Ok(query) => println!("Substituted SQL: {}", query),
///         Err(e) => println!("Validation or substitution failed: {}", e),
///     }
///     Ok(())
/// }
/// ```
pub async fn validate_and_substitute_semantic_query(
    sql: String,
    semantic_layer: SemanticLayer,
    mode: ValidationMode,
) -> Result<String, SqlAnalyzerError> {
    // First validate the query 
    validate_semantic_query(sql.clone(), semantic_layer.clone(), mode).await?;

    // Then substitute metrics and filters
    // Special cases for errors are handled in substitute_semantic_query
    let result = substitute_semantic_query(sql, semantic_layer).await?;
    
    Ok(result)
} 