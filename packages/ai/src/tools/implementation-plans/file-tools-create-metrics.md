# Create Metrics Tool Implementation Plan

## Overview

Migrate the Rust `create_metrics.rs` to TypeScript using Mastra framework. This tool creates metric files (charts/visualizations) from user specifications.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/file_tools/create_metrics.rs`
- **Purpose**: Create metric files that define data visualizations and charts
- **Input**: Metric specifications (title, type, datasets, configuration)
- **Output**: Created metric file with metadata
- **Key Features**:
  - Multiple chart types (bar, line, number card, etc.)
  - Dataset integration and validation
  - Metric file persistence to database
  - SQL query generation and validation
  - Chart configuration management

## Dependencies
- @database for data persistence
- @data-source for database connectivity
- @rerank for data optimization
- @stored-values for dynamic parameters
- @ai-sdk/openai for intelligent chart suggestions
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Workflow-based
**Wave**: 3
**AI Agent Time**: 4 minutes
**Depends on**: search-data-catalog, dataset validation

## TypeScript Implementation

### Tool Definition

```typescript
export const createMetricsTool = createTool({
  id: 'create-metrics',
  description: 'Create metric files (charts/visualizations) from specifications',
  inputSchema: z.object({
    metrics: z.array(z.object({
      title: z.string().describe('Title of the metric/chart'),
      type: z.enum(['bar', 'line', 'number', 'table', 'pie', 'scatter', 'combo'])
        .describe('Type of chart to create'),
      datasets: z.array(z.string()).describe('Dataset IDs to use for the metric'),
      config: z.object({
        x_axis: z.string().optional().describe('X-axis field'),
        y_axis: z.string().optional().describe('Y-axis field'),
        group_by: z.string().optional().describe('Grouping field'),
        aggregate: z.enum(['sum', 'count', 'avg', 'min', 'max']).optional(),
        filters: z.array(z.object({
          field: z.string(),
          operator: z.enum(['=', '!=', '>', '<', '>=', '<=', 'in', 'not in']),
          value: z.union([z.string(), z.number(), z.array(z.string())])
        })).optional(),
        sort: z.object({
          field: z.string(),
          direction: z.enum(['asc', 'desc'])
        }).optional(),
        limit: z.number().optional()
      }).describe('Chart configuration options')
    }))
  }),
  outputSchema: z.object({
    success: z.boolean(),
    created_metrics: z.array(z.object({
      id: z.string().uuid(),
      title: z.string(),
      type: z.string(),
      status: z.enum(['created', 'error']),
      error_message: z.string().optional()
    })),
    total_created: z.number()
  }),
  execute: async ({ context }) => {
    return await createMetrics(context);
  },
});
```

### Dependencies Required

```typescript
import { db } from '@database';
import { metricFiles, datasets } from '@database/schema';
import { DataSourceAdapter, DataSourceFactory } from '@data-source';
import { eq, inArray, and } from 'drizzle-orm';
import { generateSQLQuery } from '@query-engine';
import { wrapTraced } from 'braintrust';
import { v4 as uuidv4 } from 'uuid';
```

### Core Implementation

```typescript
interface MetricSpec {
  title: string;
  type: ChartType;
  datasets: string[];
  config: MetricConfig;
}

interface MetricConfig {
  x_axis?: string;
  y_axis?: string;
  group_by?: string;
  aggregate?: AggregateType;
  filters?: FilterSpec[];
  sort?: SortSpec;
  limit?: number;
}

type ChartType = 'bar' | 'line' | 'number' | 'table' | 'pie' | 'scatter' | 'combo';

