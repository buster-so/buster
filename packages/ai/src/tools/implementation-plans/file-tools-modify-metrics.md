# Modify Metrics Tool Implementation Plan

## Overview

Migrate the Rust `modify_metrics.rs` to TypeScript using Mastra framework. This tool modifies existing metric configurations and visualizations.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/file_tools/modify_metrics.rs`
- **Purpose**: Update existing metric files with new configurations
- **Input**: Metric modifications (filters, styling, data changes)
- **Output**: Updated metric status
- **Key Features**:
  - Configuration updates
  - SQL query modifications
  - Chart type changes
  - Version history
  - Validation of changes

## Dependencies
- @database for data persistence
- @data-source for database connectivity
- @rerank for data optimization
- @stored-values for dynamic parameters
- @ai-sdk/openai for intelligent modifications
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Agent-based
**Wave**: 2
**AI Agent Time**: 4 minutes
**Depends on**: create-metrics

## TypeScript Implementation

### Tool Definition

```typescript
export const modifyMetricsTool = createTool({
  id: 'modify-metrics',
  description: 'Modify existing metric configurations and visualizations',
  inputSchema: z.object({
    modifications: z.array(z.object({
      metric_id: z.string().uuid().describe('ID of metric to modify'),
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
      datasets: z.array(z.string().uuid()).optional().describe('Update datasets if needed')
    }))
  }),
  outputSchema: z.object({
    success: z.boolean(),
    modified_metrics: z.array(z.object({
      id: z.string().uuid(),
      title: z.string(),
      status: z.enum(['modified', 'error']),
      changes_applied: z.array(z.string()),
      error_message: z.string().optional()
    })),
    total_modified: z.number()
  }),
  execute: async ({ context }) => {
    return await modifyMetrics(context);
  },
});
```

### Core Implementation

```typescript
interface MetricModification {
  metric_id: string;
  title?: string;
  type?: ChartType;
  config_updates?: ConfigUpdate;
  style_updates?: StyleUpdate;
  datasets?: string[];
}

const modifyMetrics = wrapTraced(
  async (params: { modifications: MetricModification[] }) => {
    const { modifications } = params;
    const results = [];
    let successCount = 0;
    
    const userId = agent.getUserId();
    
    for (const modification of modifications) {
      try {
        const result = await modifySingleMetric(modification, userId);
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
          error_message: error.message
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

async function modifySingleMetric(
  modification: MetricModification,
  userId: string
) {
  // 1. Validate metric exists and user has edit access
  const metric = await validateMetricEditAccess(modification.metric_id, userId);
  
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
    await validateDatasetAccess(modification.datasets, userId);
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
  
  // 9. Save changes
  metric.updated_at = new Date().toISOString();
  await db
    .update(metricFiles)
    .set({
      title: metric.title,
      type: metric.type,
      config: JSON.stringify(metric.config),
      style: JSON.stringify(metric.style),
      sql_query: metric.sql_query,
      datasets: metric.datasets,
      updated_at: metric.updated_at
    })
    .where(eq(metricFiles.id, modification.metric_id));
  
  return {
    title: metric.title,
    changes_applied: changesApplied
  };
}

async function validateMetricEditAccess(metricId: string, userId: string) {
  const result = await db
    .select({
      metric: metricFiles,
      permission: assetPermissions
    })
    .from(metricFiles)
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, metricFiles.id),
        eq(assetPermissions.userId, userId),
        eq(assetPermissions.assetType, 'metric_file')
      )
    )
    .where(eq(metricFiles.id, metricId))
    .limit(1);
    
  if (result.length === 0) {
    throw new Error(`Metric not found or no access: ${metricId}`);
  }
  
  const { metric, permission } = result[0];
  
  if (!['owner', 'editor'].includes(permission.role)) {
    throw new Error(`Insufficient permissions to modify metric: ${metricId}`);
  }
  
  return {
    ...metric,
    config: JSON.parse(metric.config || '{}'),
    style: JSON.parse(metric.style || '{}')
  };
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
  // Get current version number
  const lastVersion = await db
    .select({ version: metricFileVersions.versionNumber })
    .from(metricFileVersions)
    .where(eq(metricFileVersions.metricFileId, metric.id))
    .orderBy(desc(metricFileVersions.versionNumber))
    .limit(1);
    
  const versionNumber = lastVersion[0]?.version || 0;
  
  await db.insert(metricFileVersions).values({
    id: uuidv4(),
    metric_file_id: metric.id,
    version_number: versionNumber + 1,
    config: metric.config,
    style: metric.style,
    sql_query: metric.sql_query,
    created_at: new Date().toISOString()
  });
}
```

## Test Strategy

### Unit Tests (`modify-metrics.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Configuration update logic
- SQL regeneration validation
- Version control functionality
- Style update processing

### Integration Tests (`modify-metrics.integration.test.ts`)
- Real database/filesystem/API integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Complex modification workflows
- Chart type conversion testing

## AI Agent Implementation Time

**Estimated Time**: 4 minutes
**Complexity**: Medium-High

## Implementation Priority

**High** - Essential for iterative metric development.