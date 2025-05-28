# @buster/data-source

A TypeScript library for connecting to, querying, and introspecting multiple data source types including Snowflake, BigQuery, PostgreSQL, MySQL, SQL Server, Redshift, and Databricks.

## Features

- **Multi-Database Support**: Connect to 7+ different database types with a unified interface
- **Query Routing**: Route queries to specific data sources or use intelligent defaults
- **Database Introspection**: Discover database structure, tables, columns, and statistics
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Connection Management**: Automatic connection pooling and lifecycle management
- **Error Handling**: Graceful error handling with detailed error information

## Supported Data Sources

- **Snowflake** - Full introspection support with clustering information
- **PostgreSQL** - Full introspection support
- **MySQL** - Full introspection support
- **BigQuery** - Basic support (introspection placeholder)
- **SQL Server** - Basic support (introspection placeholder)
- **Redshift** - Basic support (introspection placeholder)
- **Databricks** - Basic support (introspection placeholder)

## Installation

```bash
npm install @buster/data-source
```

## Quick Start

### Basic Usage

```typescript
import { DataSource, DataSourceType } from '@buster/data-source';

// Configure your data sources
const dataSource = new DataSource({
  dataSources: [
    {
      name: 'snowflake-prod',
      type: DataSourceType.Snowflake,
      credentials: {
        type: DataSourceType.Snowflake,
        account_id: 'your-account',
        username: 'your-username',
        password: 'your-password',
        warehouse_id: 'your-warehouse',
        default_database: 'your-database',
      },
    },
    {
      name: 'postgres-dev',
      type: DataSourceType.PostgreSQL,
      credentials: {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'dev_db',
        username: 'dev_user',
        password: 'dev_password',
      },
    },
  ],
  defaultDataSource: 'snowflake-prod',
});

// Execute queries
const result = await dataSource.execute({
  sql: 'SELECT * FROM users LIMIT 10',
  warehouse: 'snowflake-prod', // Optional: specify data source
});

console.log(result.rows);
```

### Database Introspection

```typescript
// Get all databases
const databases = await dataSource.getDatabases('snowflake-prod');
console.log('Databases:', databases.map(db => db.name));

// Get schemas in a database
const schemas = await dataSource.getSchemas('snowflake-prod', 'ANALYTICS_DB');
console.log('Schemas:', schemas.map(s => s.name));

// Get tables in a schema
const tables = await dataSource.getTables('snowflake-prod', 'ANALYTICS_DB', 'PUBLIC');
console.log('Tables:', tables.map(t => ({ name: t.name, type: t.type, rows: t.rowCount })));

// Get columns in a table
const columns = await dataSource.getColumns('snowflake-prod', 'ANALYTICS_DB', 'PUBLIC', 'USERS');
console.log('Columns:', columns.map(c => ({ name: c.name, type: c.dataType, nullable: c.isNullable })));

// Get table statistics (Snowflake)
const stats = await dataSource.getTableStatistics('ANALYTICS_DB', 'PUBLIC', 'USERS', 'snowflake-prod');
console.log('Table stats:', {
  rowCount: stats.rowCount,
  sizeBytes: stats.sizeBytes,
  columnStats: stats.columnStatistics.length,
});

// Get comprehensive introspection
const fullIntrospection = await dataSource.getFullIntrospection('snowflake-prod');
console.log('Full catalog:', {
  databases: fullIntrospection.databases.length,
  schemas: fullIntrospection.schemas.length,
  tables: fullIntrospection.tables.length,
  columns: fullIntrospection.columns.length,
});
```

### Advanced Usage

```typescript
// Direct introspector access
const introspector = await dataSource.introspect('snowflake-prod');
const databases = await introspector.getDatabases();

// Add data sources dynamically
await dataSource.addDataSource({
  name: 'mysql-analytics',
  type: DataSourceType.MySQL,
  credentials: {
    type: DataSourceType.MySQL,
    host: 'mysql.example.com',
    database: 'analytics',
    username: 'analyst',
    password: 'secret',
  },
});

// Test connections
const connectionStatus = await dataSource.testAllDataSources();
console.log('Connection status:', connectionStatus);

// Clean up
await dataSource.close();
```

## Configuration

### Data Source Configuration

```typescript
interface DataSourceConfig {
  name: string;                    // Unique identifier
  type: DataSourceType;           // Database type
  credentials: Credentials;       // Type-specific credentials
  config?: Record<string, unknown>; // Additional options
}
```

### Snowflake Credentials

```typescript
interface SnowflakeCredentials {
  type: DataSourceType.Snowflake;
  account_id: string;             // Account identifier
  warehouse_id: string;           // Warehouse for compute
  username: string;
  password: string;
  role?: string;                  // Optional role
  default_database: string;
  default_schema?: string;
}
```

### PostgreSQL Credentials

```typescript
interface PostgreSQLCredentials {
  type: DataSourceType.PostgreSQL;
  host: string;
  port?: number;                  // Default: 5432
  database: string;
  username: string;
  password: string;
  schema?: string;                // Default schema
  ssl?: boolean | SSLConfig;      // SSL configuration
  connection_timeout?: number;    // Connection timeout in ms
}
```

## Introspection Types

### Database Structure

