# Database Test Infrastructure Guide

> **Last Updated**: April 7, 2025  
> **Version**: 1.1.0

This directory contains the test infrastructure for the database library, providing standardized utilities for database testing, permission testing, and asset management.

## Overview

The test infrastructure is located in the `common/` directory and consists of:

1. **TestDb**: Central utility for database connections and cleanup
2. **PermissionTestHelpers**: Utilities for testing permissions
3. **AssetTestHelpers**: Utilities for creating and managing test assets
4. **AuthenticatedUser**: Test user representation for auth scenarios

## Quick Reference

### Key Test Components

| Component | Purpose | Key Methods |
|-----------|---------|-------------|
| `TestDb` | Database connections & test isolation | `new()`, `diesel_conn()`, `cleanup()` |
| `TestSetup` | Pre-configured user, org, and DB | `new()`, `with_role()` |
| `AssetTestHelpers` | Create test assets | `create_test_*()` methods |
| `PermissionTestHelpers` | Manage test permissions | `create_user_permission()`, `verify_user_permission()` |

### Common Patterns

```rust
// Basic pattern
let test_db = TestDb::new().await?;
// ... test code ...
test_db.cleanup().await?;

// With user setup (preferred)
let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
// ... test code with setup.user, setup.organization ...
setup.db.cleanup().await?;

// Creating assets with permissions in one step
let metric = AssetTestHelpers::create_test_metric_with_permission(
    &test_db, "Test Metric", user_id, AssetPermissionRole::Owner
).await?;
```

## Using the Test Infrastructure

### Basic Usage

Here's a simple example of using the test infrastructure:

```rust
#[tokio::test]
async fn test_my_feature() -> Result<()> {
    // Create a test database environment
    let test_db = TestDb::new().await?;
    
    // Create a test metric
    let metric = AssetTestHelpers::create_test_metric(&test_db, "Test Metric").await?;
    
    // Add permission
    PermissionTestHelpers::create_user_permission(
        &test_db,
        metric.id,
        AssetType::MetricFile,
        test_db.user_id,
        AssetPermissionRole::Owner
    ).await?;
    
    // Test your functionality using the created test data
    
    // Clean up (optional - will be done automatically when test_db is dropped)
    test_db.cleanup().await?;
    
    Ok(())
}
```

### TestSetup

For more complex tests requiring an authenticated user and organization:

```rust
#[tokio::test]
async fn test_with_authenticated_user() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
    
    // Use authenticated user in handler
    let result = some_handler(
        &setup.user,
        &setup.organization,
        // ... other params ...
    ).await?;
    
    // Test assertions
    assert!(result.is_ok());
    
    Ok(())
}
```

### Testing with Different User Roles

```rust
#[tokio::test]
async fn test_with_different_roles() -> Result<()> {
    // Test with viewer role
    let viewer_setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    
    // Test with editor role
    let editor_setup = TestSetup::new(Some(UserOrganizationRole::Querier)).await?;
    
    // Make assertions based on roles
    
    Ok(())
}
```

## Working with Assets and Permissions

### Creating Assets

```rust
// Create a test metric
let metric = AssetTestHelpers::create_test_metric(&test_db, "Test Metric").await?;

// Create a test dashboard
let dashboard = AssetTestHelpers::create_test_dashboard(&test_db, "Test Dashboard").await?;

// Create a test collection
let collection = AssetTestHelpers::create_test_collection(&test_db, "Test Collection").await?;

// Create a test chat
let chat = AssetTestHelpers::create_test_chat(&test_db, "Test Chat").await?;
```

### Creating Assets with Permissions

```rust
// Create a metric with owner permission
let metric = AssetTestHelpers::create_test_metric_with_permission(
    &test_db,
    "Test Metric with Permission",
    user_id,
    AssetPermissionRole::Owner
).await?;

// Create a dashboard with editor permission
let dashboard = AssetTestHelpers::create_test_dashboard_with_permission(
    &test_db,
    "Test Dashboard with Permission",
    user_id,
    AssetPermissionRole::CanEdit
).await?;
```

### Managing Permissions

