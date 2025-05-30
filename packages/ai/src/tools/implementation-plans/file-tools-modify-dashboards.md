# Modify Dashboards Tool Implementation Plan

## Overview

Migrate the Rust `modify_dashboards.rs` to TypeScript using Mastra framework. This tool updates existing dashboard configurations, layouts, and metrics.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/file_tools/modify_dashboards.rs`
- **Purpose**: Update dashboard configurations and organization
- **Input**: Dashboard modifications (layout, metrics, filters)
- **Output**: Updated dashboard status
- **Key Features**:
  - Layout reorganization
  - Metric addition/removal
  - Filter updates
  - Sharing settings
  - Version control

## Dependencies
- @database for data persistence
- @sharing for permission management
- @stored-values for dynamic content
- @ai-sdk/openai for intelligent layout optimization
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Agent-based
**Wave**: 3
**AI Agent Time**: 4 minutes
**Depends on**: create-dashboards, modify-metrics

## TypeScript Implementation

### Tool Definition

```typescript
export const modifyDashboardsTool = createTool({
  id: 'modify-dashboards',
  description: 'Modify existing dashboard configurations and layouts',
  inputSchema: z.object({
    modifications: z.array(z.object({
      dashboard_id: z.string().uuid().describe('ID of dashboard to modify'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      add_metrics: z.array(z.string().uuid()).optional().describe('Metrics to add'),
      remove_metrics: z.array(z.string().uuid()).optional().describe('Metrics to remove'),
      reorder_metrics: z.array(z.object({
        metric_id: z.string().uuid(),
        position: z.number()
      })).optional(),
      layout_updates: z.object({
        type: z.enum(['grid', 'flex', 'tabs']).optional(),
        columns: z.number().optional(),
        items: z.array(z.object({
          metric_id: z.string().uuid(),
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number()
        })).optional()
      }).optional(),
      filter_updates: z.object({
        add: z.array(z.object({
          field: z.string(),
          type: z.enum(['date_range', 'select', 'multi_select', 'search']),
          default_value: z.any().optional()
        })).optional(),
        remove: z.array(z.string()).optional(),
        update: z.array(z.object({
          field: z.string(),
          default_value: z.any()
        })).optional()
      }).optional(),
      sharing: z.enum(['private', 'team', 'organization', 'public']).optional(),
      refresh_interval: z.number().optional()
    }))
  }),
  outputSchema: z.object({
    success: z.boolean(),
    modified_dashboards: z.array(z.object({
      id: z.string().uuid(),
      title: z.string(),
      status: z.enum(['modified', 'error']),
      changes_applied: z.array(z.string()),
      error_message: z.string().optional()
    })),
    total_modified: z.number()
  }),
  execute: async ({ context }) => {
    return await modifyDashboards(context);
  },
});
```

### Core Implementation

```typescript
const modifyDashboards = wrapTraced(
  async (params: { modifications: DashboardModification[] }) => {
    const { modifications } = params;
    const results = [];
    let successCount = 0;
    
    const userId = agent.getUserId();
    
    for (const modification of modifications) {
      try {
        const result = await modifySingleDashboard(modification, userId);
        results.push({
          id: modification.dashboard_id,
          title: result.title,
          status: 'modified' as const,
          changes_applied: result.changes_applied
        });
        successCount++;
      } catch (error) {
        const dashboard = await getDashboardTitle(modification.dashboard_id);
        results.push({
          id: modification.dashboard_id,
          title: dashboard?.title || 'Unknown',
          status: 'error' as const,
          changes_applied: [],
          error_message: error.message
        });
      }
    }
    
    return {
      success: successCount > 0,
      modified_dashboards: results,
      total_modified: successCount
    };
  },
  { name: 'modify-dashboards' }
);

async function modifySingleDashboard(
  modification: DashboardModification,
  userId: string
) {
  // 1. Validate dashboard exists and user has edit access
  const dashboard = await validateDashboardEditAccess(modification.dashboard_id, userId);
  
  // 2. Create version before modification
  await createDashboardVersion(dashboard);
  
  const changesApplied: string[] = [];
  
  // 3. Apply basic updates
  if (modification.title && modification.title !== dashboard.title) {
    dashboard.title = modification.title;
    changesApplied.push('Updated title');
  }
  
  if (modification.description !== undefined) {
    dashboard.description = modification.description;
    changesApplied.push('Updated description');
  }
  
  // 4. Handle metric additions
  if (modification.add_metrics && modification.add_metrics.length > 0) {
    await validateMetricAccess(modification.add_metrics, userId);
    const added = await addMetricsToDashboard(
      dashboard.id,
      modification.add_metrics,
      dashboard.metrics || []
    );
    changesApplied.push(`Added ${added} metrics`);
  }
  
  // 5. Handle metric removals
  if (modification.remove_metrics && modification.remove_metrics.length > 0) {
    const removed = await removeMetricsFromDashboard(
      dashboard.id,
      modification.remove_metrics
    );
    changesApplied.push(`Removed ${removed} metrics`);
  }
  
  // 6. Handle metric reordering
  if (modification.reorder_metrics) {
    await reorderDashboardMetrics(dashboard.id, modification.reorder_metrics);
    changesApplied.push('Reordered metrics');
  }
  
  // 7. Apply layout updates
  if (modification.layout_updates) {
    const layoutChanges = applyLayoutUpdates(dashboard.layout, modification.layout_updates);
    dashboard.layout = layoutChanges.layout;
    changesApplied.push(...layoutChanges.changes);
  }
  
  // 8. Apply filter updates
  if (modification.filter_updates) {
    const filterChanges = await applyFilterUpdates(
      dashboard.filters || [],
      modification.filter_updates,
      dashboard.id
    );
    dashboard.filters = filterChanges.filters;
    changesApplied.push(...filterChanges.changes);
  }
  
  // 9. Update sharing settings
  if (modification.sharing && modification.sharing !== dashboard.sharing_setting) {
    await updateDashboardSharing(dashboard.id, modification.sharing, userId);
    dashboard.sharing_setting = modification.sharing;
    changesApplied.push(`Changed sharing to ${modification.sharing}`);
  }
  
  // 10. Update refresh interval
  if (modification.refresh_interval !== undefined) {
    dashboard.refresh_interval = modification.refresh_interval;
    changesApplied.push('Updated refresh interval');
  }
  
  // 11. Save changes
  dashboard.updated_at = new Date().toISOString();
  await db
    .update(dashboards)
    .set({
      title: dashboard.title,
      description: dashboard.description,
      layout: JSON.stringify(dashboard.layout),
      filters: JSON.stringify(dashboard.filters),
      sharing_setting: dashboard.sharing_setting,
      refresh_interval: dashboard.refresh_interval,
      updated_at: dashboard.updated_at
    })
    .where(eq(dashboards.id, modification.dashboard_id));
  
  return {
    title: dashboard.title,
    changes_applied: changesApplied
  };
}

async function addMetricsToDashboard(
  dashboardId: string,
  metricsToAdd: string[],
  existingMetrics: string[]
): Promise<number> {
  // Filter out already existing metrics
  const newMetrics = metricsToAdd.filter(id => !existingMetrics.includes(id));
  
  if (newMetrics.length === 0) return 0;
  
  // Get current max position
  const maxPosition = await db
    .select({ max: sql<number>`MAX(position)` })
    .from(dashboardsToMetricFiles)
    .where(eq(dashboardsToMetricFiles.dashboardId, dashboardId));
    
  const startPosition = (maxPosition[0]?.max || 0) + 1;
  
  // Add new metrics
  const links = newMetrics.map((metricId, index) => ({
    dashboard_id: dashboardId,
    metric_file_id: metricId,
    position: startPosition + index
  }));
  
  await db.insert(dashboardsToMetricFiles).values(links);
  
  return newMetrics.length;
}

async function removeMetricsFromDashboard(
  dashboardId: string,
  metricsToRemove: string[]
): Promise<number> {
  const result = await db
    .delete(dashboardsToMetricFiles)
    .where(
      and(
        eq(dashboardsToMetricFiles.dashboardId, dashboardId),
        inArray(dashboardsToMetricFiles.metricFileId, metricsToRemove)
      )
    );
    
  return result.rowCount || 0;
}

async function reorderDashboardMetrics(
  dashboardId: string,
  reorderSpec: Array<{ metric_id: string; position: number }>
): Promise<void> {
  // Update positions in a transaction
  await db.transaction(async (tx) => {
    for (const { metric_id, position } of reorderSpec) {
      await tx
        .update(dashboardsToMetricFiles)
        .set({ position })
        .where(
          and(
            eq(dashboardsToMetricFiles.dashboardId, dashboardId),
            eq(dashboardsToMetricFiles.metricFileId, metric_id)
          )
        );
    }
  });
}

function applyLayoutUpdates(
  currentLayout: any,
  updates: LayoutUpdate
): { layout: any; changes: string[] } {
  const layout = { ...currentLayout };
  const changes: string[] = [];
  
  if (updates.type && updates.type !== layout.type) {
    layout.type = updates.type;
    changes.push(`Changed layout type to ${updates.type}`);
  }
  
  if (updates.columns !== undefined) {
    layout.columns = updates.columns;
    changes.push(`Set columns to ${updates.columns}`);
  }
  
  if (updates.items) {
    layout.items = updates.items;
    changes.push('Updated metric positions');
  }
  
  return { layout, changes };
}

async function applyFilterUpdates(
  currentFilters: any[],
  updates: FilterUpdate,
  dashboardId: string
): Promise<{ filters: any[]; changes: string[] }> {
  let filters = [...currentFilters];
  const changes: string[] = [];
  
  // Add new filters
  if (updates.add) {
    filters.push(...updates.add);
    changes.push(`Added ${updates.add.length} filters`);
  }
  
  // Remove filters
  if (updates.remove) {
    filters = filters.filter(f => !updates.remove!.includes(f.field));
    changes.push(`Removed ${updates.remove.length} filters`);
  }
  
  // Update filter defaults
  if (updates.update) {
    for (const update of updates.update) {
      const filter = filters.find(f => f.field === update.field);
      if (filter) {
        filter.default_value = update.default_value;
      }
    }
    changes.push('Updated filter defaults');
  }
  
  return { filters, changes };
}

async function updateDashboardSharing(
  dashboardId: string,
  newSharing: SharingLevel,
  userId: string
): Promise<void> {
  // Remove existing non-owner permissions
  await db
    .delete(assetPermissions)
    .where(
      and(
        eq(assetPermissions.assetId, dashboardId),
        eq(assetPermissions.assetType, 'dashboard'),
        not(eq(assetPermissions.role, 'owner'))
      )
    );
    
  // Apply new sharing permissions
  await setDashboardPermissions(dashboardId, newSharing, userId, agent.getOrganizationId());
}
```

## Test Strategy

### Unit Tests (`modify-dashboards.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Dashboard access validation
- Layout modification logic
- Metric addition/removal
- Version control functionality

### Integration Tests (`modify-dashboards.integration.test.ts`)
- Real database/filesystem/API integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Complex modification workflows
- Permission management testing

## AI Agent Implementation Time

**Estimated Time**: 4 minutes
**Complexity**: High

## Implementation Priority

**High** - Essential for dashboard customization workflows.