use sqlparser::dialect::GenericDialect;
use sqlparser::parser::Parser;
use sqlparser::ast::{Statement, SetExpr, Query};

/// Checks if a SQL query is safe to execute by parsing it and ensuring it only contains
/// SELECT statements.
///
/// Returns None if the query is safe, or Some(error_message) if it's not allowed.
pub async fn query_safety_filter(sql: String) -> Option<String> {
    // Parse the SQL query
    let dialect = GenericDialect {}; // Generic SQL dialect
    let ast = match Parser::parse_sql(&dialect, &sql) {
        Ok(ast) => ast,
        Err(e) => {
            return Some(format!("Failed to parse SQL query: {}", e));
        }
    };

    // Check each statement in the query
    for stmt in ast {
        match stmt {
            // Only allow SELECT statements
            Statement::Query(query) => {
                // Check if the query body is a SELECT statement
                if !is_safe_query(&query) {
                    return Some("Only simple SELECT queries are allowed.".to_string());
                }
            },
            // Block all other statement types
            Statement::Insert { .. } => {
                return Some("INSERT statements are not allowed.".to_string());
            },
            Statement::Update { .. } => {
                return Some("UPDATE statements are not allowed.".to_string());
            },
            Statement::Delete { .. } => {
                return Some("DELETE statements are not allowed.".to_string());
            },
            Statement::CreateTable { .. } => {
                return Some("CREATE TABLE statements are not allowed.".to_string());
            },
            Statement::AlterTable { .. } => {
                return Some("ALTER TABLE statements are not allowed.".to_string());
            },
            Statement::Drop { .. } => {
                return Some("DROP statements are not allowed.".to_string());
            },
            Statement::CreateView { .. } => {
                return Some("CREATE VIEW statements are not allowed in read queries.".to_string());
            },
            Statement::CreateIndex { .. } => {
                return Some("CREATE INDEX statements are not allowed.".to_string());
            },
            Statement::Grant { .. } => {
                return Some("GRANT statements are not allowed.".to_string());
            },
            Statement::Revoke { .. } => {
                return Some("REVOKE statements are not allowed.".to_string());
            },
            _ => {
                return Some("Only SELECT statements are allowed.".to_string());
            }
        }
    }

    // If we get here, all statements are safe
    None
}

/// Checks if a query is safe (only contains SELECT statements)
fn is_safe_query(query: &Query) -> bool {
    match &*query.body {
        SetExpr::Select(_) => true,
        SetExpr::Query(subquery) => is_safe_query(subquery),
        SetExpr::SetOperation { left, right, .. } => {
            is_safe_query_expr(left) && is_safe_query_expr(right)
        },
        _ => false,
    }
}

/// Helper function to check if a SetExpr is safe
fn is_safe_query_expr(expr: &SetExpr) -> bool {
    match expr {
        SetExpr::Select(_) => true,
        SetExpr::Query(subquery) => is_safe_query(subquery),
        SetExpr::SetOperation { left, right, .. } => {
            is_safe_query_expr(left) && is_safe_query_expr(right)
        },
        _ => false,
    }
}

/// Checks if a SQL query is safe for write operations, allowing only view-related operations.
///
/// Returns None if the query is safe, or Some(error_message) if it's not allowed.
#[allow(dead_code)]
pub async fn write_query_safety_filter(sql: String) -> Option<String> {
    // Parse the SQL query
    let dialect = GenericDialect {}; // Generic SQL dialect
    let ast = match Parser::parse_sql(&dialect, &sql) {
        Ok(ast) => ast,
        Err(e) => {
            return Some(format!("Failed to parse SQL query: {}", e));
        }
    };

    // Check each statement in the query
    for stmt in ast {
        match stmt {
            // Allow only view-related operations
            Statement::CreateView { .. } => {
                // CreateView is allowed
            },
            Statement::Drop { object_type, if_exists, .. } => {
                // Only allow DROP VIEW IF EXISTS
                match object_type {
                    sqlparser::ast::ObjectType::View => {
                        if !if_exists {
                            return Some("Only 'DROP VIEW IF EXISTS' is allowed.".to_string());
                        }
                    },
                    _ => {
                        return Some("Only 'DROP VIEW IF EXISTS' is allowed.".to_string());
                    }
                }
            },
            // Block all other statement types
            Statement::Query(_) => {
                return Some("SELECT statements should use the query endpoint, not the write endpoint.".to_string());
            },
            Statement::Insert { .. } => {
                return Some("INSERT statements are not allowed.".to_string());
            },
            Statement::Update { .. } => {
                return Some("UPDATE statements are not allowed.".to_string());
            },
            Statement::Delete { .. } => {
                return Some("DELETE statements are not allowed.".to_string());
            },
            Statement::CreateTable { .. } => {
                return Some("CREATE TABLE statements are not allowed.".to_string());
            },
            Statement::AlterTable { .. } => {
                return Some("ALTER TABLE statements are not allowed.".to_string());
            },
            Statement::CreateIndex { .. } => {
                return Some("CREATE INDEX statements are not allowed.".to_string());
            },
            Statement::Grant { .. } => {
                return Some("GRANT statements are not allowed.".to_string());
            },
            Statement::Revoke { .. } => {
                return Some("REVOKE statements are not allowed.".to_string());
            },
            _ => {
                return Some("Only view-related operations are allowed.".to_string());
            }
        }
    }

    // If we get here, all statements are safe
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_safe_select_query() {
        let query = "SELECT segment_recent_update AS segment, COUNT(first_name) AS customer_count 
                    FROM sem.entity_person 
                    GROUP BY segment_recent_update 
                    ORDER BY customer_count DESC";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_none(), "Safe SELECT query was rejected: {:?}", result);
    }

    #[tokio::test]
    async fn test_unsafe_update_query() {
        let query = "UPDATE users SET name = 'John' WHERE id = 1";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_some(), "Unsafe UPDATE query was allowed");
    }

    #[tokio::test]
    async fn test_unsafe_delete_query() {
        let query = "DELETE FROM users WHERE id = 1";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_some(), "Unsafe DELETE query was allowed");
    }

    #[tokio::test]
    async fn test_complex_select_query() {
        let query = "SELECT u.name, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count 
                    FROM users u 
                    WHERE u.created_at > '2023-01-01'";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_none(), "Safe complex SELECT query was rejected: {:?}", result);
    }

    #[tokio::test]
    async fn test_union_query() {
        let query = "SELECT name FROM users UNION SELECT name FROM customers";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_none(), "Safe UNION query was rejected: {:?}", result);
    }
}
