# Query Router

A TypeScript library for routing SQL queries across multiple data source types including Snowflake, BigQuery, PostgreSQL, MySQL, SQL Server, Redshift, and Databricks.

## Features

- **Multi-Database Support**: Connect to and query multiple database types from a single interface
- **Type-Safe**: Full TypeScript support with proper type definitions
- **Connection Management**: Automatic connection pooling and lifecycle management
- **Error Handling**: Comprehensive error handling with detailed error information
- **Parameterized Queries**: Support for parameterized queries across all database types
- **Dynamic Configuration**: Add, remove, and update data sources at runtime
- **Connection Testing**: Built-in connection testing for all configured data sources

## Supported Data Sources

- **Snowflake** - Using `snowflake-sdk`
- **BigQuery** - Using `@google-cloud/bigquery`
- **PostgreSQL** - Using `pg`
- **MySQL** - Using `mysql2`
- **SQL Server** - Using `mssql`
- **Redshift** - Using `pg` (PostgreSQL-compatible)
- **Databricks** - Using `@databricks/sql`

## Installation

```bash
bun add @your-org/query-router
```

The package includes all necessary database drivers as dependencies.

## Quick Start

```typescript
import { QueryRouter, DataSourceType } from '@your-org/query-router';

// Configure your data sources
const router = new QueryRouter({
  dataSources: [
    {
      name: 'postgres-main',
      type: DataSourceType.PostgreSQL,
      credentials: {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'myapp',
        username: 'postgres',
        password: 'password',
      },
    },
    {
      name: 'snowflake-warehouse',
      type: DataSourceType.Snowflake,
      credentials: {
        type: DataSourceType.Snowflake,
        account_id: 'your-account.region.cloud',
        warehouse_id: 'COMPUTE_WH',
        username: 'your-username',
        password: 'your-password',
        default_database: 'your-database',
      },
    },
  ],
  defaultDataSource: 'postgres-main',
});

// Execute queries
const result = await router.execute({
  sql: 'SELECT * FROM users WHERE status = ?',
  params: ['active'],
  warehouse: 'postgres-main', // Optional: uses default if not specified
});

console.log(result.rows);

// Clean up when done
await router.close();
```

## Configuration

### Data Source Configuration

Each data source requires a configuration object with the following structure:

```typescript
interface DataSourceConfig {
  name: string;           // Unique identifier
  type: DataSourceType;   // Database type
  credentials: Credentials; // Database-specific credentials
  config?: Record<string, any>; // Additional options
}
```

### Credential Types

#### Snowflake
```typescript
{
  type: DataSourceType.Snowflake,
  account_id: string,
  warehouse_id: string,
  username: string,
  password: string,
  default_database: string,
  role?: string,
  default_schema?: string,
}
```

#### PostgreSQL
```typescript
{
  type: DataSourceType.PostgreSQL,
  host: string,
  port?: number,
  database: string,
  username: string,
  password: string,
  schema?: string,
  ssl?: boolean | SSLConfig,
  connection_timeout?: number,
}
```

#### BigQuery
```typescript
{
  type: DataSourceType.BigQuery,
  project_id: string,
  service_account_key?: string, // JSON string or file path
  key_file_path?: string,
  default_dataset?: string,
  location?: string,
}
```

#### MySQL
```typescript
{
  type: DataSourceType.MySQL,
  host: string,
  port?: number,
  database: string,
  username: string,
  password: string,
  ssl?: boolean | SSLConfig,
  connection_timeout?: number,
  charset?: string,
}
```

#### SQL Server
```typescript
{
  type: DataSourceType.SQLServer,
  server: string,
  port?: number,
  database: string,
  username: string,
  password: string,
  domain?: string,
  instance?: string,
  encrypt?: boolean,
  trust_server_certificate?: boolean,
  connection_timeout?: number,
  request_timeout?: number,
}
```

