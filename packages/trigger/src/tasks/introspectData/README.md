# Introspect Data Task

This task provides automated data source introspection capabilities, allowing you to connect to various database systems and analyze their structure.

## Features

- **Connection Testing**: Verifies database connectivity before introspection
- **Full Schema Analysis**: Discovers databases, schemas, tables, columns, and views
- **Multi-Database Support**: Works with Snowflake, PostgreSQL, MySQL, BigQuery, SQL Server, Redshift, and Databricks
- **Error Handling**: Graceful error handling with detailed logging
- **Resource Management**: Automatic connection cleanup

## Usage

```typescript
import { introspectData } from './tasks/introspectData';
import { DataSourceType } from '@buster/data-source';

// Example: Snowflake introspection
const result = await introspectData.trigger({
  dataSourceName: 'my-snowflake-warehouse',
  credentials: {
    type: DataSourceType.Snowflake,
    account_id: 'ABC12345.us-central1.gcp',
    warehouse_id: 'COMPUTE_WH',
    username: 'your-username',
    password: 'your-password',
    default_database: 'ANALYTICS_DB',
    default_schema: 'PUBLIC'
  },
  options: {
    databases: ['ANALYTICS_DB'],
    schemas: ['PUBLIC', 'STAGING']
  }
});

// Example: PostgreSQL introspection
const pgResult = await introspectData.trigger({
  dataSourceName: 'my-postgres-db',
  credentials: {
    type: DataSourceType.PostgreSQL,
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'postgres',
    password: 'password',
    schema: 'public'
  }
});
```

## Input Schema

### IntrospectDataInput

| Field               | Type        | Required | Description                                                |
| ------------------- | ----------- | -------- | ---------------------------------------------------------- |
| `dataSourceName`    | string      | Yes      | Unique identifier for the data source                      |
| `credentials`       | Credentials | Yes      | Database connection credentials (type depends on database) |
| `options`           | Object      | No       | Optional filters for introspection scope                   |
| `options.databases` | string[]    | No       | Limit introspection to specific databases                  |
| `options.schemas`   | string[]    | No       | Limit introspection to specific schemas                    |
| `options.tables`    | string[]    | No       | Limit introspection to specific tables                     |

### Supported Credential Types

- **Snowflake**: `account_id`, `warehouse_id`, `username`, `password`, `default_database`, etc.
- **PostgreSQL**: `host`, `port`, `database`, `username`, `password`, `schema`, etc.
- **MySQL**: `host`, `port`, `database`, `username`, `password`, etc.
- **BigQuery**: `project_id`, `service_account_key`, `default_dataset`, etc.
- **SQL Server**: `server`, `port`, `database`, `username`, `password`, etc.
- **Redshift**: `host`, `port`, `database`, `username`, `password`, etc.
- **Databricks**: `server_hostname`, `http_path`, `access_token`, etc.

## Output Schema

### IntrospectDataOutput

| Field            | Type    | Description                                       |
| ---------------- | ------- | ------------------------------------------------- |
| `success`        | boolean | Whether the introspection completed successfully  |
| `dataSourceName` | string  | The name of the data source that was introspected |
| `error`          | string  | Error message if introspection failed (optional)  |

## Error Handling

The task includes comprehensive error handling:

- **Connection Errors**: If the database connection fails
- **Authentication Errors**: If credentials are invalid
- **Permission Errors**: If the user lacks required permissions
- **Timeout Errors**: If operations exceed the 5-minute limit

All errors are logged with context and returned in the output for debugging.

## Performance Considerations

- **Timeout**: Tasks are limited to 5 minutes (300 seconds)
- **Connection Cleanup**: Database connections are automatically closed
- **Batched Operations**: Column statistics are processed in batches for efficiency
- **Caching**: The underlying introspection engine uses caching to optimize repeated queries

## Logging

The task provides detailed logging at each step:

- Connection testing
- Introspection progress
- Results summary (counts of databases, schemas, tables, etc.)
- Error details

Check the Trigger.dev dashboard for detailed execution logs. 