const createMetrics = wrapTraced(
  async (params: { metrics: MetricSpec[] }) => {
    const { metrics } = params;
    const results = [];
    let successCount = 0;
    
    // Get user context
    const userId = agent.getUserId();
    const organizationId = agent.getOrganizationId();
    
    for (const metric of metrics) {
      try {
        const createdMetric = await createSingleMetric(metric, userId, organizationId);
        results.push({
          id: createdMetric.id,
          title: createdMetric.title,
          type: createdMetric.type,
          status: 'created' as const
        });
        successCount++;
      } catch (error) {
        results.push({
          id: uuidv4(),
          title: metric.title,
          type: metric.type,
          status: 'error' as const,
          error_message: error.message
        });
      }
    }
    
    return {
      success: successCount > 0,
      created_metrics: results,
      total_created: successCount
    };
  },
  { name: 'create-metrics' }
);

async function createSingleMetric(
  metric: MetricSpec,
  userId: string,
  organizationId: string
) {
  // 1. Validate datasets exist and user has access
  const accessibleDatasets = await validateDatasetAccess(metric.datasets, userId);
  
  if (accessibleDatasets.length === 0) {
    throw new Error(`No accessible datasets found for metric: ${metric.title}`);
  }
  
  // 2. Generate and validate SQL query
  const sqlQuery = await generateMetricSQL(metric, accessibleDatasets);
  
  // 3. Test query execution
  await validateSQLQuery(sqlQuery, accessibleDatasets[0].data_source_id);
  
  // 4. Create metric file in database
  const metricId = uuidv4();
  const metricFile = {
    id: metricId,
    title: metric.title,
    type: metric.type,
    config: JSON.stringify(metric.config),
    sql_query: sqlQuery,
    datasets: metric.datasets,
    created_by: userId,
    organization_id: organizationId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  await db.insert(metricFiles).values(metricFile);
  
  return {
    id: metricId,
    title: metric.title,
    type: metric.type,
    sql_query: sqlQuery
  };
}
```

### Dataset Validation

```typescript
async function validateDatasetAccess(
  datasetIds: string[],
  userId: string
): Promise<Dataset[]> {
  // Query datasets with permission check
  const userDatasets = await db
    .select({
      id: datasets.id,
      name: datasets.name,
      data_source_id: datasets.dataSourceId,
      yml_content: datasets.ymlContent
    })
    .from(datasets)
    .innerJoin(assetPermissions, eq(assetPermissions.assetId, datasets.id))
    .where(
      and(
        inArray(datasets.id, datasetIds),
        eq(assetPermissions.userId, userId),
        eq(assetPermissions.assetType, 'dataset')
      )
    );
    
  if (userDatasets.length !== datasetIds.length) {
    const missingIds = datasetIds.filter(id => 
      !userDatasets.find(d => d.id === id)
    );
    throw new Error(`User does not have access to datasets: ${missingIds.join(', ')}`);
  }
  
  return userDatasets;
}
```

### SQL Query Generation

```typescript
async function generateMetricSQL(
  metric: MetricSpec,
  datasets: Dataset[]
): Promise<string> {
  // Use the query engine to generate SQL based on metric config
  const queryBuilder = new QueryBuilder(datasets);
  
  // Build SELECT clause
  if (metric.config.x_axis) {
    queryBuilder.select(metric.config.x_axis);
  }
  
  if (metric.config.y_axis) {
    if (metric.config.aggregate) {
      queryBuilder.select(`${metric.config.aggregate}(${metric.config.y_axis}) as value`);
    } else {
      queryBuilder.select(metric.config.y_axis);
    }
  }
  
  if (metric.config.group_by) {
    queryBuilder.groupBy(metric.config.group_by);
  }
  
  // Add filters
  if (metric.config.filters) {
    for (const filter of metric.config.filters) {
      queryBuilder.where(filter.field, filter.operator, filter.value);
    }
  }
  
  // Add sorting
  if (metric.config.sort) {
    queryBuilder.orderBy(metric.config.sort.field, metric.config.sort.direction);
  }
  
  // Add limit
  if (metric.config.limit) {
    queryBuilder.limit(metric.config.limit);
  }
  
  return queryBuilder.toSQL();
}

class QueryBuilder {
  private selectFields: string[] = [];
  private fromTables: string[] = [];
  private whereConditions: string[] = [];
  private groupByFields: string[] = [];
  private orderByFields: string[] = [];
  private limitValue?: number;
  
  constructor(private datasets: Dataset[]) {
    // Extract table names from datasets
    this.fromTables = datasets.map(d => this.getTableName(d));
  }
  
  select(field: string): this {
    this.selectFields.push(field);
    return this;
  }
  
  where(field: string, operator: string, value: any): this {
    let condition: string;
    
    switch (operator) {
      case '=':
        condition = `${field} = '${value}'`;
        break;
      case '!=':
        condition = `${field} != '${value}'`;
        break;
      case '>':
        condition = `${field} > ${value}`;
        break;
      case '<':
        condition = `${field} < ${value}`;
        break;
      case 'in':
        const values = Array.isArray(value) ? value : [value];
        condition = `${field} IN (${values.map(v => `'${v}'`).join(', ')})`;
        break;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
    
    this.whereConditions.push(condition);
    return this;
  }
  
  groupBy(field: string): this {
    this.groupByFields.push(field);
    return this;
  }
  
  orderBy(field: string, direction: 'asc' | 'desc'): this {
    this.orderByFields.push(`${field} ${direction.toUpperCase()}`);
    return this;
  }
  
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }
  
  toSQL(): string {
    let sql = `SELECT ${this.selectFields.join(', ')}`;
    sql += ` FROM ${this.fromTables.join(', ')}`;
    
    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }
    
    if (this.groupByFields.length > 0) {
      sql += ` GROUP BY ${this.groupByFields.join(', ')}`;
    }
    
    if (this.orderByFields.length > 0) {
      sql += ` ORDER BY ${this.orderByFields.join(', ')}`;
    }
    
    if (this.limitValue) {
      sql += ` LIMIT ${this.limitValue}`;
    }
    
    return sql;
  }
  
  private getTableName(dataset: Dataset): string {
    // Extract table name from dataset YML or use dataset name
    try {
      const yml = yaml.parse(dataset.yml_content || '');
      return yml.table || yml.name || dataset.name;
    } catch {
      return dataset.name;
    }
  }
}
```

### SQL Query Validation

```typescript
async function validateSQLQuery(sql: string, dataSourceId: string): Promise<void> {
  try {
    // Get data source adapter
    const dataSource = await getDataSource(dataSourceId);
    const adapter = DataSourceFactory.createAdapter(dataSource);
    
    // Test query with LIMIT 1 to validate syntax
    const testSQL = `${sql} LIMIT 1`;
    await adapter.executeQuery(testSQL);
    
  } catch (error) {
    throw new Error(`Invalid SQL query: ${error.message}`);
  }
}

