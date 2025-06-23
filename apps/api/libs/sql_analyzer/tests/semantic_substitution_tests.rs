use sql_analyzer::{
    substitute_semantic_query, validate_and_substitute_semantic_query, Filter, Metric, Parameter, 
    ParameterType, SemanticLayer, SqlAnalyzerError, ValidationMode
};
use anyhow::Result;

fn create_test_semantic_layer() -> SemanticLayer {
    let mut semantic_layer = SemanticLayer::new();
    
    // Add tables
    semantic_layer.add_table("users", vec!["id", "name", "email", "created_at", "status"]);
    semantic_layer.add_table("orders", vec!["id", "user_id", "amount", "created_at", "status", "product_id"]);
    semantic_layer.add_table("products", vec!["id", "name", "price"]);
    semantic_layer.add_table("order_items", vec!["id", "order_id", "product_id", "quantity"]);
    
    // Add relationships
    semantic_layer.add_relationship(sql_analyzer::Relationship {
        from_table: "users".to_string(),
        from_column: "id".to_string(),
        to_table: "orders".to_string(),
        to_column: "user_id".to_string(),
    });
    
    semantic_layer.add_relationship(sql_analyzer::Relationship {
        from_table: "orders".to_string(),
        from_column: "id".to_string(),
        to_table: "order_items".to_string(),
        to_column: "order_id".to_string(),
    });
    
    semantic_layer.add_relationship(sql_analyzer::Relationship {
        from_table: "products".to_string(),
        from_column: "id".to_string(),
        to_table: "order_items".to_string(),
        to_column: "product_id".to_string(),
    });
    
    // Add metrics
    semantic_layer.add_metric(Metric {
        name: "metric_TotalOrders".to_string(),
        table: "orders".to_string(),
        expression: "COUNT(orders.id)".to_string(),
        parameters: vec![],
        description: Some("Total number of orders".to_string()),
    });
    
    semantic_layer.add_metric(Metric {
        name: "metric_TotalSpending".to_string(),
        table: "orders".to_string(),
        expression: "SUM(orders.amount)".to_string(),
        parameters: vec![],
        description: Some("Total spending across all orders".to_string()),
    });
    
    semantic_layer.add_metric(Metric {
        name: "metric_OrdersLastNDays".to_string(),
        table: "orders".to_string(),
        expression: "COUNT(CASE WHEN orders.created_at >= CURRENT_DATE - INTERVAL '{{n}}' DAY THEN orders.id END)".to_string(),
        parameters: vec![
            Parameter {
                name: "n".to_string(),
                param_type: ParameterType::Number,
                default: Some("30".to_string()),
            },
        ],
        description: Some("Orders in the last N days".to_string()),
    });
    
    semantic_layer.add_metric(Metric {
        name: "metric_AverageOrderValue".to_string(),
        table: "orders".to_string(),
        expression: "SUM(orders.amount) / NULLIF(COUNT(orders.id), 0)".to_string(),
        parameters: vec![],
        description: Some("Average order value".to_string()),
    });
    
    // Add recursive metric that uses another metric
    semantic_layer.add_metric(Metric {
        name: "metric_RecursiveMetric".to_string(),
        table: "orders".to_string(),
        expression: "metric_TotalOrders / 2".to_string(),
        parameters: vec![],
        description: Some("Half of total orders".to_string()),
    });
    
    // Add filters
    semantic_layer.add_filter(Filter {
        name: "filter_IsRecentOrder".to_string(),
        table: "orders".to_string(),
        expression: "orders.created_at >= CURRENT_DATE - INTERVAL '30' DAY".to_string(),
        parameters: vec![],
        description: Some("Orders from the last 30 days".to_string()),
    });
    
    semantic_layer.add_filter(Filter {
        name: "filter_OrderAmountGt".to_string(),
        table: "orders".to_string(),
        expression: "orders.amount > {{amount}}".to_string(),
        parameters: vec![
            Parameter {
                name: "amount".to_string(),
                param_type: ParameterType::Number,
                default: Some("100".to_string()),
            },
        ],
        description: Some("Orders with amount greater than a threshold".to_string()),
    });
    
    semantic_layer.add_filter(Filter {
        name: "filter_IsActiveUser".to_string(),
        table: "users".to_string(),
        expression: "users.status = 'active'".to_string(),
        parameters: vec![],
        description: Some("Active users".to_string()),
    });
    
    semantic_layer
}