#### Redshift
```typescript
{
  type: DataSourceType.Redshift,
  host: string,
  port?: number,
  database: string,
  username: string,
  password: string,
  schema?: string,
  ssl?: boolean,
  connection_timeout?: number,
  cluster_identifier?: string,
}
```

#### Databricks
```typescript
{
  type: DataSourceType.Databricks,
  server_hostname: string,
  http_path: string,
  access_token: string,
  catalog?: string,
  schema?: string,
  connection_timeout?: number,
}
```

## API Reference

### QueryRouter

#### Constructor
```typescript
new QueryRouter(config: QueryRouterConfig)
```

#### Methods

##### `execute<T>(request: QueryRequest): Promise<QueryResult<T>>`
Execute a SQL query on a data source.

```typescript
const result = await router.execute({
  sql: 'SELECT * FROM users WHERE id = ?',
  params: [123],
  warehouse: 'postgres-main', // Optional
});
```

##### `testDataSource(name: string): Promise<boolean>`
Test connection to a specific data source.

##### `testAllDataSources(): Promise<Record<string, boolean>>`
Test connections to all configured data sources.

##### `addDataSource(config: DataSourceConfig): Promise<void>`
Add a new data source configuration.

##### `removeDataSource(name: string): Promise<void>`
Remove a data source configuration.

##### `updateDataSource(name: string, config: Partial<DataSourceConfig>): Promise<void>`
Update an existing data source configuration.

##### `getDataSources(): string[]`
Get list of configured data source names.

##### `getDataSourcesByType(type: DataSourceType): DataSourceConfig[]`
Get data sources filtered by type.

##### `close(): Promise<void>`
Close all connections and clean up resources.

### Query Request

```typescript
interface QueryRequest {
  sql: string;              // SQL query string
  params?: any[];           // Query parameters
  warehouse?: string;       // Target data source name
  options?: QueryOptions;   // Additional options
}
```

### Query Result

```typescript
interface QueryResult<T = any> {
  success: boolean;         // Execution status
  rows: T[];               // Result rows
  columns: ColumnMetadata[]; // Column information
  rowsAffected?: number;    // Affected rows (for DML)
  executionTime: number;    // Execution time in ms
  warehouse: string;        // Data source used
  error?: QueryError;       // Error details if failed
}
```

## Examples

See the [examples](./examples/) directory for comprehensive usage examples:

- [Basic Usage](./examples/basic-usage.ts) - Simple query execution
- [Dynamic Configuration](./examples/basic-usage.ts) - Adding data sources at runtime
- [Error Handling](./examples/basic-usage.ts) - Handling connection and query errors

## Error Handling

The router provides comprehensive error handling:

```typescript
const result = await router.execute({
  sql: 'SELECT * FROM nonexistent_table',
});

if (!result.success) {
  console.error('Query failed:', result.error?.message);
  console.error('Error code:', result.error?.code);
}
```

## Connection Management

The router automatically manages connections:

- Connections are created lazily when first needed
- Connection pooling is handled by the underlying database drivers
- Connections are reused across queries to the same data source
- All connections are properly closed when `router.close()` is called

## TypeScript Support

The package is written in TypeScript and provides full type safety:

```typescript
import type { 
  QueryRouter, 
  DataSourceConfig, 
  QueryResult,
  SnowflakeCredentials 
} from '@your-org/query-router';

// Type-safe configuration
const config: DataSourceConfig = {
  name: 'my-snowflake',
  type: DataSourceType.Snowflake,
  credentials: {
    // TypeScript will enforce the correct credential structure
    type: DataSourceType.Snowflake,
    account_id: 'account',
    warehouse_id: 'warehouse',
    // ... other required fields
  },
};

// Type-safe query results
interface User {
  id: number;
  name: string;
  email: string;
}

const result: QueryResult<User> = await router.execute({
  sql: 'SELECT id, name, email FROM users',
});

// result.rows is now typed as User[]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `bun test`
6. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details. 