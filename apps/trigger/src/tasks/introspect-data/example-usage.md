# Using Table Exclusion in Introspect Data Task

## Example Usage

The `excludeTables` filter allows you to exclude specific tables from introspection. This is useful when you want to skip large system tables, temporary tables, or other tables that you don't want to process.

### Basic Example

```typescript
import { introspectDataTask } from './introspect-data-task';

// Exclude specific tables by name
const result = await introspectDataTask.trigger({
  dataSourceId: 'your-datasource-id',
  filters: {
    databases: ['MY_DATABASE'],
    schemas: ['PUBLIC'],
    excludeTables: [
      'temp_table',
      'system_logs',
      'audit_trail'
    ]
  }
});
```

### Advanced Example with Fully Qualified Names

You can also exclude tables using fully qualified names (database.schema.table):

```typescript
const result = await introspectDataTask.trigger({
  dataSourceId: 'your-datasource-id',
  filters: {
    excludeTables: [
      'raw_events',                    // Excludes by table name only
      'MY_DB.PUBLIC.large_log_table'   // Excludes by full path
    ]
  }
});
```

## How It Works

1. **At the Trigger Task Level**: The task filters out excluded tables after fetching metadata but before creating dataset records or triggering sub-tasks.

2. **At the Database Query Level**: Each database dialect (PostgreSQL, MySQL, Snowflake, etc.) also applies the exclusion filter directly in the SQL query for better performance.

## Filter Behavior

- Table names are case-insensitive when filtering
- You can specify just the table name or the full path (database.schema.table)
- Excluded tables won't be:
  - Added to dataset records
  - Sampled for statistics
  - Included in the final count

## Combining with Include Filters

You can combine `tables` (include) and `excludeTables` filters:

```typescript
const result = await introspectDataTask.trigger({
  dataSourceId: 'your-datasource-id',
  filters: {
    schemas: ['PUBLIC', 'ANALYTICS'],
    tables: ['users', 'orders', 'products', 'temp_orders'],
    excludeTables: ['temp_orders']  // Will exclude even if in tables list
  }
});
```

In this case, `temp_orders` will be excluded even though it's in the `tables` include list.