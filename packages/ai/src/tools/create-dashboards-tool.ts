import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface DashboardSpec {
  title: string;
  description?: string;
  metrics: string[];
  layout?: DashboardLayout;
  filters?: DashboardFilter[];
  refresh_interval?: number;
  tags?: string[];
  sharing?: SharingLevel;
}

interface DashboardLayout {
  type: 'grid' | 'flex' | 'tabs';
  columns?: number;
  sections?: LayoutSection[];
}

interface LayoutSection {
  title?: string;
  metrics: string[];
  width?: number;
  height?: number;
}

interface DashboardFilter {
  field: string;
  type: 'date_range' | 'select' | 'multi_select' | 'search';
  default_value?: any;
  options?: any[];
}

type SharingLevel = 'private' | 'team' | 'organization' | 'public';

export const createDashboardsTool = createTool({
  id: 'create-dashboards',
  description: 'Create dashboards to organize and display multiple metrics',
  inputSchema: z.object({
    dashboards: z.array(z.object({
      title: z.string().describe('Dashboard title'),
      description: z.string().optional().describe('Dashboard description'),
      metrics: z.array(z.string()).describe('Metric IDs to include'),
      layout: z.object({
        type: z.enum(['grid', 'flex', 'tabs']).default('grid'),
        columns: z.number().default(2).describe('Number of columns for grid layout'),
        sections: z.array(z.object({
          title: z.string().optional(),
          metrics: z.array(z.string()),
          width: z.number().optional().describe('Section width (1-12)'),
          height: z.number().optional().describe('Section height in rows')
        })).optional()
      }).optional(),
      filters: z.array(z.object({
        field: z.string(),
        type: z.enum(['date_range', 'select', 'multi_select', 'search']),
        default_value: z.any().optional(),
        options: z.array(z.any()).optional()
      })).optional(),
      refresh_interval: z.number().optional().describe('Auto-refresh in seconds'),
      tags: z.array(z.string()).optional(),
      sharing: z.enum(['private', 'team', 'organization', 'public']).default('private')
    }))
  }),
  outputSchema: z.object({
    success: z.boolean(),
    created_dashboards: z.array(z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      status: z.enum(['created', 'error']),
      error_message: z.string().optional()
    })),
    total_created: z.number()
  }),
  execute: async ({ context }) => {
    return await createDashboards(context as { dashboards: DashboardSpec[] });
  },
});

