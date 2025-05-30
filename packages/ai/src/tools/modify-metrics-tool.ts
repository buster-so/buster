import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface MetricModification {
  metric_id: string;
  title?: string;
  type?: ChartType;
  config_updates?: ConfigUpdate;
  style_updates?: StyleUpdate;
  datasets?: string[];
}

interface ConfigUpdate {
  x_axis?: string;
  y_axis?: string;
  group_by?: string;
  aggregate?: AggregateType;
  filters?: FilterSpec[];
  sort?: SortSpec;
  limit?: number;
}

interface StyleUpdate {
  color_scheme?: string;
  show_legend?: boolean;
  show_labels?: boolean;
  axis_labels?: {
    x?: string;
    y?: string;
  };
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

type ChartType = 'bar' | 'line' | 'number' | 'table' | 'pie' | 'scatter' | 'combo';
type AggregateType = 'sum' | 'count' | 'avg' | 'min' | 'max';

export const modifyMetricsTool = createTool({
  id: 'modify-metrics',
  description: 'Modify existing metric configurations and visualizations',
  inputSchema: z.object({
    modifications: z.array(z.object({
      metric_id: z.string().describe('ID of metric to modify'),
      title: z.string().optional().describe('New title'),
      type: z.enum(['bar', 'line', 'number', 'table', 'pie', 'scatter', 'combo']).optional(),
      config_updates: z.object({
        x_axis: z.string().optional(),
        y_axis: z.string().optional(),
        group_by: z.string().optional(),
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
      }).optional(),
      style_updates: z.object({
        color_scheme: z.string().optional(),
        show_legend: z.boolean().optional(),
        show_labels: z.boolean().optional(),
        axis_labels: z.object({
          x: z.string().optional(),
          y: z.string().optional()
        }).optional()
      }).optional(),
      datasets: z.array(z.string()).optional().describe('Update datasets if needed')
    }))
  }),
  outputSchema: z.object({
    success: z.boolean(),
    modified_metrics: z.array(z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(['modified', 'error']),
      changes_applied: z.array(z.string()),
      error_message: z.string().optional()
    })),
    total_modified: z.number()
  }),
  execute: async ({ context }) => {
    return await modifyMetrics(context as { modifications: MetricModification[] });
  },
});

