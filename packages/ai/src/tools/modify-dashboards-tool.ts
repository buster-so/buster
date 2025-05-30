import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface DashboardModification {
  dashboard_id: string;
  title?: string;
  description?: string;
  add_metrics?: string[];
  remove_metrics?: string[];
  reorder_metrics?: Array<{ metric_id: string; position: number }>;
  layout_updates?: LayoutUpdate;
  filter_updates?: FilterUpdate;
  sharing?: SharingLevel;
  refresh_interval?: number;
}

interface LayoutUpdate {
  type?: 'grid' | 'flex' | 'tabs';
  columns?: number;
  items?: Array<{
    metric_id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}

interface FilterUpdate {
  add?: Array<{
    field: string;
    type: 'date_range' | 'select' | 'multi_select' | 'search';
    default_value?: any;
  }>;
  remove?: string[];
  update?: Array<{
    field: string;
    default_value: any;
  }>;
}

type SharingLevel = 'private' | 'team' | 'organization' | 'public';

export const modifyDashboardsTool = createTool({
  id: 'modify-dashboards',
  description: 'Modify existing dashboard configurations and layouts',
  inputSchema: z.object({
    modifications: z.array(z.object({
      dashboard_id: z.string().describe('ID of dashboard to modify'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      add_metrics: z.array(z.string()).optional().describe('Metrics to add'),
      remove_metrics: z.array(z.string()).optional().describe('Metrics to remove'),
      reorder_metrics: z.array(z.object({
        metric_id: z.string(),
        position: z.number()
      })).optional(),
      layout_updates: z.object({
        type: z.enum(['grid', 'flex', 'tabs']).optional(),
        columns: z.number().optional(),
        items: z.array(z.object({
          metric_id: z.string(),
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
      id: z.string(),
      title: z.string(),
      status: z.enum(['modified', 'error']),
      changes_applied: z.array(z.string()),
      error_message: z.string().optional()
    })),
    total_modified: z.number()
  }),
  execute: async ({ context }) => {
    return await modifyDashboards(context as { modifications: DashboardModification[] });
  },
});

const modifyDashboards = wrapTraced(
  async (params: { modifications: DashboardModification[] }) => {
    const { modifications } = params;
    const results = [];
    let successCount = 0;
    
    for (const modification of modifications) {
      try {
        const result = await modifySingleDashboard(modification);
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
          error_message: error instanceof Error ? error.message : String(error)
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

async function modifySingleDashboard(modification: DashboardModification) {
  // 1. Validate dashboard exists and user has edit access
  const dashboard = await validateDashboardEditAccess(modification.dashboard_id);
  
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
    await validateMetricAccess(modification.add_metrics);
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
    await updateDashboardSharing(dashboard.id, modification.sharing);
    dashboard.sharing_setting = modification.sharing;
    changesApplied.push(`Changed sharing to ${modification.sharing}`);
  }
  
  // 10. Update refresh interval
  if (modification.refresh_interval !== undefined) {
    dashboard.refresh_interval = modification.refresh_interval;
    changesApplied.push('Updated refresh interval');
  }
  
  // 11. Save changes (simulated - in real implementation would save to database)
  dashboard.updated_at = new Date().toISOString();
  console.log('Modified dashboard:', {
    id: modification.dashboard_id,
    title: dashboard.title,
    description: dashboard.description,
    layout: dashboard.layout,
    filters: dashboard.filters,
    sharing_setting: dashboard.sharing_setting,
    refresh_interval: dashboard.refresh_interval,
    updated_at: dashboard.updated_at
  });
  
  return {
    title: dashboard.title,
    changes_applied: changesApplied
  };
}

async function validateDashboardEditAccess(dashboardId: string) {
  // Simulate dashboard access validation - in real implementation would query database
  const simulatedDashboards: Record<string, any> = {
    'dash_abc123_1': {
      id: 'dash_abc123_1',
      title: 'Sales Dashboard',
      description: 'Overview of sales metrics',
      layout: {
        type: 'grid',
        columns: 2,
        items: []
      },
      filters: [],
      metrics: ['metric_abc123_1', 'metric_def456_2'],
      sharing_setting: 'private',
      refresh_interval: 300
    },
    'dash_def456_2': {
      id: 'dash_def456_2',
      title: 'Customer Analytics',
      description: 'Customer behavior insights',
      layout: {
        type: 'flex',
        columns: 3,
        items: []
      },
      filters: [
        {
          field: 'date_range',
          type: 'date_range',
          default_value: '30d'
        }
      ],
      metrics: ['metric_ghi789_3'],
      sharing_setting: 'team',
      refresh_interval: 600
    }
  };
  
  const dashboard = simulatedDashboards[dashboardId];
  if (!dashboard) {
    throw new Error(`Dashboard not found or no access: ${dashboardId}`);
  }
  
  return dashboard;
}

async function getDashboardTitle(dashboardId: string): Promise<{ title: string } | null> {
  try {
    const dashboard = await validateDashboardEditAccess(dashboardId);
    return { title: dashboard.title };
  } catch {
    return null;
  }
}

async function addMetricsToDashboard(
  dashboardId: string,
  metricsToAdd: string[],
  existingMetrics: string[]
): Promise<number> {
  // Filter out already existing metrics
  const newMetrics = metricsToAdd.filter(id => !existingMetrics.includes(id));
  
  if (newMetrics.length === 0) return 0;
  
  // Simulate getting current max position
  const startPosition = existingMetrics.length;
  
  // Simulate adding new metrics to junction table
  const links = newMetrics.map((metricId, index) => ({
    dashboard_id: dashboardId,
    metric_file_id: metricId,
    position: startPosition + index
  }));
  
  console.log(`Added ${links.length} metrics to dashboard ${dashboardId}:`, links);
  
  return newMetrics.length;
}

async function removeMetricsFromDashboard(
  dashboardId: string,
  metricsToRemove: string[]
): Promise<number> {
  // Simulate removing metrics from junction table
  console.log(`Removed ${metricsToRemove.length} metrics from dashboard ${dashboardId}:`, metricsToRemove);
  
  return metricsToRemove.length;
}

async function reorderDashboardMetrics(
  dashboardId: string,
  reorderSpec: Array<{ metric_id: string; position: number }>
): Promise<void> {
  // Simulate updating positions in junction table
  console.log(`Reordered metrics in dashboard ${dashboardId}:`, reorderSpec);
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
  _dashboardId: string
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
  newSharing: SharingLevel
): Promise<void> {
  // Simulate updating dashboard sharing permissions
  const permissions: {
    dashboard_id: string;
    sharing_level: SharingLevel;
    permissions: Array<{ identity_type: string; role: string }>;
  } = {
    dashboard_id: dashboardId,
    sharing_level: newSharing,
    permissions: []
  };
  
  // Simulate different permission levels
  switch (newSharing) {
    case 'team':
      permissions.permissions.push({
        identity_type: 'team',
        role: 'viewer'
      });
      break;
      
    case 'organization':
      permissions.permissions.push({
        identity_type: 'organization',
        role: 'viewer'
      });
      break;
      
    case 'public':
      permissions.permissions.push({
        identity_type: 'public',
        role: 'viewer'
      });
      break;
      
    default: // private
      permissions.permissions.push({
        identity_type: 'user',
        role: 'owner'
      });
      break;
  }
  
  console.log(`Updated sharing for dashboard ${dashboardId}:`, permissions);
}

async function createDashboardVersion(dashboard: any): Promise<void> {
  // Simulate version creation
  const version = {
    id: generateId(),
    dashboard_id: dashboard.id,
    version_number: Date.now(), // Simplified versioning
    layout: JSON.stringify(dashboard.layout),
    filters: JSON.stringify(dashboard.filters),
    created_at: new Date().toISOString()
  };
  
  console.log('Created dashboard version:', version);
}

async function validateMetricAccess(metricIds: string[]): Promise<void> {
  // Simulate metric access validation
  const validMetrics = ['metric_abc123_1', 'metric_def456_2', 'metric_ghi789_3', 'metric_jkl012_4'];
  const missingIds = metricIds.filter(id => !validMetrics.includes(id));
  
  if (missingIds.length > 0) {
    throw new Error(`User does not have access to metrics: ${missingIds.join(', ')}`);
  }
  
  console.log(`Validated access to ${metricIds.length} metrics`);
}

function generateId(): string {
  return 'version_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}