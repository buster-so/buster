use anyhow::Result;
use std::collections::HashMap;
use crate::{
    errors::SqlAnalyzerError,
    utils::semantic, // Assuming the rewrite logic is also in utils::semantic based on original lib.rs
};

/// Applies row-level filters to a SQL query by replacing table references with filtered CTEs.
///
/// (Original documentation and examples included here)
/// # Examples
/// ```no_run
/// use sql_analyzer::apply_row_level_filters;
/// use std::collections::HashMap;
///
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "SELECT u.id, o.amount FROM users u JOIN orders o ON u.id = o.user_id";
///     let mut filters = HashMap::new();
///     filters.insert("users".to_string(), "tenant_id = 123".to_string());
///     filters.insert("orders".to_string(), "created_at > '2023-01-01'".to_string());
///
///     let filtered_sql = apply_row_level_filters(sql.to_string(), filters).await?;
///     println!("Filtered SQL: {}", filtered_sql);
///     Ok(())
/// }
/// ```
pub async fn apply_row_level_filters(
    sql: String,
    table_filters: HashMap<String, String>,
) -> Result<String, SqlAnalyzerError> {
    let result = tokio::task::spawn_blocking(move || {
        // Assuming the actual implementation function is called apply_row_level_filters 
        // within the utils::semantic module, based on the original lib.rs structure.
        // If it's named differently or located elsewhere (e.g., utils::rewriting), adjust this call.
        semantic::apply_row_level_filters(&sql, table_filters)
    })
    .await
    .map_err(|e| SqlAnalyzerError::Internal(anyhow::anyhow!("Task join error: {}", e)))??;

    Ok(result)
} 