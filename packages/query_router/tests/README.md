# Query Router Testing Guide

This directory contains comprehensive tests for the Query Router package, including unit tests and integration tests for all supported database adapters.

## Test Structure

```
tests/
├── setup.ts                           # Test configuration and utilities
├── unit/                              # Unit tests (no external dependencies)
│   ├── adapters/
│   │   ├── base.test.ts              # Base adapter functionality
│   │   └── factory.test.ts           # Adapter factory tests
│   └── types/
│       └── credentials.test.ts       # Type guard tests
└── integration/                       # Integration tests (require real databases)
    ├── adapters/
    │   ├── postgresql.test.ts        # PostgreSQL adapter tests
    │   ├── mysql.test.ts             # MySQL adapter tests
    │   ├── snowflake.test.ts         # Snowflake adapter tests
    │   ├── bigquery.test.ts          # BigQuery adapter tests (TODO)
    │   ├── sqlserver.test.ts         # SQL Server adapter tests (TODO)
    │   ├── redshift.test.ts          # Redshift adapter tests (TODO)
    │   └── databricks.test.ts        # Databricks adapter tests (TODO)
    └── router.test.ts                # Main QueryRouter tests
```

## Running Tests

### Unit Tests Only
```bash
npm test -- --run unit/
```

### Integration Tests Only
```bash
npm test -- --run integration/
```

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

## Environment Variables

Create a `.env` file in the root of the `query_router` package with the following variables. Only provide credentials for the databases you want to test:

### PostgreSQL
```env
TEST_POSTGRES_HOST=localhost
TEST_POSTGRES_PORT=5432
TEST_POSTGRES_DATABASE=your_test_db
TEST_POSTGRES_USERNAME=your_username
TEST_POSTGRES_PASSWORD=your_password
TEST_POSTGRES_SCHEMA=public
TEST_POSTGRES_SSL=false
```

### MySQL
```env
TEST_MYSQL_HOST=localhost
TEST_MYSQL_PORT=3306
TEST_MYSQL_DATABASE=your_test_db
TEST_MYSQL_USERNAME=your_username
TEST_MYSQL_PASSWORD=your_password
TEST_MYSQL_SSL=false
```

### Snowflake
```env
TEST_SNOWFLAKE_ACCOUNT_ID=your-account.region.cloud
TEST_SNOWFLAKE_WAREHOUSE_ID=COMPUTE_WH
TEST_SNOWFLAKE_USERNAME=your_username
TEST_SNOWFLAKE_PASSWORD=your_password
TEST_SNOWFLAKE_DATABASE=your_database
TEST_SNOWFLAKE_SCHEMA=PUBLIC
TEST_SNOWFLAKE_ROLE=your_role
```

### BigQuery
```env
TEST_BIGQUERY_PROJECT_ID=your-gcp-project
# Either provide service account key as JSON string:
TEST_BIGQUERY_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
# Or provide path to key file:
TEST_BIGQUERY_KEY_FILE_PATH=/path/to/service-account.json
TEST_BIGQUERY_DATASET=your_dataset
TEST_BIGQUERY_LOCATION=US
```

### SQL Server
```env
TEST_SQLSERVER_SERVER=localhost
TEST_SQLSERVER_PORT=1433
TEST_SQLSERVER_DATABASE=your_test_db
TEST_SQLSERVER_USERNAME=your_username
TEST_SQLSERVER_PASSWORD=your_password
TEST_SQLSERVER_ENCRYPT=true
TEST_SQLSERVER_TRUST_CERT=false
```

### Redshift
```env
TEST_REDSHIFT_HOST=your-cluster.region.redshift.amazonaws.com
TEST_REDSHIFT_PORT=5439
TEST_REDSHIFT_DATABASE=your_database
TEST_REDSHIFT_USERNAME=your_username
TEST_REDSHIFT_PASSWORD=your_password
TEST_REDSHIFT_SCHEMA=public
TEST_REDSHIFT_CLUSTER_ID=your-cluster
```

### Databricks
```env
TEST_DATABRICKS_SERVER_HOSTNAME=your-workspace.cloud.databricks.com
TEST_DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
TEST_DATABRICKS_ACCESS_TOKEN=your_access_token
TEST_DATABRICKS_CATALOG=your_catalog
TEST_DATABRICKS_SCHEMA=default
```

## Test Behavior

- **Unit tests** run regardless of environment variables and test the code logic without external dependencies
- **Integration tests** automatically skip if the required credentials are not provided
- Tests use a 30-second timeout for database operations
- Each test cleans up after itself by closing connections

## Test Coverage

The tests cover:

1. **Adapter Functionality**
   - Connection establishment
   - Query execution (simple and parameterized)
   - Error handling
   - Connection testing
   - Proper cleanup

2. **Router Functionality**
   - Single and multiple data source configuration
   - Query routing to specific warehouses
   - Dynamic data source management
   - Error handling and graceful failures

3. **Type Safety**
   - Credential type guards
   - Adapter factory functionality
   - Proper TypeScript type checking

## Adding New Tests

When adding tests for new adapters:

1. Create integration test file in `tests/integration/adapters/`
2. Follow the pattern established in existing adapter tests
3. Use the `skipIfNoCredentials` helper to conditionally run tests
4. Add required environment variables to this README
5. Ensure proper cleanup in `afterEach` hooks

## Troubleshooting

### Tests are skipping
- Check that you've provided the required environment variables
- Verify your database credentials are correct
- Ensure the test databases are accessible from your test environment

### Connection timeouts
- Increase the `TEST_TIMEOUT` value in `setup.ts` if needed
- Check network connectivity to your databases
- Verify firewall settings allow connections

### Permission errors
- Ensure your database user has sufficient permissions
- For cloud databases, verify network access rules
- Check that SSL/TLS settings match your database requirements 