```typescript
interface Database {
  name: string;
  owner?: string;
  comment?: string;
  created?: Date;
  lastModified?: Date;
  metadata?: Record<string, unknown>;
}

interface Schema {
  name: string;
  database: string;
  owner?: string;
  comment?: string;
  created?: Date;
  lastModified?: Date;
}

interface Table {
  name: string;
  schema: string;
  database: string;
  type: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE';
  rowCount?: number;
  sizeBytes?: number;
  comment?: string;
  created?: Date;
  lastModified?: Date;
  clusteringKeys?: string[];      // Snowflake clustering keys
}

interface Column {
  name: string;
  table: string;
  schema: string;
  database: string;
  position: number;
  dataType: string;
  isNullable: boolean;
  defaultValue?: string;
  maxLength?: number;
  precision?: number;
  scale?: number;
  comment?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}
```

### Statistics

```typescript
interface TableStatistics {
  table: string;
  schema: string;
  database: string;
  rowCount?: number;
  sizeBytes?: number;
  columnStatistics: ColumnStatistics[];
  clusteringInfo?: ClusteringInfo;  // Snowflake-specific
  lastUpdated?: Date;
}

interface ColumnStatistics {
  columnName: string;
  distinctCount?: number;
  nullCount?: number;
  minValue?: unknown;
  maxValue?: unknown;
  avgValue?: number;
  topValues?: Array<{ value: unknown; frequency: number }>;
}
```

## Error Handling

```typescript
// Query results include success status and error details
const result = await dataSource.execute({
  sql: 'SELECT * FROM non_existent_table',
});

if (!result.success) {
  console.error('Query failed:', result.error?.message);
  console.error('Error code:', result.error?.code);
}
```

## Backward Compatibility

The package maintains backward compatibility with the previous `QueryRouter` class:

```typescript
import { QueryRouter } from '@buster/data-source';

// This still works
const router = new QueryRouter({ dataSources: [...] });
```

## Examples

See the [examples directory](./examples/) for comprehensive usage examples:

- [Basic Usage](./examples/basic-usage.ts) - Simple query execution
- [Introspection](./examples/introspection.ts) - Database discovery and cataloging
- [Advanced Routing](./examples/advanced-routing.ts) - Multi-database scenarios

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/integration/adapters/snowflake.test.ts

# Type checking
npm run typecheck
```

### Environment Variables for Testing

```bash
# PostgreSQL
TEST_POSTGRES_HOST=localhost
TEST_POSTGRES_PORT=5432
TEST_POSTGRES_DATABASE=test_db
TEST_POSTGRES_USERNAME=test_user
TEST_POSTGRES_PASSWORD=test_password

# Snowflake
TEST_SNOWFLAKE_ACCOUNT_ID=your_account
TEST_SNOWFLAKE_USERNAME=your_username
TEST_SNOWFLAKE_PASSWORD=your_password
TEST_SNOWFLAKE_WAREHOUSE_ID=your_warehouse
TEST_SNOWFLAKE_DATABASE=your_database

# MySQL
TEST_MYSQL_HOST=localhost
TEST_MYSQL_PORT=3306
TEST_MYSQL_DATABASE=test_db
TEST_MYSQL_USERNAME=test_user
TEST_MYSQL_PASSWORD=test_password

# BigQuery
TEST_BIGQUERY_PROJECT_ID=your_project
TEST_BIGQUERY_SERVICE_ACCOUNT_KEY=path/to/key.json
```

## Architecture

```
@buster/data-source
├── src/
│   ├── adapters/           # Database-specific adapters
│   │   ├── base.ts        # Base adapter interface
│   │   ├── snowflake.ts   # Snowflake implementation
│   │   ├── postgresql.ts  # PostgreSQL implementation
│   │   └── ...
│   ├── introspection/     # Database introspection
│   │   ├── base.ts        # Base introspector interface
│   │   ├── snowflake.ts   # Snowflake introspection
│   │   └── ...
│   ├── types/             # Type definitions
│   │   ├── credentials.ts # Credential interfaces
│   │   ├── query.ts       # Query types
│   │   └── introspection.ts # Introspection types
│   ├── data-source.ts     # Main DataSource class
│   └── index.ts           # Public API exports
├── tests/                 # Test suites
└── examples/              # Usage examples
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Scoped Full Introspection

You can now scope full introspection to specific databases, schemas, or tables:

```typescript
// Get introspection for specific databases
const result = await dataSource.getFullIntrospection('myDataSource', {
  databases: ['sales_db', 'analytics_db']
});

// Get introspection for specific schemas
const result = await dataSource.getFullIntrospection('myDataSource', {
  schemas: ['public', 'reporting']
});

// Get introspection for specific tables
const result = await dataSource.getFullIntrospection('myDataSource', {
  tables: ['customers', 'orders', 'products']
});

// Combine filters - get specific tables from specific schemas
const result = await dataSource.getFullIntrospection('myDataSource', {
  schemas: ['public'],
  tables: ['customers', 'orders']
});
```

The scoping works hierarchically:
- If `databases` is specified, only schemas, tables, columns, and views from those databases are included
- If `schemas` is specified, only tables, columns, and views from those schemas are included  
- If `tables` is specified, only those specific tables and their columns are included
- Filters can be combined for more precise scoping

This is particularly useful for large data sources where you only need to introspect a subset of the available objects. 