#[tokio::test]
async fn test_simple_metric_substitution() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = "SELECT user_id, metric_TotalOrders FROM orders GROUP BY user_id";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("(COUNT(orders.id))"), 
        "Simple metric should be substituted correctly");
    
    Ok(())
}

#[tokio::test]
async fn test_parameterized_metric_substitution() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = "SELECT user_id, metric_OrdersLastNDays(60) FROM orders";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("INTERVAL '60' DAY"), 
        "Parameterized metric should substitute parameters correctly");
    
    Ok(())
}

#[tokio::test]
async fn test_default_parameter_values() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = "SELECT user_id, metric_OrdersLastNDays() FROM orders";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("INTERVAL '30' DAY"), 
        "Should use default parameter value");
    
    Ok(())
}

#[tokio::test]
async fn test_recursive_metric_substitution() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = "SELECT user_id, metric_RecursiveMetric FROM orders";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("((COUNT(orders.id))) / 2"), 
        "Recursive metric should be fully substituted");
    
    Ok(())
}

#[tokio::test]
async fn test_filter_substitution() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = "SELECT * FROM users WHERE filter_IsActiveUser";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("WHERE (users.status = 'active')"), 
        "Filter should be substituted correctly");
    
    Ok(())
}

#[tokio::test]
async fn test_parameterized_filter_substitution() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = "SELECT * FROM orders WHERE filter_OrderAmountGt(200)";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("WHERE (orders.amount > 200)"), 
        "Parameterized filter should substitute parameter correctly");
    
    Ok(())
}

#[tokio::test]
async fn test_compound_expressions_with_metrics() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = "SELECT user_id, metric_TotalOrders + metric_RecursiveMetric AS combined FROM orders";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("(COUNT(orders.id)) + (((COUNT(orders.id))) / 2)"), 
        "Compound expressions with metrics should be substituted correctly");
    
    Ok(())
}

#[tokio::test]
async fn test_missing_required_parameter() -> Result<()> {
    let mut semantic_layer = create_test_semantic_layer();
    
    // Add a metric with a required parameter (no default)
    semantic_layer.add_metric(Metric {
        name: "metric_RequiredParam".to_string(),
        table: "orders".to_string(),
        expression: "COUNT(CASE WHEN orders.created_at > '{{cutoff_date}}' THEN 1 END)".to_string(),
        parameters: vec![
            Parameter {
                name: "cutoff_date".to_string(),
                param_type: ParameterType::Date,
                default: None, // No default - required parameter
            },
        ],
        description: Some("Metric with required parameter".to_string()),
    });
    
    let sql = "SELECT metric_RequiredParam() FROM orders";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await;
    
    assert!(result.is_err(), "Should return error for missing required parameter");
    
    if let Err(SqlAnalyzerError::MissingParameter(msg)) = result {
        assert!(msg.contains("Missing required parameter"), 
            "Error should mention missing parameter");
    } else {
        panic!("Expected MissingParameter error but got: {:?}", result);
    }
    
    Ok(())
}

#[tokio::test]
async fn test_circular_reference_detection() -> Result<()> {
    let mut semantic_layer = create_test_semantic_layer();
    
    // Create circular reference: A -> B -> A
    semantic_layer.add_metric(Metric {
        name: "metric_CircularA".to_string(),
        table: "orders".to_string(),
        expression: "metric_CircularB + 10".to_string(),
        parameters: vec![],
        description: Some("Part of circular reference".to_string()),
    });
    
    semantic_layer.add_metric(Metric {
        name: "metric_CircularB".to_string(),
        table: "orders".to_string(),
        expression: "metric_CircularA * 2".to_string(),
        parameters: vec![],
        description: Some("Part of circular reference".to_string()),
    });
    
    let sql = "SELECT metric_CircularA FROM orders";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await;
    
    assert!(result.is_err(), "Should detect circular reference");
    
    if let Err(SqlAnalyzerError::SubstitutionError(msg)) = result {
        assert!(msg.contains("Circular reference"), 
            "Error should mention circular reference");
    } else {
        panic!("Expected SubstitutionError for circular reference but got: {:?}", result);
    }
    
    Ok(())
}