```rust
// Create a permission
let permission = PermissionTestHelpers::create_user_permission(
    &test_db,
    asset_id,
    AssetType::MetricFile,
    user_id,
    AssetPermissionRole::Owner
).await?;

// Verify a permission
PermissionTestHelpers::verify_user_permission(
    &test_db,
    asset_id,
    user_id,
    AssetPermissionRole::Owner
).await?;

// Get all permissions for an asset
let permissions = PermissionTestHelpers::get_asset_permissions(
    &test_db,
    asset_id
).await?;

// Get all permissions for a user
let user_permissions = PermissionTestHelpers::get_user_permissions(
    &test_db,
    user_id
).await?;
```

## Test Fixture Patterns

### Creating Complex Test Fixtures

When you need a more complex test setup, you can create a custom function that builds your test environment:

```rust
/// Create a test environment with a collection containing multiple metrics
async fn setup_collection_with_metrics(
    test_db: &TestDb, 
    user_id: &Uuid,
    metric_count: usize
) -> Result<(Collection, Vec<MetricFile>)> {
    // Create a collection
    let collection = AssetTestHelpers::create_test_collection_with_permission(
        test_db, 
        "Test Collection", 
        *user_id, 
        AssetPermissionRole::Owner
    ).await?;
    
    // Create multiple metrics and add to collection
    let mut metrics = Vec::new();
    for i in 0..metric_count {
        let metric = AssetTestHelpers::create_test_metric_with_permission(
            test_db,
            &format!("Test Metric {}", i),
            *user_id,
            AssetPermissionRole::Owner
        ).await?;
        
        // Add metric to collection
        CollectionTestHelpers::add_asset_to_collection(
            test_db,
            collection.id,
            metric.id,
            AssetType::MetricFile
        ).await?;
        
        metrics.push(metric);
    }
    
    Ok((collection, metrics))
}
```

### Working with Mock Data

You can create mock data for non-database tests:

```rust
/// Create a mock metric for testing
fn create_mock_metric() -> BusterMetric {
    BusterMetric {
        id: Uuid::new_v4(),
        name: "Mock Metric".to_string(),
        description: Some("A metric for testing".to_string()),
        // ... other fields ...
        permission: AssetPermissionRole::Owner,
        // ... fill in required fields ...
    }
}
```

## Troubleshooting

### Common Test Issues

1. **Test Data Not Cleaned Up**
   - **Problem**: Test data from a previous run affects current tests
   - **Solution**: Ensure `test_db.cleanup()` is called at the end of each test
   - **Example Fix**: Use Rust's `defer!` macro or add cleanup in a `Drop` implementation

2. **Test Database Connection Issues**
   - **Problem**: Tests fail with connection errors
   - **Solution**: Check that the test database is running and properly configured
   - **Example Error**: `Failed to get connection: connection pool timeout`

3. **Missing Test Dependencies**
   - **Problem**: Test fixtures depend on other fixtures that aren't created
   - **Solution**: Use helper functions to create complete test environments
   - **Example Fix**: Create combined test setup functions

### Debugging Tests

For detailed debugging of test database operations:

```bash
# Enable SQL logging during tests
TEST_LOG=debug cargo test -p database my_test_name

# Run a single test with output
cargo test -p database my_test_name -- --nocapture
```

## Best Practices

1. **Use unique test identifiers**: The TestDb creates a unique test_id for each test instance. Use this to prefix test asset names for easy identification and cleanup.

2. **Clean up after tests**: The TestDb.cleanup() method removes all test data created during the test. Call it explicitly at the end of your test or let it be called automatically when TestDb is dropped.

3. **Isolate tests**: Each test should create its own TestDb instance to ensure proper isolation between tests.

4. **Use descriptive names**: Provide descriptive names for test assets to make test debugging easier.

5. **Prefer combined helpers**: Use methods like create_test_metric_with_permission when you need both an asset and its permission.

6. **Test with all permission levels**: Ensure functionality is tested with different permission levels (Owner, CanEdit, CanView, etc.)

7. **Avoid hard-coded IDs**: Generate new UUIDs for each test to ensure isolation

8. **Test error cases**: Ensure tests cover both success and error cases

## Additional Information

For more details on testing patterns and best practices, refer to the `documentation/testing.mdc` file in the project root.

## Changelog

- **1.1.0** (April 7, 2025): Added quick reference table, test fixture patterns, troubleshooting section
- **1.0.0** (January 12, 2025): Initial documentation version