async function getDataSource(dataSourceId: string) {
  const result = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.id, dataSourceId))
    .limit(1);
    
  if (result.length === 0) {
    throw new Error(`Data source not found: ${dataSourceId}`);
  }
  
  return result[0];
}
```

## Test Strategy

### Unit Tests (`create-metrics.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- SQL query generation validation
- Dataset access verification
- Chart type configuration
- Aggregation logic testing

### Integration Tests (`create-metrics.integration.test.ts`)
- Real database/filesystem/API integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Complex query generation
- Multi-dataset metric creation

## Implementation Dependencies

### New TypeScript Packages

```json
{
  "dependencies": {
    "uuid": "^9.0.0",
    "yaml": "^2.3.4"
  }
}
```

### Missing from TypeScript

1. **Query Engine**: Need TypeScript equivalent of SQL generation logic
2. **Data Source Adapters**: Full integration with data-source package
3. **Permission System**: Asset permission validation
4. **Chart Configuration**: Validation and type definitions

## AI Agent Implementation Time

**Estimated Time**: 4 minutes
**Complexity**: High

## Implementation Priority

**Very High** - Core functionality for creating visualizations and analytics.

## Notes

- SQL generation logic is critical and needs thorough testing
- Chart type validation should be extensible for new chart types
- Consider adding chart preview/validation before saving
- Error handling for different data source types is important
- Should integrate with dashboard creation for organizing metrics
- Configuration schema should be well-documented
- Consider adding metric templates for common patterns