#[tokio::test]
async fn test_validate_and_substitute() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = "SELECT u.id, u.name, metric_TotalOrders FROM users u JOIN orders o ON u.id = o.user_id";
    
    let result = validate_and_substitute_semantic_query(
        sql.to_string(),
        semantic_layer,
        ValidationMode::Flexible,
    ).await?;
    
    assert!(result.contains("(COUNT(orders.id))"), "Metric should be substituted after validation");
    
    Ok(())
}

#[tokio::test]
async fn test_complex_query_with_metrics_and_filters() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = r#"
    WITH revenue_data AS (
        SELECT 
            user_id,
            metric_TotalSpending AS total_revenue,
            metric_OrdersLastNDays(90) AS q_orders
        FROM orders
        WHERE filter_OrderAmountGt(50)
        GROUP BY user_id
    )
    SELECT 
        u.name,
        rd.total_revenue,
        rd.q_orders,
        rd.total_revenue / NULLIF(rd.q_orders, 0) AS avg_order
    FROM users u
    JOIN revenue_data rd ON u.id = rd.user_id
    WHERE filter_IsActiveUser
    "#;
    
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    // Check various substitutions in different parts of the query
    assert!(result.contains("(SUM(orders.amount)) AS total_revenue"), 
        "Should substitute metric in CTE correctly");
    
    assert!(result.contains("INTERVAL '90' DAY"), 
        "Should substitute parameterized metric with parameter");
    
    assert!(result.contains("WHERE (orders.amount > 50)"), 
        "Should substitute parameterized filter with parameter");
    
    assert!(result.contains("WHERE (users.status = 'active')"), 
        "Should substitute filter in main query");
    
    Ok(())
}

#[tokio::test]
async fn test_metrics_in_subquery() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = r#"
    SELECT 
        u.name,
        (SELECT metric_TotalOrders FROM orders o WHERE o.user_id = u.id) AS order_count
    FROM users u
    WHERE filter_IsActiveUser
    "#;
    
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    // Check substitution in subquery
    assert!(result.contains("(SELECT (COUNT(orders.id)) FROM orders"), 
        "Should substitute metric in subquery correctly");
    
    // Check filter substitution
    assert!(result.contains("WHERE (users.status = 'active')"), 
        "Should substitute filter correctly");
    
    Ok(())
}

#[tokio::test]
async fn test_metrics_in_complex_expressions() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = r#"
    SELECT 
        u.id,
        u.name,
        CASE 
            WHEN metric_TotalOrders > 10 THEN 'High Volume'
            WHEN metric_TotalOrders > 5 THEN 'Medium Volume'
            ELSE 'Low Volume'
        END as volume_category,
        metric_TotalSpending / NULLIF(metric_TotalOrders, 0) as avg_order_value
    FROM 
        users u
    JOIN 
        orders o ON u.id = o.user_id
    GROUP BY 
        u.id, u.name
    HAVING 
        metric_TotalOrders > 0
    "#;
    
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    // Check CASE expression substitution
    assert!(result.contains("WHEN (COUNT(orders.id)) > 10 THEN"), 
        "Should substitute metric in CASE condition correctly");
    
    // Check complex expression with division
    assert!(result.contains("(SUM(orders.amount)) / NULLIF((COUNT(orders.id)), 0)"), 
        "Should substitute metrics in division expression correctly");
    
    // Check HAVING clause
    assert!(result.contains("HAVING (COUNT(orders.id)) > 0"), 
        "Should substitute metric in HAVING clause correctly");
    
    Ok(())
}

#[tokio::test]
async fn test_metrics_in_join_conditions() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    // This is an unusual case but should be handled correctly
    let sql = r#"
    SELECT u.id, p.name
    FROM users u
    JOIN orders o ON u.id = o.user_id AND o.amount > metric_AverageOrderValue
    JOIN products p ON o.product_id = p.id
    "#;
    
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    // Check metric substitution in JOIN condition
    assert!(result.contains("ON u.id = o.user_id AND o.amount > (SUM(orders.amount) / NULLIF(COUNT(orders.id), 0))"), 
        "Should substitute metric in JOIN condition correctly");
    
    Ok(())
}

