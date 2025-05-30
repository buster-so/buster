# Create Dashboards Tool Implementation Plan

## Overview

Migrate the Rust `create_dashboards.rs` to TypeScript using Mastra framework. This tool creates dashboards that organize and display multiple metrics/visualizations.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/file_tools/create_dashboards.rs`
- **Purpose**: Create dashboard containers for organizing metrics
- **Input**: Dashboard specifications with layout and metrics
- **Output**: Created dashboard with organization structure
- **Key Features**:
  - Dashboard layout management
  - Metric organization
  - Permission management
  - Version control
  - Template support

## Dependencies
- @database for data persistence
- @sharing for permission management
- @stored-values for dynamic content
- @ai-sdk/openai for intelligent layout suggestions
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Workflow-based
**Wave**: 4
**AI Agent Time**: 5 minutes
**Depends on**: create-metrics, modify-metrics, search-data-catalog

## TypeScript Implementation

### Tool Definition

```typescript
export const createDashboardsTool = createTool({
  id: 'create-dashboards',
  description: 'Create dashboards to organize and display multiple metrics',
  inputSchema: z.object({
    dashboards: z.array(z.object({
      title: z.string().describe('Dashboard title'),
      description: z.string().optional().describe('Dashboard description'),
      metrics: z.array(z.string().uuid()).describe('Metric IDs to include'),
      layout: z.object({
        type: z.enum(['grid', 'flex', 'tabs']).default('grid'),
        columns: z.number().default(2).describe('Number of columns for grid layout'),
        sections: z.array(z.object({
          title: z.string().optional(),
          metrics: z.array(z.string().uuid()),
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
      id: z.string().uuid(),
      title: z.string(),
      url: z.string(),
      status: z.enum(['created', 'error']),
      error_message: z.string().optional()
    })),
    total_created: z.number()
  }),
  execute: async ({ context }) => {
    return await createDashboards(context);
  },
});
```

### Core Implementation

```typescript
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

const createDashboards = wrapTraced(
  async (params: { dashboards: DashboardSpec[] }) => {
    const { dashboards } = params;
    const results = [];
    let successCount = 0;
    
    const userId = agent.getUserId();
    const organizationId = agent.getOrganizationId();
    
    for (const dashboard of dashboards) {
      try {
        const created = await createSingleDashboard(dashboard, userId, organizationId);
        results.push({
          id: created.id,
          title: created.title,
          url: created.url,
          status: 'created' as const
        });
        successCount++;
      } catch (error) {
        results.push({
          id: uuidv4(),
          title: dashboard.title,
          url: '',
          status: 'error' as const,
          error_message: error.message
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

async function createSingleDashboard(
  spec: DashboardSpec,
  userId: string,
  organizationId: string
) {
  // 1. Validate metrics exist and user has access
  await validateMetricAccess(spec.metrics, userId);
  
  // 2. Create dashboard layout configuration
  const layoutConfig = generateLayoutConfig(spec.layout, spec.metrics);
  
  // 3. Create dashboard filters configuration
  const filtersConfig = await generateFiltersConfig(spec.filters, spec.metrics);
  
  // 4. Create dashboard in database
  const dashboardId = uuidv4();
  const dashboard = {
    id: dashboardId,
    title: spec.title,
    description: spec.description,
    organization_id: organizationId,
    created_by: userId,
    layout: JSON.stringify(layoutConfig),
    filters: JSON.stringify(filtersConfig),
    refresh_interval: spec.refresh_interval,
    tags: spec.tags || [],
    sharing_setting: spec.sharing || 'private',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  await db.insert(dashboards).values(dashboard);
  
  // 5. Create dashboard version for history
  await createDashboardVersion(dashboardId, layoutConfig, userId);
  
  // 6. Link metrics to dashboard
  await linkMetricsToDashboard(dashboardId, spec.metrics);
  
  // 7. Set permissions based on sharing
  await setDashboardPermissions(dashboardId, spec.sharing, userId, organizationId);
  
  return {
    id: dashboardId,
    title: spec.title,
    url: `/dashboards/${dashboardId}`
  };
}

async function validateMetricAccess(metricIds: string[], userId: string): Promise<void> {
  const userMetrics = await db
    .select({ id: metricFiles.id })
    .from(metricFiles)
    .innerJoin(assetPermissions, eq(assetPermissions.assetId, metricFiles.id))
    .where(
      and(
        inArray(metricFiles.id, metricIds),
        eq(assetPermissions.userId, userId),
        eq(assetPermissions.assetType, 'metric_file')
      )
    );
    
  const foundIds = userMetrics.map(m => m.id);
  const missingIds = metricIds.filter(id => !foundIds.includes(id));
  
  if (missingIds.length > 0) {
    throw new Error(`User does not have access to metrics: ${missingIds.join(', ')}`);
  }
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
      sections: layout.sections.map((section, sectionIndex) => ({
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
  
  // Validate filter fields exist in metrics
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

async function linkMetricsToDashboard(
  dashboardId: string,
  metricIds: string[]
): Promise<void> {
  const links = metricIds.map((metricId, index) => ({
    dashboard_id: dashboardId,
    metric_file_id: metricId,
    position: index
  }));
  
  await db.insert(dashboardsToMetricFiles).values(links);
}

async function setDashboardPermissions(
  dashboardId: string,
  sharing: SharingLevel,
  userId: string,
  organizationId: string
): Promise<void> {
  // Owner permission
  await db.insert(assetPermissions).values({
    asset_id: dashboardId,
    asset_type: 'dashboard',
    identity_id: userId,
    identity_type: 'user',
    role: 'owner'
  });
  
  // Additional permissions based on sharing level
  switch (sharing) {
    case 'team':
      // Add team permissions
      const userTeams = await getUserTeams(userId);
      for (const team of userTeams) {
        await db.insert(assetPermissions).values({
          asset_id: dashboardId,
          asset_type: 'dashboard',
          identity_id: team.id,
          identity_type: 'team',
          role: 'viewer'
        });
      }
      break;
      
    case 'organization':
      await db.insert(assetPermissions).values({
        asset_id: dashboardId,
        asset_type: 'dashboard',
        identity_id: organizationId,
        identity_type: 'organization',
        role: 'viewer'
      });
      break;
      
    case 'public':
      // Set public flag on dashboard
      await db
        .update(dashboards)
        .set({ is_public: true })
        .where(eq(dashboards.id, dashboardId));
      break;
  }
}

async function createDashboardVersion(
  dashboardId: string,
  layoutConfig: any,
  userId: string
): Promise<void> {
  await db.insert(dashboardVersions).values({
    id: uuidv4(),
    dashboard_id: dashboardId,
    version_number: 1,
    layout: JSON.stringify(layoutConfig),
    created_by: userId,
    created_at: new Date().toISOString()
  });
}
```

## Test Strategy

### Unit Tests (`create-dashboards.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Dashboard layout generation
- Permission validation
- Metric access verification
- Sharing settings application

### Integration Tests (`create-dashboards.integration.test.ts`)
- Real database/filesystem/API integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Complex layout configurations
- Multi-metric dashboard creation

## AI Agent Implementation Time

**Estimated Time**: 5 minutes
**Complexity**: High

## Implementation Priority

**Very High** - Core visualization organization functionality.