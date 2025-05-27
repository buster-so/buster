# Data Source Testing Guide

This directory contains comprehensive tests for the data source package, focusing on both unit and integration testing of the DataSource class and its introspection capabilities.

## Test Structure

```
tests/
├── unit/                           # Unit tests (no external dependencies)
│   ├── data-source.test.ts        # DataSource class unit tests
│   ├── types/                     # Type validation tests
│   └── adapters/                  # Adapter unit tests
├── integration/                   # Integration tests (require real databases)
│   ├── data-source.test.ts        # Basic DataSource integration tests
│   ├── data-source-introspection.test.ts  # Comprehensive introspection tests
│   └── adapters/                  # Adapter-specific integration tests
├── setup.ts                      # Test configuration and utilities
└── README.md                     # This file
```

## Testing Strategy

### Unit Tests (`tests/unit/`)

Unit tests focus on testing the DataSource class logic without requiring actual database connections. They use mocks and stubs to simulate adapter behavior.

**Key Features:**
- ✅ No external dependencies
- ✅ Fast execution
- ✅ Comprehensive coverage of all DataSource methods
- ✅ Error handling scenarios
- ✅ Configuration management
- ✅ Resource cleanup

**Coverage:**
- Constructor and initialization
- Data source management (add, remove, update)
- Query execution routing
- Introspection method delegation
- Connection testing
- Error handling
- Backward compatibility

### Integration Tests (`tests/integration/`)

Integration tests verify that the DataSource class works correctly with real database connections and adapters.

**Key Features:**
- ✅ Credential-based test skipping
- ✅ Real database connections
- ✅ Comprehensive introspection testing
- ✅ Multi-data source scenarios
- ✅ Error handling with real failures

**Supported Data Sources:**
- **Snowflake** - Full introspection testing
- **BigQuery** - Dataset and schema introspection
- **PostgreSQL** - Complete database introspection
- **MySQL** - Database and table introspection
- **SQL Server** - Database introspection
- **Redshift** - Database introspection
- **Databricks** - Catalog introspection

## Environment Setup

### Required Environment Variables

Create a `.env` file in the package root with the following variables (only include credentials for data sources you want to test):

```bash
# Snowflake
TEST_SNOWFLAKE_ACCOUNT_ID=your_account_id
TEST_SNOWFLAKE_WAREHOUSE_ID=your_warehouse_id
TEST_SNOWFLAKE_USERNAME=your_username
TEST_SNOWFLAKE_PASSWORD=your_password
TEST_SNOWFLAKE_DATABASE=your_database
TEST_SNOWFLAKE_SCHEMA=your_schema
TEST_SNOWFLAKE_ROLE=your_role

# BigQuery
TEST_BIGQUERY_PROJECT_ID=your_project_id
TEST_BIGQUERY_SERVICE_ACCOUNT_KEY=your_service_account_key_json
# OR
TEST_BIGQUERY_KEY_FILE_PATH=/path/to/service-account-key.json
TEST_BIGQUERY_DATASET=your_dataset
TEST_BIGQUERY_LOCATION=your_location

# PostgreSQL
TEST_POSTGRES_HOST=localhost
TEST_POSTGRES_PORT=5432
TEST_POSTGRES_DATABASE=your_database
TEST_POSTGRES_USERNAME=your_username
TEST_POSTGRES_PASSWORD=your_password
TEST_POSTGRES_SCHEMA=public
TEST_POSTGRES_SSL=false

# MySQL
TEST_MYSQL_HOST=localhost
TEST_MYSQL_PORT=3306
TEST_MYSQL_DATABASE=your_database
TEST_MYSQL_USERNAME=your_username
TEST_MYSQL_PASSWORD=your_password
TEST_MYSQL_SSL=false

# SQL Server
TEST_SQLSERVER_SERVER=your_server
TEST_SQLSERVER_PORT=1433
TEST_SQLSERVER_DATABASE=your_database
TEST_SQLSERVER_USERNAME=your_username
TEST_SQLSERVER_PASSWORD=your_password
TEST_SQLSERVER_ENCRYPT=true
TEST_SQLSERVER_TRUST_CERT=false

# Redshift
TEST_REDSHIFT_HOST=your_cluster_endpoint
TEST_REDSHIFT_PORT=5439
TEST_REDSHIFT_DATABASE=your_database
TEST_REDSHIFT_USERNAME=your_username
TEST_REDSHIFT_PASSWORD=your_password
TEST_REDSHIFT_SCHEMA=public
TEST_REDSHIFT_CLUSTER_ID=your_cluster_id

# Databricks
TEST_DATABRICKS_SERVER_HOSTNAME=your_server_hostname
TEST_DATABRICKS_HTTP_PATH=your_http_path
TEST_DATABRICKS_ACCESS_TOKEN=your_access_token
TEST_DATABRICKS_CATALOG=your_catalog
TEST_DATABRICKS_SCHEMA=your_schema
```

