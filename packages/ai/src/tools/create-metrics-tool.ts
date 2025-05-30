import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

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

interface FilterSpec {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not in';
  value: string | number | string[];
}

interface SortSpec {
  field: string;
  direction: 'asc' | 'desc';
}

interface Dataset {
  id: string;
  name?: string;
  data_source_id?: string;
  yml_content?: string;
}

type ChartType = 'bar' | 'line' | 'number' | 'table' | 'pie' | 'scatter' | 'combo';
type AggregateType = 'sum' | 'count' | 'avg' | 'min' | 'max';

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
      id: z.string(),
      title: z.string(),
      type: z.string(),
      status: z.enum(['created', 'error']),
      error_message: z.string().optional()
    })),
    total_created: z.number()
  }),
  execute: async ({ context }) => {
    return await createMetrics(context as { metrics: MetricSpec[] });
  },
});

const createMetrics = wrapTraced(
  async (params: { metrics: MetricSpec[] }) => {
    const { metrics } = params;
    const results = [];
    let successCount = 0;
    
    for (const metric of metrics) {
      try {
        const createdMetric = await createSingleMetric(metric);
        results.push({
          id: createdMetric.id,
          title: createdMetric.title,
          type: createdMetric.type,
          status: 'created' as const
        });
        successCount++;
      } catch (error) {
        results.push({
          id: generateId(),
          title: metric.title,
          type: metric.type,
          status: 'error' as const,
          error_message: error instanceof Error ? error.message : String(error)
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

async function createSingleMetric(metric: MetricSpec) {
  // 1. Validate datasets exist and simulate access check
  const accessibleDatasets = await validateDatasetAccess(metric.datasets);
  
  if (accessibleDatasets.length === 0) {
    throw new Error(`No accessible datasets found for metric: ${metric.title}`);
  }
  
  // 2. Generate and validate SQL query
  const sqlQuery = await generateMetricSQL(metric, accessibleDatasets);
  
  // 3. Test query syntax (simplified validation)
  await validateSQLQuery(sqlQuery, accessibleDatasets[0].data_source_id);
  
  // 4. Create metric file (simulated - in real implementation would save to database)
  const metricId = generateId();
  const metricFile = {
    id: metricId,
    title: metric.title,
    type: metric.type,
    config: JSON.stringify(metric.config),
    sql_query: sqlQuery,
    datasets: metric.datasets,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Simulate saving to database
  console.log('Created metric:', metricFile);
  
  return {
    id: metricId,
    title: metric.title,
    type: metric.type,
    sql_query: sqlQuery
  };
}

async function validateDatasetAccess(datasetIds: string[]): Promise<Dataset[]> {
  // Simulate dataset access validation - in real implementation would query database
  const simulatedDatasets: Dataset[] = [
    {
      id: 'dataset-1',
      name: 'Customer Analytics',
      data_source_id: 'postgres-1',
      yml_content: `
name: Customer Analytics
tables:
  - name: customers
    columns:
      - name: customer_id
        type: string
      - name: age
        type: integer
      - name: location
        type: string
`
    },
    {
      id: 'dataset-2',
      name: 'Sales Performance',
      data_source_id: 'postgres-1',
      yml_content: `
name: Sales Performance
tables:
  - name: sales
    columns:
      - name: sale_id
        type: string
      - name: amount
        type: decimal
      - name: date
        type: timestamp
      - name: product_id
        type: string
`
    }
  ];
  
  const foundDatasets = simulatedDatasets.filter(ds => datasetIds.includes(ds.id));
  
  if (foundDatasets.length !== datasetIds.length) {
    const missingIds = datasetIds.filter(id => !foundDatasets.find(d => d.id === id));
    throw new Error(`User does not have access to datasets: ${missingIds.join(', ')}`);
  }
  
  return foundDatasets;
}

async function generateMetricSQL(
  metric: MetricSpec,
  datasets: Dataset[]
): Promise<string> {
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
      case '>=':
        condition = `${field} >= ${value}`;
        break;
      case '<=':
        condition = `${field} <= ${value}`;
        break;
      case 'in':
        const values = Array.isArray(value) ? value : [value];
        condition = `${field} IN (${values.map(v => `'${v}'`).join(', ')})`;
        break;
      case 'not in':
        const notValues = Array.isArray(value) ? value : [value];
        condition = `${field} NOT IN (${notValues.map(v => `'${v}'`).join(', ')})`;
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
    if (this.selectFields.length === 0) {
      throw new Error('No SELECT fields specified');
    }
    
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
      const yml = dataset.yml_content || '';
      
      // Simple YAML parsing for table name
      const tableMatch = yml.match(/name:\s*([^\n]+)/);
      if (tableMatch) {
        return tableMatch[1].trim();
      }
      
      // Look for tables section
      const tablesMatch = yml.match(/tables:\s*\n\s*-\s*name:\s*([^\n]+)/);
      if (tablesMatch) {
        return tablesMatch[1].trim();
      }
      
      return dataset.name || 'unknown_table';
    } catch {
      return dataset.name || 'unknown_table';
    }
  }
}

async function validateSQLQuery(sql: string, dataSourceId?: string): Promise<void> {
  // Basic SQL syntax validation
  if (!sql.trim()) {
    throw new Error('SQL query cannot be empty');
  }
  
  if (!sql.toLowerCase().includes('select')) {
    throw new Error('SQL query must contain SELECT statement');
  }
  
  if (!sql.toLowerCase().includes('from')) {
    throw new Error('SQL query must contain FROM clause');
  }
  
  // Check for dangerous SQL patterns
  const dangerousPatterns = [
    /drop\s+table/i,
    /delete\s+from/i,
    /update\s+\w+\s+set/i,
    /insert\s+into/i,
    /truncate\s+table/i,
    /alter\s+table/i,
    /create\s+table/i,
    /exec\s*\(/i,
    /execute\s*\(/i,
    /;\s*(drop|delete|update|insert|truncate|alter|create)/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      throw new Error(`SQL query contains dangerous pattern: ${pattern.source}`);
    }
  }
  
  console.log(`SQL query validated for data source: ${dataSourceId}`);
  console.log(`Query: ${sql}`);
}

function generateId(): string {
  return 'metric_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}