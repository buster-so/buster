# Database Integration Tests

This directory contains integration tests for the database package to verify connectivity and basic operations.

## Prerequisites

- Ensure you have a `DATABASE_URL` environment variable set up pointing to your test database
- The database should be accessible and contain the expected schema

## Running Tests

From the database package directory:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test integration.test.ts

# Run tests with a specific pattern
bun test -t "Database Connection"
```

## Test Coverage

The integration tests cover:

- **Database Connection**: Basic connectivity and environment variable validation
- **Organizations Table**: Basic queries, concurrent operations, and filtering
- **Users Table**: Basic queries and concurrent operations  
- **Join Operations**: Testing joins between users and organizations tables
- **Transaction Support**: Verifying database transaction functionality
- **Error Handling**: Testing graceful handling of invalid SQL and malformed queries
- **Connection Pool**: Testing concurrent connections and pool reuse

## Test Structure

Tests are organized using Bun's built-in test runner with Jest-compatible syntax:

- `describe()` blocks group related tests
- `test()` defines individual test cases
- `beforeAll()` and `afterAll()` handle setup and cleanup
- Uses `expect()` assertions for validation

## Environment Variables

The tests require:
- `DATABASE_URL`: Connection string to your test database

## Notes

- Tests use read-only operations to avoid modifying data
- Connection pool is properly cleaned up after tests
- Tests are designed to work with existing data or empty tables
- Concurrent operations are tested to verify pool functionality 