const modifyMetrics = wrapTraced(
  async (params: { modifications: MetricModification[] }) => {
    const { modifications } = params;
    const results = [];
    let successCount = 0;
    
    for (const modification of modifications) {
      try {
        const result = await modifySingleMetric(modification);
        results.push({
          id: modification.metric_id,
          title: result.title,
          status: 'modified' as const,
          changes_applied: result.changes_applied
        });
        successCount++;
      } catch (error) {
        const metric = await getMetricTitle(modification.metric_id);
        results.push({
          id: modification.metric_id,
          title: metric?.title || 'Unknown',
          status: 'error' as const,
          changes_applied: [],
          error_message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return {
      success: successCount > 0,
      modified_metrics: results,
      total_modified: successCount
    };
  },
  { name: 'modify-metrics' }
);

async function modifySingleMetric(modification: MetricModification) {
  // 1. Validate metric exists and user has edit access
  const metric = await validateMetricEditAccess(modification.metric_id);
  
  // 2. Create backup/version before modification
  await createMetricVersion(metric);
  
  const changesApplied: string[] = [];
  let needsSqlRegeneration = false;
  
  // 3. Apply title change
  if (modification.title && modification.title !== metric.title) {
    metric.title = modification.title;
    changesApplied.push('Updated title');
  }
  
  // 4. Apply type change
  if (modification.type && modification.type !== metric.type) {
    metric.type = modification.type;
    changesApplied.push(`Changed type to ${modification.type}`);
    needsSqlRegeneration = true;
  }
  
  // 5. Apply config updates
  if (modification.config_updates) {
    const configChanges = applyConfigUpdates(
      metric.config,
      modification.config_updates
    );
    metric.config = configChanges.config;
    changesApplied.push(...configChanges.changes);
    needsSqlRegeneration = needsSqlRegeneration || configChanges.requiresSql;
  }
  
  // 6. Apply style updates
  if (modification.style_updates) {
    const styleChanges = applyStyleUpdates(
      metric.style || {},
      modification.style_updates
    );
    metric.style = styleChanges.style;
    changesApplied.push(...styleChanges.changes);
  }
  
  // 7. Update datasets if provided
  if (modification.datasets) {
    await validateDatasetAccess(modification.datasets);
    metric.datasets = modification.datasets;
    changesApplied.push('Updated datasets');
    needsSqlRegeneration = true;
  }
  
  // 8. Regenerate SQL if needed
  if (needsSqlRegeneration) {
    const newSql = await regenerateMetricSQL(metric);
    await validateSQLQuery(newSql, metric.data_source_id);
    metric.sql_query = newSql;
    changesApplied.push('Regenerated SQL query');
  }
  
  // 9. Save changes (simulated - in real implementation would save to database)
  metric.updated_at = new Date().toISOString();
  console.log('Modified metric:', {
    id: modification.metric_id,
    title: metric.title,
    type: metric.type,
    config: metric.config,
    style: metric.style,
    sql_query: metric.sql_query,
    datasets: metric.datasets,
    updated_at: metric.updated_at
  });
  
  return {
    title: metric.title,
    changes_applied: changesApplied
  };
}

async function validateMetricEditAccess(metricId: string) {
  // Simulate metric access validation - in real implementation would query database
  const simulatedMetrics: Record<string, any> = {
    'metric_abc123_1': {
      id: 'metric_abc123_1',
      title: 'Sales by Month',
      type: 'bar',
      config: {
        x_axis: 'month',
        y_axis: 'sales_amount',
        aggregate: 'sum'
      },
      style: {
        color_scheme: 'blue',
        show_legend: true
      },
      datasets: ['dataset-1'],
      data_source_id: 'postgres-1',
      sql_query: 'SELECT month, SUM(sales_amount) as value FROM sales GROUP BY month'
    },
    'metric_def456_2': {
      id: 'metric_def456_2',
      title: 'Customer Count',
      type: 'number',
      config: {
        aggregate: 'count'
      },
      style: {},
      datasets: ['dataset-2'],
      data_source_id: 'postgres-1',
      sql_query: 'SELECT COUNT(*) as value FROM customers'
    }
  };
  
  const metric = simulatedMetrics[metricId];
  if (!metric) {
    throw new Error(`Metric not found or no access: ${metricId}`);
  }
  
  return metric;
}

async function getMetricTitle(metricId: string): Promise<{ title: string } | null> {
  try {
    const metric = await validateMetricEditAccess(metricId);
    return { title: metric.title };
  } catch {
    return null;
  }
}

function applyConfigUpdates(
  currentConfig: any,
  updates: ConfigUpdate
): { config: any; changes: string[]; requiresSql: boolean } {
  const config = { ...currentConfig };
  const changes: string[] = [];
  let requiresSql = false;
  
  if (updates.x_axis !== undefined && updates.x_axis !== config.x_axis) {
    config.x_axis = updates.x_axis;
    changes.push('Updated X-axis');
    requiresSql = true;
  }
  
  if (updates.y_axis !== undefined && updates.y_axis !== config.y_axis) {
    config.y_axis = updates.y_axis;
    changes.push('Updated Y-axis');
    requiresSql = true;
  }
  
  if (updates.group_by !== undefined) {
    config.group_by = updates.group_by;
    changes.push('Updated grouping');
    requiresSql = true;
  }
  
  if (updates.aggregate !== undefined) {
    config.aggregate = updates.aggregate;
    changes.push(`Changed aggregation to ${updates.aggregate}`);
    requiresSql = true;
  }
  
  if (updates.filters !== undefined) {
    config.filters = updates.filters;
    changes.push('Updated filters');
    requiresSql = true;
  }
  
  if (updates.sort !== undefined) {
    config.sort = updates.sort;
    changes.push('Updated sorting');
    requiresSql = true;
  }
  
  if (updates.limit !== undefined) {
    config.limit = updates.limit;
    changes.push(`Set limit to ${updates.limit}`);
    requiresSql = true;
  }
  
  return { config, changes, requiresSql };
}

function applyStyleUpdates(
  currentStyle: any,
  updates: StyleUpdate
): { style: any; changes: string[] } {
  const style = { ...currentStyle };
  const changes: string[] = [];
  
  if (updates.color_scheme !== undefined) {
    style.color_scheme = updates.color_scheme;
    changes.push('Updated color scheme');
  }
  
  if (updates.show_legend !== undefined) {
    style.show_legend = updates.show_legend;
    changes.push(`${updates.show_legend ? 'Enabled' : 'Disabled'} legend`);
  }
  
  if (updates.show_labels !== undefined) {
    style.show_labels = updates.show_labels;
    changes.push(`${updates.show_labels ? 'Enabled' : 'Disabled'} labels`);
  }
  
  if (updates.axis_labels) {
    style.axis_labels = style.axis_labels || {};
    if (updates.axis_labels.x !== undefined) {
      style.axis_labels.x = updates.axis_labels.x;
      changes.push('Updated X-axis label');
    }
    if (updates.axis_labels.y !== undefined) {
      style.axis_labels.y = updates.axis_labels.y;
      changes.push('Updated Y-axis label');
    }
  }
  
  return { style, changes };
}

async function createMetricVersion(metric: any): Promise<void> {
  // Simulate version creation
  const version = {
    id: generateId(),
    metric_file_id: metric.id,
    version_number: Date.now(), // Simplified versioning
    config: JSON.stringify(metric.config),
    style: JSON.stringify(metric.style),
    sql_query: metric.sql_query,
    created_at: new Date().toISOString()
  };
  
  console.log('Created metric version:', version);
}

async function regenerateMetricSQL(metric: any): Promise<string> {
  // Simulate SQL regeneration based on updated config
  const config = metric.config;
  const datasets = metric.datasets || [];
  
  let sql = 'SELECT ';
  
  // Build SELECT clause
  const selectParts = [];
  if (config.x_axis) {
    selectParts.push(config.x_axis);
  }
  if (config.y_axis) {
    if (config.aggregate) {
      selectParts.push(`${config.aggregate}(${config.y_axis}) as value`);
    } else {
      selectParts.push(config.y_axis);
    }
  }
  
  sql += selectParts.join(', ');
  sql += ` FROM ${datasets[0] || 'unknown_table'}`;
  
  // Add WHERE clause for filters
  if (config.filters && config.filters.length > 0) {
    const filterConditions = config.filters.map((filter: FilterSpec) => {
      if (filter.operator === 'in') {
        const values = Array.isArray(filter.value) ? filter.value : [filter.value];
        return `${filter.field} IN (${values.map(v => `'${v}'`).join(', ')})`;
      } else {
        return `${filter.field} ${filter.operator} '${filter.value}'`;
      }
    });
    sql += ` WHERE ${filterConditions.join(' AND ')}`;
  }
  
  // Add GROUP BY
  if (config.group_by) {
    sql += ` GROUP BY ${config.group_by}`;
  }
  
  // Add ORDER BY
  if (config.sort) {
    sql += ` ORDER BY ${config.sort.field} ${config.sort.direction.toUpperCase()}`;
  }
  
  // Add LIMIT
  if (config.limit) {
    sql += ` LIMIT ${config.limit}`;
  }
  
  return sql;
}

async function validateSQLQuery(sql: string, dataSourceId?: string): Promise<void> {
  // Basic SQL syntax validation
  if (!sql.trim()) {
    throw new Error('SQL query cannot be empty');
  }
  
  if (!sql.toLowerCase().includes('select')) {
    throw new Error('SQL query must contain SELECT statement');
  }
  
  console.log(`SQL query validated for data source: ${dataSourceId}`);
  console.log(`Query: ${sql}`);
}

async function validateDatasetAccess(datasetIds: string[]): Promise<void> {
  // Simulate dataset access validation
  const validDatasets = ['dataset-1', 'dataset-2', 'dataset-3'];
  const missingIds = datasetIds.filter(id => !validDatasets.includes(id));
  
  if (missingIds.length > 0) {
    throw new Error(`User does not have access to datasets: ${missingIds.join(', ')}`);
  }
  
  console.log(`Validated access to ${datasetIds.length} datasets`);
}

function generateId(): string {
  return 'version_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}