use sql_analyzer::apply_row_level_filters;
use std::collections::HashMap;
use tokio;

#[tokio::test]
async fn test_row_level_filtering() {
    // Simple query with tables that need filtering
    let sql = "SELECT u.id, o.amount FROM users u JOIN orders o ON u.id = o.user_id";

    // Create filters for the tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Row level filtering should succeed");

    let filtered_sql = result.unwrap();

    // Check that CTEs were created
    assert!(
        filtered_sql.starts_with("WITH "),
        "Should start with a WITH clause"
    );
    assert!(
        filtered_sql.contains("filtered_u AS (SELECT * FROM users WHERE tenant_id = 123)"),
        "Should create a CTE for filtered users"
    );
    assert!(
        filtered_sql
            .contains("filtered_o AS (SELECT * FROM orders WHERE created_at > '2023-01-01')"),
        "Should create a CTE for filtered orders"
    );

    // Check that table references were replaced
    assert!(
        filtered_sql.contains("filtered_u") && filtered_sql.contains("filtered_o"),
        "Should replace table references with filtered CTEs"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_schema_qualified_tables() {
    // Query with schema-qualified tables
    let sql = "SELECT u.id, o.amount FROM schema.users u JOIN schema.orders o ON u.id = o.user_id";

    // Create filters for the tables (note we use the table name without schema)
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(
        result.is_ok(),
        "Row level filtering should succeed with schema-qualified tables"
    );

    let filtered_sql = result.unwrap();

    // Check that CTEs were created with fully qualified table names
    assert!(
        filtered_sql.contains("filtered_u AS (SELECT * FROM schema.users WHERE tenant_id = 123)"),
        "Should create a CTE for filtered users with schema"
    );
    assert!(
        filtered_sql.contains(
            "filtered_o AS (SELECT * FROM schema.orders WHERE created_at > '2023-01-01')"
        ),
        "Should create a CTE for filtered orders with schema"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_where_clause() {
    // Query with an existing WHERE clause
    let sql = "SELECT u.id, o.amount FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed'";

    // Create filters for the tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(
        result.is_ok(),
        "Row level filtering should work with existing WHERE clauses"
    );

    let filtered_sql = result.unwrap();

    // Check that the CTEs were created and the original WHERE clause is preserved
    assert!(
        filtered_sql.contains("filtered_u AS (SELECT * FROM users WHERE tenant_id = 123)"),
        "Should create a CTE for filtered users"
    );
    assert!(
        filtered_sql.contains("WHERE o.status = 'completed'"),
        "Should preserve the original WHERE clause"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_no_matching_tables() {
    // Query with tables that don't match our filters
    let sql = "SELECT p.id, p.name FROM products p";

    // Create filters for different tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(
        result.is_ok(),
        "Should succeed when no tables match filters"
    );

    let filtered_sql = result.unwrap();

    // The SQL format might be slightly different due to the SQL parser's formatting
    // We just need to verify no CTEs were added
    // Note: sqlparser might add a WITH clause even if no tables match, depending on version/config.
    // A more robust check might be to see if the original table name is still present.
    if filtered_sql.contains("WITH ") {
        assert!(!filtered_sql.contains("filtered_"), "Should not introduce filtered CTEs if no tables match");
    } else {
        assert!(!filtered_sql.contains("filtered_")); // Double check no filtered CTEs
    }
    assert!(
        filtered_sql.contains("FROM products p"), // Check original table reference
        "Should keep the original table reference"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_empty_filters() {
    // Simple query
    let sql = "SELECT u.id, o.amount FROM users u JOIN orders o ON u.id = o.user_id";

    // Empty filters map
    let table_filters = HashMap::new();

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Should succeed with empty filters");

    let filtered_sql = result.unwrap();

    // The SQL should be unchanged (or semantically equivalent after parsing/formatting)
    // Comparing strings directly might fail due to formatting differences.
    // A basic check is to see if it still contains the original tables.
    assert!(
        filtered_sql.contains("FROM users u") && filtered_sql.contains("JOIN orders o"),
        "SQL should effectively be unchanged when no filters are provided"
    );
    assert!(!filtered_sql.contains("filtered_"), "No filtered CTEs should be added");
}

#[tokio::test]
async fn test_row_level_filtering_with_mixed_tables() {
    // Query with multiple tables, only some of which need filtering
    let sql = "SELECT u.id, p.name, o.amount FROM users u JOIN products p ON u.preferred_product = p.id JOIN orders o ON u.id = o.user_id";

    // Create filters for a subset of tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    // No filter for products
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(
        result.is_ok(),
        "Should succeed with mixed filtered/unfiltered tables"
    );

    let filtered_sql = result.unwrap();

    // Check that only tables with filters were replaced
    assert!(
        filtered_sql.contains("filtered_u AS (SELECT * FROM users WHERE tenant_id = 123)"),
        "Should create a CTE for filtered users"
    );
    assert!(
        filtered_sql
            .contains("filtered_o AS (SELECT * FROM orders WHERE created_at > '2023-01-01')"),
        "Should create a CTE for filtered orders"
    );
    assert!(
        filtered_sql.contains("JOIN products p"), // Check the original unfiltered table
        "Should keep original reference for unfiltered tables"
    );
    assert!(
        filtered_sql.contains("FROM filtered_u")
            && filtered_sql.contains("JOIN products p")
            && filtered_sql.contains("JOIN filtered_o"),
        "Should mix filtered and unfiltered tables correctly"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_complex_query() {
    // Complex query with subqueries, CTEs, and multiple references to tables
    let sql = "
        WITH order_summary AS (
            SELECT 
                o.user_id,
                COUNT(*) as order_count,
                SUM(o.amount) as total_amount
            FROM 
                orders o
            GROUP BY 
                o.user_id
        )
        SELECT 
            u.id,
            u.name,
            os.order_count,
            os.total_amount,
            (SELECT MAX(o2.amount) FROM orders o2 WHERE o2.user_id = u.id) as max_order
        FROM 
            users u
        JOIN 
            order_summary os ON u.id = os.user_id
        WHERE 
            u.status = 'active'
            AND EXISTS (SELECT 1 FROM products p JOIN order_items oi ON p.id = oi.product_id 
                       JOIN orders o3 ON oi.order_id = o3.id WHERE o3.user_id = u.id)
    ";

    // Create filters for the tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );
    // Add a filter for products to ensure it's handled in EXISTS
    table_filters.insert("products".to_string(), "is_active = true".to_string());

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(
        result.is_ok(),
        "Should succeed with complex query structure"
    );

    let filtered_sql = result.unwrap();
    println!("Complex Query Filtered SQL: {}\n", filtered_sql);

    // Verify all instances of filtered tables were replaced
    assert!(
        filtered_sql.contains("filtered_u AS (SELECT * FROM users WHERE tenant_id = 123)"),
        "Should create CTE for filtered users"
    );
    assert!(
        filtered_sql.contains("filtered_o AS (SELECT * FROM orders WHERE created_at > '2023-01-01')"),
        "Should create CTE for filtered orders"
    );
     assert!(
        filtered_sql.contains("filtered_p AS (SELECT * FROM products WHERE is_active = true)"),
        "Should create CTE for filtered products"
    );


    // Verify replacements in different contexts
    assert!(
        filtered_sql.contains("FROM filtered_o o"),
        "Should replace orders in order_summary CTE definition"
    );
    assert!(
        filtered_sql.contains("FROM filtered_o o2"),
        "Should replace orders in MAX subquery (check alias)"
    );
    assert!(
        filtered_sql.contains("FROM filtered_p p"),
        "Should replace products in EXISTS subquery (check alias)"
    );
    assert!(
        filtered_sql.contains("JOIN filtered_o o3"),
        "Should replace orders in EXISTS subquery (check alias)"
    );
    assert!(
        filtered_sql.contains("FROM filtered_u u"),
        "Should replace main users table (check alias)"
    );

    // The original CTE definition should also be preserved (though modified)
    assert!(
        filtered_sql.contains("WITH order_summary AS ("),
        "Should preserve original CTE structure"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_union_query() {
    // Union query
    let sql = "
        SELECT u1.id, o1.amount 
        FROM users u1 
        JOIN orders o1 ON u1.id = o1.user_id 
        WHERE o1.status = 'completed'
        
        UNION ALL
        
        SELECT u2.id, o2.amount 
        FROM users u2 
        JOIN orders o2 ON u2.id = o2.user_id 
        WHERE o2.status = 'pending'
    ";

    // Create filters for the tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Should succeed with UNION queries");

    let filtered_sql = result.unwrap();

    // Verify filters are applied correctly to both sides of UNION
    assert!(
        filtered_sql.contains("filtered_u1"),
        "Should filter users in first query part"
    );
    assert!(
        filtered_sql.contains("filtered_o1"),
        "Should filter orders in first query part"
    );
    assert!(
        filtered_sql.contains("filtered_u2"),
        "Should filter users in second query part"
    );
    assert!(
        filtered_sql.contains("filtered_o2"),
        "Should filter orders in second query part"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_ambiguous_references() {
    // Query with multiple references to the same table using aliases
    let sql = "
        SELECT 
            a.id, 
            a.name,
            b.id as other_id,
            b.name as other_name
        FROM 
            users a
        JOIN 
            users b ON a.manager_id = b.id
    ";

    // Create filter for users table
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Should succeed with aliased self-join");

    let filtered_sql = result.unwrap();

    // Verify that both instances of the users table are filtered correctly via CTEs
     assert!(
        filtered_sql.contains("filtered_a AS (SELECT * FROM users WHERE tenant_id = 123)"),
        "Should create CTE for alias 'a'"
    );
     assert!(
        filtered_sql.contains("filtered_b AS (SELECT * FROM users WHERE tenant_id = 123)"),
        "Should create CTE for alias 'b'"
    );
    assert!(
        filtered_sql.contains("FROM filtered_a a"),
        "Should reference filtered CTE for alias 'a'"
    );
    assert!(
        filtered_sql.contains("JOIN filtered_b b"),
        "Should reference filtered CTE for alias 'b'"
    );
}


#[tokio::test]
async fn test_row_level_filtering_with_existing_ctes() {
    // Query with existing CTEs
    let sql = "
        WITH order_summary AS (
            SELECT 
                user_id,
                COUNT(*) as order_count,
                SUM(amount) as total_amount
            FROM 
                orders
            GROUP BY 
                user_id
        )
        SELECT 
            u.id,
            u.name,
            os.order_count,
            os.total_amount
        FROM 
            users u
        JOIN 
            order_summary os ON u.id = os.user_id
    ";

    // Create filter for users table only
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    // Add a filter for orders as well to test CTE modification
    table_filters.insert("orders".to_string(), "status = 'paid'".to_string());


    // Test row level filtering with existing CTEs
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Should succeed with existing CTEs");

    let filtered_sql = result.unwrap();
    println!("Existing CTE Filtered SQL: {}\n", filtered_sql);

    // Verify the new CTEs are added before the original CTE
    assert!(
        filtered_sql.contains("filtered_u AS (SELECT * FROM users WHERE tenant_id = 123)"),
        "Should add filtered CTE for users"
    );
    assert!(
        filtered_sql.contains("filtered_o AS (SELECT * FROM orders WHERE status = 'paid')"),
        "Should add filtered CTE for orders"
    );
    assert!(
        filtered_sql.contains(", order_summary AS ("), // Comma indicates it follows other CTEs
        "Original CTE should follow filtered CTEs"
    );

    // Verify the original CTE is modified to use the filtered table
    assert!(
        filtered_sql.contains("FROM filtered_o"),
        "Original CTE should now use filtered orders table"
    );

    // Verify the main query uses the filtered user table
    assert!(
        filtered_sql.contains("FROM filtered_u u"),
        "Main query should use filtered users table"
    );
    assert!(
        filtered_sql.contains("JOIN order_summary os"),
        "Main query should still join with the original (but modified) CTE"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_subqueries() {
    // Query with subqueries
    let sql = "
        SELECT 
            u.id,
            u.name,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as order_count
        FROM 
            users u
        WHERE 
            u.status = 'active'
            AND EXISTS (
                SELECT 1 FROM orders o2 
                WHERE o2.user_id = u.id AND o2.status = 'completed'
            )
    ";

    // Create filters for both tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );

    // Test row level filtering with subqueries
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Should succeed with subqueries");

    let filtered_sql = result.unwrap();
    println!("Subquery Filtered SQL: {}\n", filtered_sql);

    // Check CTEs are created
    assert!(filtered_sql.contains("filtered_u AS"));
    assert!(filtered_sql.contains("filtered_o AS"));

    // Check that the main table is filtered
    assert!(
        filtered_sql.contains("FROM filtered_u u"),
        "Should filter the main users table"
    );

    // Check that subqueries are filtered
    assert!(
        filtered_sql.contains("FROM filtered_o o WHERE"),
        "Should filter orders in the scalar subquery"
    );
    assert!(
        filtered_sql.contains("FROM filtered_o o2 WHERE"),
        "Should filter orders in the EXISTS subquery"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_schema_qualified_tables_and_mixed_references() {
    // Query with schema-qualified tables and mixed references
    let sql = "
        SELECT 
            u.id,
            u.name,
            o.order_id,
            p.name as product_name -- Changed from schema2.products.name
        FROM 
            schema1.users u
        JOIN 
            schema1.orders o ON u.id = o.user_id
        JOIN 
            schema2.products p ON o.product_id = p.id -- Used alias p here
    ";

    // Create filters for the tables (using just the base table names)
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert("orders".to_string(), "status = 'active'".to_string());
    table_filters.insert("products".to_string(), "company_id = 456".to_string());

    // Test row level filtering with schema-qualified tables
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(
        result.is_ok(),
        "Should succeed with schema-qualified tables"
    );

    let filtered_sql = result.unwrap();
    println!("Schema Qualified Filtered SQL: {}\n", filtered_sql);


    // Check that all tables are filtered correctly with schema preserved in CTE definition
    assert!(
        filtered_sql.contains("filtered_u AS (SELECT * FROM schema1.users WHERE tenant_id = 123)"),
        "Should include schema in the filtered users CTE"
    );
    assert!(
        filtered_sql.contains("filtered_o AS (SELECT * FROM schema1.orders WHERE status = 'active')"),
        "Should include schema in the filtered orders CTE"
    );
    assert!(
        filtered_sql.contains("filtered_p AS (SELECT * FROM schema2.products WHERE company_id = 456)"),
        "Should include schema in the filtered products CTE"
    );

    // Check that references are updated correctly using the aliases
    assert!(
        filtered_sql.contains("FROM filtered_u u"),
        "Should update users reference using alias u"
    );
    assert!(
        filtered_sql.contains("JOIN filtered_o o"),
        "Should update orders reference using alias o"
    );
    assert!(
        filtered_sql.contains("JOIN filtered_p p"),
        "Should update products reference using alias p"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_nested_subqueries() {
    // Query with nested subqueries
    let sql = "
        SELECT 
            u.id,
            u.name,
            (
                SELECT COUNT(*) 
                FROM orders o 
                WHERE o.user_id = u.id AND o.status IN (
                    SELECT status_code -- Changed from status
                    FROM order_statuses os -- Added alias os
                    WHERE os.is_complete = true -- Used alias os
                )
            ) as completed_orders
        FROM 
            users u
    ";

    // Create filters for tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );
    table_filters.insert("order_statuses".to_string(), "company_id = 456".to_string());

    // Test row level filtering with nested subqueries
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Should succeed with nested subqueries");

    let filtered_sql = result.unwrap();
    println!("Nested Subquery Filtered SQL: {}\n", filtered_sql);


    // Check all tables are filtered using their aliases
    assert!(
        filtered_sql.contains("FROM filtered_u u"),
        "Should filter main users table"
    );
    assert!(
        filtered_sql.contains("FROM filtered_o o"),
        "Should filter orders in subquery"
    );
    assert!(
        filtered_sql.contains("FROM filtered_os os"),
        "Should filter order_statuses in nested subquery"
    );
}

#[tokio::test]
async fn test_row_level_filtering_preserves_comments() {
    // Query with comments
    let sql = "
        -- Main query to get user data
        SELECT 
            u.id, -- User ID
            u.name, -- User name
            o.amount /* Order amount */
        FROM 
            users u -- Users table
        JOIN 
            orders o ON u.id = o.user_id -- Join with orders
        WHERE 
            u.status = 'active' -- Only active users
    ";

    // Create filters for tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );

    // Test row level filtering with comments
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Should succeed with comments");

    let filtered_sql = result.unwrap();
    println!("Comments Filtered SQL: {}\n", filtered_sql);


    // Check filters are applied
    assert!(
        filtered_sql.contains("filtered_u AS"),
        "Should add filtered users CTE"
    );
    assert!(
        filtered_sql.contains("filtered_o AS"),
        "Should add filtered orders CTE"
    );
    assert!(
        filtered_sql.contains("tenant_id = 123"),
        "Should apply users filter"
    );
    assert!(
        filtered_sql.contains("created_at > '2023-01-01'"),
        "Should apply orders filter"
    );
    // Comment preservation depends heavily on the parser; basic check:
    assert!(filtered_sql.contains("--") || filtered_sql.contains("/*"), "Should attempt to preserve some comments");
}

#[tokio::test]
async fn test_row_level_filtering_with_limit_offset() {
    // Query with LIMIT and OFFSET
    let sql = "
        SELECT 
            u.id,
            u.name
        FROM 
            users u
        ORDER BY 
            u.created_at DESC
        LIMIT 10
        OFFSET 20
    ";

    // Create filter for users table
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());

    // Test row level filtering with LIMIT and OFFSET
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Should succeed with LIMIT and OFFSET");

    let filtered_sql = result.unwrap();
    println!("Limit/Offset Filtered SQL: {}\n", filtered_sql);


    // Check that filter is applied
    assert!(
        filtered_sql.contains("FROM filtered_u u"),
        "Should filter users table"
    );

    // Check that LIMIT and OFFSET are preserved
    // Note: sqlparser might move these clauses, check for their presence anywhere
    assert!(
        filtered_sql.contains("LIMIT 10"),
        "Should preserve LIMIT clause"
    );
    assert!(
        filtered_sql.contains("OFFSET 20"),
        "Should preserve OFFSET clause"
    );
}

#[tokio::test]
async fn test_row_level_filtering_with_multiple_filters_per_table() {
    // Simple query with two tables
    let sql = "SELECT u.id, o.amount FROM users u JOIN orders o ON u.id = o.user_id";

    // Define multiple filter conditions for each table
    let user_filter = "tenant_id = 123 AND status = 'active'";
    let order_filter = "created_at > '2023-01-01' AND amount > 0";

    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), user_filter.to_string());
    table_filters.insert("orders".to_string(), order_filter.to_string());

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(
        result.is_ok(),
        "Should succeed with multiple filters per table"
    );

    let filtered_sql = result.unwrap();
    println!("Multi-Filter SQL: {}\n", filtered_sql);

    // Check that the filter conditions are correctly applied within the CTEs
    assert!(
        filtered_sql.contains(&format!("SELECT * FROM users WHERE {}", user_filter)),
        "Should apply multiple conditions for users in CTE"
    );
    assert!(
        filtered_sql.contains(&format!("SELECT * FROM orders WHERE {}", order_filter)),
        "Should apply multiple conditions for orders in CTE"
    );
    assert!(filtered_sql.contains("FROM filtered_u u"));
    assert!(filtered_sql.contains("JOIN filtered_o o"));
}


#[tokio::test]
async fn test_row_level_filtering_with_complex_expressions() {
    // Query with complex expressions in join conditions, select list, and where clause
    let sql = "
        SELECT 
            u.id, 
            CASE WHEN o.amount > 100 THEN 'High Value' ELSE 'Standard' END as order_type,
            (SELECT COUNT(*) FROM orders o2 WHERE o2.user_id = u.id) as order_count
        FROM 
            users u
        LEFT JOIN 
            orders o ON u.id = o.user_id AND o.created_at BETWEEN CURRENT_DATE - INTERVAL '30' DAY AND CURRENT_DATE
        WHERE 
            u.created_at > CURRENT_DATE - INTERVAL '1' YEAR
            AND (
                u.status = 'active'
                OR EXISTS (SELECT 1 FROM orders o3 WHERE o3.user_id = u.id AND o3.amount > 1000)
            )
    ";

    // Create filters for the tables
    let mut table_filters = HashMap::new();
    table_filters.insert("users".to_string(), "tenant_id = 123".to_string());
    table_filters.insert(
        "orders".to_string(),
        "created_at > '2023-01-01'".to_string(),
    );

    // Test row level filtering
    let result = apply_row_level_filters(sql.to_string(), table_filters).await;
    assert!(result.is_ok(), "Should succeed with complex expressions");

    let filtered_sql = result.unwrap();
    println!("Complex Expr Filtered SQL: {}\n", filtered_sql);


    // Verify that all table references are filtered correctly using aliases
    assert!(
        filtered_sql.contains("FROM filtered_u u"),
        "Should filter main users reference"
    );
    assert!(
        filtered_sql.contains("LEFT JOIN filtered_o o ON"),
        "Should filter main orders reference in LEFT JOIN"
    );
    assert!(
        filtered_sql.contains("FROM filtered_o o2 WHERE"),
        "Should filter orders in subquery"
    );
    assert!(
        filtered_sql.contains("FROM filtered_o o3 WHERE"),
        "Should filter orders in EXISTS subquery"
    );
} 