const createDashboards = wrapTraced(
  async (params: { dashboards: DashboardSpec[] }) => {
    const { dashboards } = params;
    const results = [];
    let successCount = 0;
    
    for (const dashboard of dashboards) {
      try {
        const created = await createSingleDashboard(dashboard);
        results.push({
          id: created.id,
          title: created.title,
          url: created.url,
          status: 'created' as const
        });
        successCount++;
      } catch (error) {
        results.push({
          id: generateId(),
          title: dashboard.title,
          url: '',
          status: 'error' as const,
          error_message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return {
      success: successCount > 0,
      created_dashboards: results,
      total_created: successCount
    };
  },
  { name: 'create-dashboards' }
);

async function createSingleDashboard(spec: DashboardSpec) {
  // 1. Validate metrics exist and user has access
  await validateMetricAccess(spec.metrics);
  
  // 2. Create dashboard layout configuration
  const layoutConfig = generateLayoutConfig(spec.layout, spec.metrics);
  
  // 3. Create dashboard filters configuration
  const filtersConfig = await generateFiltersConfig(spec.filters, spec.metrics);
  
  // 4. Create dashboard (simulated - in real implementation would save to database)
  const dashboardId = generateId();
  const dashboard = {
    id: dashboardId,
    title: spec.title,
    description: spec.description,
    layout: JSON.stringify(layoutConfig),
    filters: JSON.stringify(filtersConfig),
    refresh_interval: spec.refresh_interval,
    tags: spec.tags || [],
    sharing_setting: spec.sharing || 'private',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Simulate saving to database
  console.log('Created dashboard:', dashboard);
  
  // 5. Create dashboard version for history (simulated)
  await createDashboardVersion(dashboardId, layoutConfig);
  
  // 6. Link metrics to dashboard (simulated)
  await linkMetricsToDashboard(dashboardId, spec.metrics);
  
  // 7. Set permissions based on sharing (simulated)
  await setDashboardPermissions(dashboardId, spec.sharing);
  
  return {
    id: dashboardId,
    title: spec.title,
    url: `/dashboards/${dashboardId}`
  };
}

async function validateMetricAccess(metricIds: string[]): Promise<void> {
  // Simulate metric access validation - in real implementation would query database
  const simulatedMetrics = [
    'metric_abc123_1',
    'metric_def456_2',
    'metric_ghi789_3',
    'metric_jkl012_4'
  ];
  
  const missingIds = metricIds.filter(id => !simulatedMetrics.includes(id));
  
  if (missingIds.length > 0) {
    throw new Error(`User does not have access to metrics: ${missingIds.join(', ')}`);
  }
  
  console.log(`Validated access to ${metricIds.length} metrics`);
}

function generateLayoutConfig(
  layout: DashboardLayout | undefined,
  metricIds: string[]
): any {
  if (!layout) {
    // Default grid layout
    return {
      type: 'grid',
      columns: 2,
      items: metricIds.map((id, index) => ({
        metric_id: id,
        x: index % 2,
        y: Math.floor(index / 2),
        w: 1,
        h: 1
      }))
    };
  }
  
  if (layout.sections) {
    // Custom sections layout
    return {
      type: layout.type,
      columns: layout.columns || 2,
      sections: layout.sections.map((section) => ({
        title: section.title,
        items: section.metrics.map((metricId, itemIndex) => ({
          metric_id: metricId,
          x: 0,
          y: itemIndex,
          w: section.width || 12,
          h: section.height || 1
        }))
      }))
    };
  }
  
  // Simple layout
  return {
    type: layout.type,
    columns: layout.columns || 2,
    items: metricIds.map((id, index) => ({
      metric_id: id,
      x: index % (layout.columns || 2),
      y: Math.floor(index / (layout.columns || 2)),
      w: 1,
      h: 1
    }))
  };
}

async function generateFiltersConfig(
  filters: DashboardFilter[] | undefined,
  metricIds: string[]
): Promise<any> {
  if (!filters || filters.length === 0) {
    return [];
  }
  
  // Validate filter fields exist in metrics (simplified)
  const metricSchemas = await getMetricSchemas(metricIds);
  
  return filters.map(filter => ({
    field: filter.field,
    type: filter.type,
    label: toTitleCase(filter.field.replace(/_/g, ' ')),
    default_value: filter.default_value,
    options: filter.options || extractFilterOptions(filter.field, metricSchemas),
    applies_to: metricIds // All metrics by default
  }));
}

async function getMetricSchemas(metricIds: string[]): Promise<any[]> {
  // Simulate getting metric schemas
  return metricIds.map(id => ({
    id,
    fields: ['date', 'category', 'value', 'count', 'amount'],
    types: {
      date: 'timestamp',
      category: 'string',
      value: 'number',
      count: 'integer',
      amount: 'decimal'
    }
  }));
}

function extractFilterOptions(field: string, _metricSchemas: any[]): any[] {
  // Generate sample filter options based on field name
  const sampleOptions: Record<string, any[]> = {
    category: ['Sales', 'Marketing', 'Support', 'Product'],
    status: ['Active', 'Inactive', 'Pending'],
    priority: ['High', 'Medium', 'Low'],
    region: ['North', 'South', 'East', 'West'],
    department: ['Engineering', 'Sales', 'Marketing', 'HR']
  };
  
  return sampleOptions[field] || [];
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

async function linkMetricsToDashboard(
  dashboardId: string,
  metricIds: string[]
): Promise<void> {
  const links = metricIds.map((metricId, index) => ({
    dashboard_id: dashboardId,
    metric_file_id: metricId,
    position: index
  }));
  
  console.log(`Linked ${links.length} metrics to dashboard ${dashboardId}`);
}

async function setDashboardPermissions(
  dashboardId: string,
  sharing?: SharingLevel
): Promise<void> {
  const permissions: {
    dashboard_id: string;
    sharing_level: SharingLevel;
    permissions: Array<{ identity_type: string; role: string }>;
  } = {
    dashboard_id: dashboardId,
    sharing_level: sharing || 'private',
    permissions: []
  };
  
  // Simulate different permission levels
  switch (sharing) {
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
  
  console.log(`Set permissions for dashboard ${dashboardId}:`, permissions);
}

async function createDashboardVersion(
  dashboardId: string,
  layoutConfig: any
): Promise<void> {
  const version = {
    id: generateId(),
    dashboard_id: dashboardId,
    version_number: 1,
    layout: JSON.stringify(layoutConfig),
    created_at: new Date().toISOString()
  };
  
  console.log(`Created dashboard version:`, version);
}

function generateId(): string {
  return 'dash_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}