#[tokio::test]
async fn test_multiple_parameter_metric() -> Result<()> {
    let mut semantic_layer = create_test_semantic_layer();
    
    semantic_layer.add_metric(Metric {
        name: "metric_DateRangeRevenue".to_string(),
        table: "orders".to_string(),
        expression: "SUM(CASE WHEN orders.created_at BETWEEN '{{start_date}}' AND '{{end_date}}' THEN orders.amount ELSE 0 END)".to_string(),
        parameters: vec![
            Parameter {
                name: "start_date".to_string(),
                param_type: ParameterType::Date,
                default: Some("'2023-01-01'".to_string()),
            },
            Parameter {
                name: "end_date".to_string(),
                param_type: ParameterType::Date,
                default: Some("'2023-12-31'".to_string()),
            },
        ],
        description: Some("Revenue within date range".to_string()),
    });
    
    let sql = "SELECT user_id, metric_DateRangeRevenue('2023-06-01', '2023-06-30') FROM orders";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("BETWEEN '2023-06-01' AND '2023-06-30'"), 
        "Should substitute multiple parameters correctly");
    
    Ok(())
}

#[tokio::test]
async fn test_nested_metrics() -> Result<()> {
    let mut semantic_layer = create_test_semantic_layer();
    
    // Add deeply nested metrics: A -> B -> C -> D (non-circular)
    semantic_layer.add_metric(Metric {
        name: "metric_D".to_string(),
        table: "orders".to_string(),
        expression: "COUNT(orders.id)".to_string(),
        parameters: vec![],
        description: Some("Base metric".to_string()),
    });
    
    semantic_layer.add_metric(Metric {
        name: "metric_C".to_string(),
        table: "orders".to_string(),
        expression: "metric_D * 2".to_string(),
        parameters: vec![],
        description: Some("Uses metric D".to_string()),
    });
    
    semantic_layer.add_metric(Metric {
        name: "metric_B".to_string(),
        table: "orders".to_string(),
        expression: "metric_C + 10".to_string(),
        parameters: vec![],
        description: Some("Uses metric C".to_string()),
    });
    
    semantic_layer.add_metric(Metric {
        name: "metric_A".to_string(),
        table: "orders".to_string(),
        expression: "metric_B / 2".to_string(),
        parameters: vec![],
        description: Some("Uses metric B".to_string()),
    });
    
    let sql = "SELECT metric_A FROM orders";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    // Check for fully recursive substitution
    assert!(result.contains("((((COUNT(orders.id)) * 2) + 10) / 2)"), 
        "Should recursively substitute all nested metrics");
    
    Ok(())
}

#[tokio::test]
async fn test_union_query_with_metrics() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = r#"
    SELECT 
        user_id,
        'Current' as period,
        metric_TotalOrders
    FROM 
        orders
    WHERE 
        filter_IsRecentOrder
    
    UNION ALL
    
    SELECT 
        user_id,
        'Previous' as period,
        metric_TotalOrders
    FROM 
        orders
    WHERE 
        NOT filter_IsRecentOrder
    "#;
    
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    // Check metric and filter substitution on both sides of the UNION
    assert!(result.matches("(COUNT(orders.id))").count() == 2, 
        "Should substitute metrics on both sides of UNION");
    
    assert!(result.matches("orders.created_at >= CURRENT_DATE - INTERVAL '30' DAY").count() == 2, 
        "Should substitute filter on both sides of UNION");
    
    Ok(())
}

#[tokio::test]
async fn test_metrics_in_having_and_order_by() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = r#"
    SELECT 
        user_id,
        metric_TotalOrders
    FROM 
        orders
    GROUP BY 
        user_id
    HAVING 
        metric_TotalOrders > 5
    ORDER BY 
        metric_TotalSpending DESC
    "#;
    
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    // Debug print the result
    println!("DEBUG - result: {}", result);
    
    
    assert!(result.contains("HAVING (COUNT(orders.id)) > 5"), 
        "Should substitute metric in HAVING clause");
    
    assert!(result.contains("ORDER BY (SUM(orders.amount)) DESC"), 
        "Should substitute metric in ORDER BY clause");
    
    
    Ok(())
}

