# Table Statistics and Introspection Documentation

## Overview

This module provides comprehensive statistical analysis of database tables using DuckDB in-memory processing on sampled data. The system uses a multi-phase approach:

1. **Main Task (`introspectDataTask`)**: Fetches structural metadata (tables, row counts) 
2. **Statistics Task (`getTableStatisticsTask`)**: Performs comprehensive statistical analysis on sampled data

All metrics are designed to be sample-robust, using proportional and statistical measures rather than absolute counts.

## Table of Contents
- [Sampling Strategy](#sampling-strategy)
- [Column Statistics](#column-statistics)
  - [Basic Statistics](#basic-statistics)
  - [Distribution Metrics](#distribution-metrics)
  - [Numeric Statistics](#numeric-statistics)
  - [Sample Values](#sample-values)
  - [Classification Detection](#classification-detection)
- [Task Documentation](#task-documentation)
  - [introspectDataTask](#introspectdatatask)
  - [getTableStatisticsTask](#gettablestatisticstask)

---

## Sampling Strategy

The system uses dynamic sampling based on table size to balance performance and accuracy:

| Table Size | Sample Size | Description |
|------------|-------------|-------------|
| ≤ 100K rows | All rows | Small tables: full scan |
| ≤ 1M rows | 100K rows | Medium tables: 10% sample |
| ≤ 10M rows | 250K rows | Large tables: 2.5% sample |
| > 10M rows | 500K rows | XL tables: capped sample |

### Dialect-Specific Sampling Methods
Each database type uses its most efficient sampling method:
- **Snowflake**: `SAMPLE(n ROWS)` or `TABLESAMPLE BERNOULLI`
- **PostgreSQL**: `TABLESAMPLE SYSTEM` or `TABLESAMPLE BERNOULLI`
- **MySQL**: Optimized `ORDER BY RAND()` with pre-filtering
- **BigQuery**: `TABLESAMPLE SYSTEM`
- **Redshift**: `ORDER BY RANDOM()`
- **SQL Server**: `TABLESAMPLE` or `ORDER BY NEWID()`

---

## Column Statistics

### Basic Statistics

#### `nullRate`
- **Type**: `number` (0-1)
- **Description**: Percentage of NULL values in the column
- **What it tells you**: 
  - Data completeness and quality
  - Whether a field is required or optional
  - Potential data collection issues
- **Example**: `0.15` means 15% of values are NULL

#### `distinctCount`
- **Type**: `number`
- **Description**: Count of unique values in the sampled data
- **What it tells you**:
  - Column cardinality
  - Whether it's an identifier, category, or free text
  - Potential for indexing or categorization
- **Example**: `5` indicates only 5 unique values (likely a category)

#### `uniquenessRatio`
- **Type**: `number` (0-1)
- **Description**: Ratio of distinct values to total rows (distinctCount/totalRows)
- **What it tells you**:
  - Near 1.0: Likely an identifier or primary key
  - Near 0: Highly repetitive data or category
  - 0.01-0.1: Moderate cardinality, possible enum or status field
- **Example**: `0.98` suggests this is likely a unique identifier

#### `emptyStringRate`
- **Type**: `number` (0-1)
- **Description**: Percentage of empty strings ('') as opposed to NULLs
- **What it tells you**:
  - Data quality issues (empty vs NULL handling)
  - Application behavior (some systems use '' instead of NULL)
  - Potential for data cleanup
- **Example**: `0.05` means 5% are empty strings (not NULL)

---

### Distribution Metrics

#### `topValues`
- **Type**: `Array<{value: any, percentage: number, rank: number}>`
- **Description**: Top 10-20 most frequent values with their percentages
- **What it tells you**:
  - Data skew and common patterns
  - Default values or common categories
  - Whether data follows 80-20 rule
- **Example**: 
  ```json
  [
    {"value": "active", "percentage": 65.2, "rank": 1},
    {"value": "inactive", "percentage": 30.1, "rank": 2},
    {"value": "pending", "percentage": 4.7, "rank": 3}
  ]
  ```

#### `entropy`
- **Type**: `number`
- **Description**: Shannon entropy measuring randomness/information content
- **What it tells you**:
  - High entropy (>10): Random data like IDs, hashes, passwords
  - Low entropy (<3): Predictable data like categories or enums
  - Medium entropy (3-10): Semi-structured data
- **Example**: `16.2` indicates high randomness (likely an ID field)

#### `giniCoefficient`
- **Type**: `number` (0-1)
- **Description**: Measures inequality in value distribution
- **What it tells you**:
  - 0: Perfect equality (all values equally frequent)
  - Near 1: High inequality (few values dominate)
  - 0.7-0.9: Typical for power-law distributions
- **Example**: `0.85` means a few values account for most occurrences

---

### Numeric Statistics

These statistics only appear for numeric columns in the `numericStats` field.

#### `mean`
- **Type**: `number`
- **Description**: Average value
- **What it tells you**: Central tendency of the data

#### `median`
- **Type**: `number`
- **Description**: Middle value when sorted
- **What it tells you**: Central value unaffected by outliers

#### `stdDev`
- **Type**: `number`
- **Description**: Standard deviation
- **What it tells you**: Data spread and variability

#### `skewness`
- **Type**: `number`
- **Description**: Measure of distribution asymmetry
- **What it tells you**:
  - 0: Symmetric distribution
  - Positive: Long tail to the right (common for prices, income)
  - Negative: Long tail to the left
- **Example**: `2.3` indicates right-skewed data

#### `percentiles`
- **Type**: `{p25, p50, p75, p95, p99}`
- **Description**: Distribution quartiles and extremes
- **What it tells you**:
  - Data distribution shape
  - Outlier boundaries (p95, p99)
  - Interquartile range (p25-p75)

#### `outlierRate`
- **Type**: `number` (0-1)
- **Description**: Percentage of values beyond 3 standard deviations
- **What it tells you**:
  - Data quality issues
  - Presence of anomalies
  - Need for data cleaning
- **Example**: `0.02` means 2% of values are statistical outliers

---

### Sample Values

#### `sampleValues`
- **Type**: `any[]`
- **Description**: Representative sample of actual column values
- **Rules**:
  - Standard columns: Up to 50 distinct values
  - Long text: 10 samples, truncated to 150 characters
  - JSON/Complex: 3 examples, simplified structure
- **What it tells you**:
  - Concrete examples of the data
  - Data format and patterns
  - Validation requirements

---


---

## Task Documentation

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

### getTableStatisticsTask

Sub-task that performs comprehensive statistical analysis on individual tables.

**Input Schema:**
```typescript
interface GetTableStatisticsInput {
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
interface GetTableStatisticsOutput {
  success: boolean;
  tableId: string;
  sampleSize: number;
  actualSamples: number;
  samplingMethod: string;
  columnProfiles: ColumnProfile[];
  error?: string;
}
```

**Example Usage:**
```typescript
const result = await getTableStatisticsTask.trigger({
  dataSourceId: 'abc-123',
  table: {
    name: 'customers',
    schema: 'public',
    database: 'mydb',
    rowCount: 50000,
    type: 'TABLE'
  },
  sampleSize: 10000
});

// Access statistics
const customerIdStats = result.columnProfiles.find(
  col => col.columnName === 'customer_id'
);

if (customerIdStats?.uniquenessRatio > 0.95) {
  console.log('Customer ID appears to be an identifier field');
  console.log(`Uniqueness: ${customerIdStats.uniquenessRatio}`);
  console.log(`Null rate: ${customerIdStats.nullRate}`);
}
```

---

## Interpreting Results

### High-Quality Data Indicators
- Low `nullRate` (< 0.05) for important fields
- Low `emptyStringRate` (< 0.01)
- Consistent patterns in `sampleValues`
- Low `outlierRate` for numeric fields

### Data Issues to Watch For
- High `nullRate` in expected required fields
- Mixed use of empty strings and NULLs
- Very high `entropy` in fields that should be structured
- High `outlierRate` indicating data quality issues
- `giniCoefficient` near 1 showing extreme skew

### Optimization Opportunities
- Low cardinality fields (low `distinctCount`) can use database enums
- High `uniquenessRatio` fields are good index candidates
- Strong correlations indicate potential denormalization
- Low cardinality fields can use compression

---

## Architecture

The system uses a functional factory pattern with specialized analyzers:

```
get-table-statistics-task.ts
  ├─ statistics/
      ├─ duckdb-manager.ts      # DuckDB connection management
      ├─ basic-stats.ts         # Basic statistics computation
      ├─ distribution.ts        # Distribution metrics
      ├─ numeric-stats.ts       # Numeric-specific statistics
      ├─ classification.ts      # Column classification detection
      └─ sample-values.ts       # Sample value extraction
```

### Statistical Analyzers

Each analyzer is responsible for computing specific metrics:

1. **BasicStatsAnalyzer**: Null rates, distinct counts, uniqueness
2. **DistributionAnalyzer**: Top values, entropy, Gini coefficient
3. **NumericStatsAnalyzer**: Mean, median, percentiles, outliers
4. **ClassificationAnalyzer**: Enum detection, identifier detection
5. **SampleValuesExtractor**: Representative value samples

---

## Performance Considerations

- **Memory**: 4 GB minimum (handles 95% of cases)
- **CPU**: 2 vCPUs minimum
- **Disk**: 5 GB temporary storage
- **Typical Performance**: 5-15 seconds per table
- All metrics computed using efficient SQL in DuckDB
- Parallel computation of independent statistics
- Graceful degradation if some metrics fail

### Error Handling
- Automatic fallback strategies when primary sampling methods fail
- Connection cleanup in all scenarios
- Detailed error logging for debugging
- Partial results returned if some computations fail

### Task Limits
- **Main Task**: 5-minute max duration
- **Statistics Task**: 2-minute max duration per table
- Parallel sub-task execution for efficiency
- No database writes (read-only operations)

---

## Supported Databases

All major data warehouses and databases are supported:
- Snowflake
- PostgreSQL  
- MySQL
- BigQuery
- Redshift
- SQL Server
- Databricks

---

## Logging

Both tasks provide detailed logging:
- Connection status
- Metadata fetching progress
- Sampling methods used
- Statistical analysis progress
- Error details with context

Check the Trigger.dev dashboard for detailed execution logs.