### Credential-Based Test Skipping

The test suite automatically skips integration tests for data sources where credentials are not provided. This allows you to:

- Run tests for only the data sources you have access to
- Avoid test failures due to missing credentials
- Maintain a clean test output

## Running Tests

### All Tests
```bash
# Run all tests (unit + integration)
bun test

# Run with verbose output
bun test --reporter=verbose
```

### Unit Tests Only
```bash
# Run only unit tests (fast, no external dependencies)
bun test tests/unit/
```

### Integration Tests Only
```bash
# Run only integration tests (requires database credentials)
bun test tests/integration/
```

### Specific Data Source Tests
```bash
# Run tests for specific data source introspection
bun test tests/integration/data-source-introspection.test.ts -t "PostgreSQL"
bun test tests/integration/data-source-introspection.test.ts -t "Snowflake"
```

### Watch Mode
```bash
# Run tests in watch mode during development
bun test --watch
```

## Test Scenarios

### Unit Test Scenarios

1. **Constructor and Initialization**
   - Empty data source configuration
   - Single data source configuration
   - Multiple data source configuration
   - Default data source setting

2. **Data Source Management**
   - Adding new data sources
   - Removing data sources
   - Updating data source configurations
   - Filtering data sources by type
   - Handling duplicate names

3. **Query Execution**
   - Successful query execution
   - Query with parameters
   - Warehouse routing
   - Error handling
   - Non-existent data source errors

4. **Introspection Method Delegation**
   - Getting introspector instances
   - Database introspection
   - Schema introspection
   - Table introspection
   - Column introspection
   - View introspection
   - Table statistics
   - Full introspection

5. **Connection Testing**
   - Single data source connection tests
   - Multiple data source connection tests
   - Connection failure handling

6. **Error Handling**
   - No data sources configured
   - Multiple data sources without default
   - Invalid configurations

7. **Resource Cleanup**
   - Proper adapter closure
   - Connection pool cleanup

### Integration Test Scenarios

1. **Per-Data Source Introspection**
   - Database/catalog listing
   - Schema introspection
   - Table introspection
   - Column introspection
   - View introspection
   - Table statistics (where supported)
   - Full introspection data

2. **Multi-Data Source Scenarios**
   - Multiple data sources with different types
   - Connection testing across all sources
   - Introspection routing

3. **Error Handling**
   - Invalid credentials
   - Network failures
   - Non-existent data source requests

## Test Data Validation

### Database Structure Validation
Tests verify that introspected data contains expected properties:

- **Databases**: `name`, `owner`, `comment`, `created`, `lastModified`
- **Schemas**: `name`, `database`, `owner`, `comment`
- **Tables**: `name`, `schema`, `database`, `type`, `rowCount`, `sizeBytes`
- **Columns**: `name`, `table`, `schema`, `database`, `position`, `dataType`, `isNullable`
- **Views**: `name`, `schema`, `database`, `definition`
- **Statistics**: `table`, `schema`, `database`, `columnStatistics`

### Data Type Validation
Tests ensure that returned data has correct TypeScript types:
- Strings are non-empty where required
- Numbers are valid where present
- Booleans are properly typed
- Dates are valid Date objects
- Arrays contain expected item types

## Performance Considerations

- **Unit tests** run in milliseconds
- **Integration tests** have a 30-second timeout per test
- Tests are designed to be run in parallel where possible
- Connection pooling is properly managed to avoid resource leaks

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase `TEST_TIMEOUT` in `setup.ts`
   - Check network connectivity to databases
   - Verify credentials are correct

2. **Connection Failures**
   - Verify environment variables are set correctly
   - Check firewall/network access to databases
   - Ensure databases are running and accessible

3. **Skipped Tests**
   - Tests are automatically skipped when credentials are missing
   - This is expected behavior, not a failure

4. **Memory Issues**
   - Ensure proper cleanup in `afterEach` hooks
   - Check for connection leaks in adapters

### Debug Mode

Enable debug logging by setting environment variables:
```bash
DEBUG=data-source:* bun test
```

## Contributing

When adding new tests:

1. **Unit tests** should not require external dependencies
2. **Integration tests** should use credential-based skipping
3. Follow the existing test structure and naming conventions
4. Include proper cleanup in `afterEach` hooks
5. Add appropriate timeout values for integration tests
6. Document any new environment variables required

## Test Coverage Goals

- **Unit Tests**: 100% code coverage of DataSource class
- **Integration Tests**: Verify all introspection methods work with real databases
- **Error Handling**: Cover all error scenarios
- **Performance**: Ensure tests complete within reasonable timeframes 