#[tokio::test]
async fn test_parameter_type_validation() -> Result<()> {
    let mut semantic_layer = create_test_semantic_layer();
    
    semantic_layer.add_metric(Metric {
        name: "metric_TypedParameter".to_string(),
        table: "orders".to_string(),
        expression: "SUM(CASE WHEN orders.created_at >= '{{date_param}}' AND orders.amount > {{amount_param}} THEN orders.amount ELSE 0 END)".to_string(),
        parameters: vec![
            Parameter {
                name: "date_param".to_string(),
                param_type: ParameterType::Date,
                default: Some("'2023-01-01'".to_string()),
            },
            Parameter {
                name: "amount_param".to_string(),
                param_type: ParameterType::Number,
                default: Some("100".to_string()),
            },
        ],
        description: Some("Sum with typed parameters".to_string()),
    });
    
    // Test with valid parameters
    let sql_valid = "SELECT metric_TypedParameter('2023-06-01', 200) FROM orders";
    let result_valid = substitute_semantic_query(sql_valid.to_string(), semantic_layer.clone()).await?;
    
    assert!(result_valid.contains("'2023-06-01'"), "Should substitute date parameter correctly");
    assert!(result_valid.contains("200"), "Should substitute number parameter correctly");
    
    // Test with invalid number parameter
    let sql_invalid = "SELECT metric_TypedParameter('2023-06-01', 'not-a-number') FROM orders";
    let result_invalid = substitute_semantic_query(sql_invalid.to_string(), semantic_layer).await;
    
    assert!(result_invalid.is_err(), "Should reject invalid number parameter");
    if let Err(SqlAnalyzerError::InvalidParameter(msg)) = result_invalid {
        assert!(msg.contains("Expected number"), "Error should mention invalid number parameter");
    } else {
        panic!("Expected InvalidParameter error but got: {:?}", result_invalid);
    }
    
    Ok(())
}

#[tokio::test]
async fn test_parameter_escaping() -> Result<()> {
    let mut semantic_layer = create_test_semantic_layer();
    
    semantic_layer.add_filter(Filter {
        name: "filter_LikePattern".to_string(),
        table: "users".to_string(),
        expression: "users.email LIKE '{{pattern}}'".to_string(),
        parameters: vec![
            Parameter {
                name: "pattern".to_string(),
                param_type: ParameterType::String,
                default: Some("'%example.com%'".to_string()),
            },
        ],
        description: Some("Filter emails with pattern".to_string()),
    });
    
    let sql = "SELECT * FROM users WHERE filter_LikePattern('%special\\_chars%')";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("LIKE '%special\\_chars%'"), 
        "Should preserve special characters in parameter substitution");
    
    Ok(())
}

#[tokio::test]
async fn test_metrics_with_explicit_aliases() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = "SELECT user_id, metric_TotalOrders AS order_count FROM orders GROUP BY user_id";
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    assert!(result.contains("(COUNT(orders.id)) AS order_count"), 
        "Should preserve alias when substituting metric");
    
    Ok(())
}

#[tokio::test]
async fn test_deeply_nested_metrics_and_filters() -> Result<()> {
    let semantic_layer = create_test_semantic_layer();
    
    let sql = r#"
    WITH filtered_orders AS (
        SELECT * FROM orders WHERE filter_OrderAmountGt(200)
    )
    SELECT 
        u.id,
        metric_TotalOrders,
        (SELECT metric_TotalSpending FROM filtered_orders WHERE user_id = u.id) AS user_spending
    FROM users u
    WHERE u.id IN (SELECT user_id FROM filtered_orders GROUP BY user_id HAVING metric_TotalOrders > 5)
    "#;
    
    let result = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
    
    // Test for various substitutions
    assert!(result.contains("WHERE (orders.amount > 200)"), 
        "Should substitute filter in CTE");
    
    assert!(result.contains("(COUNT(orders.id))"), 
        "Should substitute metric in main query");
    
    assert!(result.contains("(SELECT (SUM(orders.amount)) FROM"), 
        "Should substitute metric in scalar subquery");
    
    assert!(result.contains("HAVING (COUNT(orders.id)) > 5"), 
        "Should substitute metric in HAVING clause of IN subquery");
    
    Ok(())
}