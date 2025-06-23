# Integration Tests for Database Library

This directory contains integration tests for the database library. The tests focus on ensuring that the database functionality works correctly, particularly around user permissions for dashboard files and metric files.

## Test Structure

The tests are organized as follows:

- `test_utils.rs`: Contains utilities for setting up test data and environment
- `metric_files_test.rs`: Tests for metric file permissions functionality
- `dashboard_files_test.rs`: Tests for dashboard file permissions functionality

## Running Tests

To run all tests:

```bash
cargo test -p database
```

To run specific tests:

```bash
cargo test -p database -- helpers::metric_files_test
cargo test -p database -- helpers::dashboard_files_test
```

## Test Coverage

### Metric File Tests

The tests cover:
- Direct permissions on metric files
- Collection-based permissions
- Dashboard-based permissions
- Public access permissions
- Fetch single metric file with permissions
- Fetch multiple metric files with permissions
- Permission hierarchy and precedence

### Dashboard File Tests

The tests cover:
- Direct permissions on dashboard files
- Collection-based permissions
- Public access permissions
- Fetch single dashboard file with permissions
- Fetch multiple dashboard files with permissions
- Permission hierarchy and precedence

## Best Practices

These tests follow the project's testing best practices:
- Async tests using tokio
- Proper test isolation
- Test utilities for common operations
- Comprehensive permission testing
- Clean setup and teardown