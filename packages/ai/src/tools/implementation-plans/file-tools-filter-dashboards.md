# Filter Dashboards Tool Implementation Plan

## Overview

Migrate the Rust `filter_dashboards.rs` to TypeScript using Mastra framework. This tool searches and filters dashboards based on various criteria.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/file_tools/filter_dashboards.rs`
- **Purpose**: Search and filter dashboards by content, metrics, ownership
- **Input**: Filter criteria (title, tags, metrics, owner)
- **Output**: Filtered list of dashboards
- **Key Features**:
  - Text search in titles/descriptions
  - Tag-based filtering
  - Metric inclusion filtering
  - Permission-aware filtering
  - Sorting options

## Dependencies
- @database for data persistence
- @sharing for permission management
- @stored-values for dynamic content
- @ai-sdk/openai for intelligent search
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Function-based
**Wave**: 2
**AI Agent Time**: 3 minutes
**Depends on**: create-dashboards

## TypeScript Implementation

### Tool Definition

```typescript
export const filterDashboardsTool = createTool({
  id: 'filter-dashboards',
  description: 'Search and filter dashboards based on various criteria',
  inputSchema: z.object({
    search_text: z.string().optional().describe('Search in title and description'),
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    has_metrics: z.array(z.string().uuid()).optional()
      .describe('Dashboards containing these metrics'),
    owner_id: z.string().uuid().optional().describe('Filter by owner'),
    sharing_level: z.enum(['private', 'team', 'organization', 'public']).optional(),
    created_after: z.string().datetime().optional(),
    created_before: z.string().datetime().optional(),
    sort_by: z.enum(['created_at', 'updated_at', 'title', 'relevance']).default('updated_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    limit: z.number().default(50),
    offset: z.number().default(0)
  }),
  outputSchema: z.object({
    dashboards: z.array(z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().optional(),
      owner_name: z.string(),
      metric_count: z.number(),
      tags: z.array(z.string()),
      sharing_level: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
      relevance_score: z.number().optional()
    })),
    total_count: z.number(),
    has_more: z.boolean()
  }),
  execute: async ({ context }) => {
    return await filterDashboards(context);
  },
});
```

### Core Implementation

```typescript
const filterDashboards = wrapTraced(
  async (params: FilterDashboardsParams) => {
    const userId = agent.getUserId();
    
    // Build query
    let query = db
      .select({
        dashboard: dashboards,
        owner: users,
        permission: assetPermissions,
        metricCount: sql<number>`COUNT(DISTINCT dtm.metric_file_id)`
      })
      .from(dashboards)
      .innerJoin(users, eq(dashboards.createdBy, users.id))
      .innerJoin(
        assetPermissions,
        and(
          eq(assetPermissions.assetId, dashboards.id),
          eq(assetPermissions.assetType, 'dashboard')
        )
      )
      .leftJoin(
        dashboardsToMetricFiles,
        eq(dashboardsToMetricFiles.dashboardId, dashboards.id)
      )
      .where(
        and(
          // User must have view permission
          or(
            eq(assetPermissions.userId, userId),
            eq(assetPermissions.identityType, 'team'),
            eq(assetPermissions.identityType, 'organization'),
            eq(dashboards.isPublic, true)
          ),
          // Apply filters
          ...buildWhereConditions(params)
        )
      )
      .groupBy(dashboards.id, users.id, assetPermissions.id);
    
    // Apply sorting
    query = applySorting(query, params.sort_by, params.sort_order);
    
    // Execute count query
    const countResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${dashboards.id})` })
      .from(query.as('filtered_dashboards'));
    
    const totalCount = countResult[0]?.count || 0;
    
    // Apply pagination
    query = query.limit(params.limit).offset(params.offset);
    
    // Execute main query
    const results = await query;
    
    // Apply text search ranking if search_text provided
    let processedResults = results;
    if (params.search_text) {
      processedResults = rankByTextRelevance(results, params.search_text);
    }
    
    // Format results
    const formattedDashboards = processedResults.map(result => ({
      id: result.dashboard.id,
      title: result.dashboard.title,
      description: result.dashboard.description,
      owner_name: `${result.owner.firstName} ${result.owner.lastName}`.trim(),
      metric_count: result.metricCount,
      tags: result.dashboard.tags || [],
      sharing_level: result.dashboard.sharingLevel,
      created_at: result.dashboard.createdAt,
      updated_at: result.dashboard.updatedAt,
      relevance_score: result.relevanceScore
    }));
    
    return {
      dashboards: formattedDashboards,
      total_count: totalCount,
      has_more: params.offset + params.limit < totalCount
    };
  },
  { name: 'filter-dashboards' }
);

function buildWhereConditions(params: FilterDashboardsParams): SQL[] {
  const conditions: SQL[] = [];
  
  // Text search
  if (params.search_text) {
    const searchPattern = `%${params.search_text}%`;
    conditions.push(
      or(
        ilike(dashboards.title, searchPattern),
        ilike(dashboards.description, searchPattern)
      )
    );
  }
  
  // Tag filter
  if (params.tags && params.tags.length > 0) {
    conditions.push(
      sql`${dashboards.tags} && ARRAY[${params.tags.join(',')}]::text[]`
    );
  }
  
  // Metrics filter
  if (params.has_metrics && params.has_metrics.length > 0) {
    conditions.push(
      inArray(dashboardsToMetricFiles.metricFileId, params.has_metrics)
    );
  }
  
  // Owner filter
  if (params.owner_id) {
    conditions.push(eq(dashboards.createdBy, params.owner_id));
  }
  
  // Sharing level filter
  if (params.sharing_level) {
    conditions.push(eq(dashboards.sharingLevel, params.sharing_level));
  }
  
  // Date filters
  if (params.created_after) {
    conditions.push(gte(dashboards.createdAt, params.created_after));
  }
  
  if (params.created_before) {
    conditions.push(lte(dashboards.createdAt, params.created_before));
  }
  
  return conditions;
}

function applySorting(query: any, sortBy: string, sortOrder: 'asc' | 'desc') {
  const orderDirection = sortOrder === 'asc' ? asc : desc;
  
  switch (sortBy) {
    case 'created_at':
      return query.orderBy(orderDirection(dashboards.createdAt));
    case 'updated_at':
      return query.orderBy(orderDirection(dashboards.updatedAt));
    case 'title':
      return query.orderBy(orderDirection(dashboards.title));
    case 'relevance':
      // Relevance sorting handled post-query
      return query;
    default:
      return query.orderBy(desc(dashboards.updatedAt));
  }
}

function rankByTextRelevance(
  results: any[],
  searchText: string
): any[] {
  const searchTerms = searchText.toLowerCase().split(/\s+/);
  
  return results
    .map(result => {
      let score = 0;
      const title = result.dashboard.title.toLowerCase();
      const description = (result.dashboard.description || '').toLowerCase();
      
      // Score based on term matches
      for (const term of searchTerms) {
        // Title matches worth more
        if (title.includes(term)) {
          score += title.startsWith(term) ? 10 : 5;
        }
        // Description matches
        if (description.includes(term)) {
          score += 2;
        }
      }
      
      // Exact phrase match bonus
      if (title.includes(searchText.toLowerCase())) {
        score += 20;
      }
      
      return {
        ...result,
        relevanceScore: score
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Advanced search with metric content
export const searchDashboardsWithContentTool = createTool({
  id: 'search-dashboards-content',
  description: 'Search dashboards including metric content and SQL queries',
  inputSchema: z.object({
    search_query: z.string().describe('Search query for deep content search'),
    search_in: z.array(z.enum(['title', 'description', 'metric_titles', 'sql_queries']))
      .default(['title', 'description', 'metric_titles']),
    limit: z.number().default(20)
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      dashboard_id: z.string().uuid(),
      dashboard_title: z.string(),
      matches: z.array(z.object({
        type: z.enum(['title', 'description', 'metric', 'sql']),
        content: z.string(),
        highlight: z.string()
      })),
      score: z.number()
    })),
    total_results: z.number()
  }),
  execute: async ({ context }) => {
    return await searchDashboardContent(context);
  }
});

async function searchDashboardContent(params: SearchContentParams) {
  const { search_query, search_in, limit } = params;
  const userId = agent.getUserId();
  
  // Build complex search query that includes metric content
  const searchPattern = `%${search_query}%`;
  
  const results = await db
    .select({
      dashboard: dashboards,
      metric: metricFiles,
      matchType: sql<string>`
        CASE
          WHEN ${dashboards.title} ILIKE ${searchPattern} THEN 'title'
          WHEN ${dashboards.description} ILIKE ${searchPattern} THEN 'description'
          WHEN ${metricFiles.title} ILIKE ${searchPattern} THEN 'metric'
          WHEN ${metricFiles.sqlQuery} ILIKE ${searchPattern} THEN 'sql'
        END
      `,
      matchContent: sql<string>`
        CASE
          WHEN ${dashboards.title} ILIKE ${searchPattern} THEN ${dashboards.title}
          WHEN ${dashboards.description} ILIKE ${searchPattern} THEN ${dashboards.description}
          WHEN ${metricFiles.title} ILIKE ${searchPattern} THEN ${metricFiles.title}
          WHEN ${metricFiles.sqlQuery} ILIKE ${searchPattern} THEN ${metricFiles.sqlQuery}
        END
      `
    })
    .from(dashboards)
    .innerJoin(
      dashboardsToMetricFiles,
      eq(dashboardsToMetricFiles.dashboardId, dashboards.id)
    )
    .innerJoin(
      metricFiles,
      eq(metricFiles.id, dashboardsToMetricFiles.metricFileId)
    )
    .where(
      and(
        or(
          ...buildSearchConditions(search_in, searchPattern)
        ),
        // Permission check
        exists(
          db
            .select()
            .from(assetPermissions)
            .where(
              and(
                eq(assetPermissions.assetId, dashboards.id),
                eq(assetPermissions.userId, userId)
              )
            )
        )
      )
    )
    .limit(limit * 3); // Get more results for grouping
    
  // Group and score results
  const groupedResults = groupDashboardSearchResults(results, search_query);
  
  return {
    results: groupedResults.slice(0, limit),
    total_results: groupedResults.length
  };
}
```

## Test Strategy

### Unit Tests (`filter-dashboards.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Text search functionality
- Tag filtering logic
- Permission-based filtering
- Sorting and pagination

### Integration Tests (`filter-dashboards.integration.test.ts`)
- Real database/filesystem/API integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Complex filter combinations
- Permission enforcement testing

## AI Agent Implementation Time

**Estimated Time**: 3 minutes
**Complexity**: Medium

## Implementation Priority

**Medium** - Important for dashboard discovery but not critical path.