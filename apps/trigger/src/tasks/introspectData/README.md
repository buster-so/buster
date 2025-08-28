# Introspect Data Tasks

This module provides data source introspection using a functional factory pattern with Trigger.dev orchestration.

## Overview

The introspection system uses a two-phase approach:
1. **Main Task (`introspectDataTask`)**: Fetches structural metadata (tables, row counts) and triggers sampling sub-tasks
2. **Sub-Task (`sampleTableTask`)**: Samples individual tables for future statistical analysis

## Tasks

### introspectDataTask

Main introspection task that fetches high-level metadata and orchestrates table sampling.

**Input Schema:**
```typescript
interface IntrospectDataTaskInput {
  dataSourceId: string;        // UUID of data source (credentials stored in vault)
  filters?: {
    databases?: string[];      // Filter to specific databases
    schemas?: string[];        // Filter to specific schemas
    tables?: string[];         // Filter to specific tables
  };
}
```

**Output Schema:**
```typescript
interface IntrospectDataTaskOutput {
  success: boolean;
  dataSourceId: string;
  tablesFound: number;
  subTasksTriggered: number;
  error?: string;
}
```

**Example Usage:**
```typescript
import { introspectDataTask } from './tasks/introspectData';

const result = await introspectDataTask.trigger({
  dataSourceId: "550e8400-e29b-41d4-a716-446655440000",
  filters: {
    databases: ['ANALYTICS_DB'],
    schemas: ['PUBLIC', 'STAGING']
  }
});
```

### sampleTableTask

Sub-task that samples individual tables using dialect-specific sampling methods.

**Input Schema:**
```typescript
interface SampleTableTaskInput {
  dataSourceId: string;
  table: {
    name: string;
    schema: string;
    database: string;
    rowCount: number;
    sizeBytes?: number;
    type: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE';
  };
  sampleSize: number;
}
```

**Output Schema:**
```typescript
interface SampleTableTaskOutput {
  success: boolean;
  tableId: string;
  sampleSize: number;
  actualSamples: number;
  samplingMethod: string;
  error?: string;
}
```

## Key Features

### Dynamic Sample Sizing
The system automatically determines optimal sample sizes based on table size:
- ≤100K rows: Sample all rows
- ≤1M rows: Sample 100K rows
- ≤10M rows: Sample 250K rows
- >10M rows: Sample 500K rows (max)

### Dialect-Specific Sampling
Each database type uses its most efficient sampling method:
- **Snowflake**: `SAMPLE(n ROWS)` or `TABLESAMPLE BERNOULLI`
- **PostgreSQL**: `TABLESAMPLE SYSTEM` or `TABLESAMPLE BERNOULLI`
- **MySQL**: Optimized `ORDER BY RAND()` with pre-filtering
- **BigQuery**: `TABLESAMPLE SYSTEM`
- **Redshift**: `ORDER BY RANDOM()`
- **SQL Server**: `TABLESAMPLE` or `ORDER BY NEWID()`

### Error Handling
- Automatic fallback strategies when primary sampling methods fail
- Connection cleanup in all scenarios
- Detailed error logging for debugging

### Performance
- **Main Task**: 5-minute max duration
- **Sub-Tasks**: 2-minute max duration per table
- Parallel sub-task execution for efficiency
- No database writes (read-only operations)

## Architecture

The system uses a functional factory pattern:
```
factory.ts
  ├─ createStructuralMetadataFetcher(dialect)
  └─ createTableSampler(dialect)
      ├─ dialects/snowflake/
      ├─ dialects/postgresql/
      ├─ dialects/mysql/
      ├─ dialects/bigquery/
      ├─ dialects/redshift/
      └─ dialects/sqlserver/
```

## Future Enhancements

The current implementation includes TODO markers for:
- Statistical analysis of sampled data
- Column-level statistics calculation
- Data quality metrics generation
- Pattern detection and data profiling

## Supported Databases

All major data warehouses and databases are supported:
- Snowflake
- PostgreSQL
- MySQL
- BigQuery
- Redshift
- SQL Server

## Logging

Both tasks provide detailed logging:
- Connection status
- Metadata fetching progress
- Sampling methods used
- Error details with context

Check the Trigger.dev dashboard for detailed execution logs.