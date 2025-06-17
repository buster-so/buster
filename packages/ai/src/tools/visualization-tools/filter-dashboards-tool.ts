import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface FilterDashboardsParams {
  search_text?: string;
  tags?: string[];
  has_metrics?: string[];
  owner_id?: string;
  sharing_level?: 'private' | 'team' | 'organization' | 'public';
  created_after?: string;
  created_before?: string;
  sort_by: 'created_at' | 'updated_at' | 'title' | 'relevance';
  sort_order: 'asc' | 'desc';
  limit: number;
  offset: number;
}

interface SearchContentParams {
  search_query: string;
  search_in: Array<'title' | 'description' | 'metric_titles' | 'sql_queries'>;
  limit: number;
}

interface Dashboard {
  id: string;
  title: string;
  description?: string;
  owner_name: string;
  metric_count: number;
  tags: string[];
  sharing_level: string;
  created_at: string;
  updated_at: string;
  relevanceScore?: number;
}

interface DashboardWithRelevance extends Dashboard {
  relevanceScore: number;
}

export const filterDashboardsTool = createTool({
  id: 'filter-dashboards',
  description: 'Search and filter dashboards based on various criteria',
  inputSchema: z.object({
    search_text: z.string().optional().describe('Search in title and description'),
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    has_metrics: z.array(z.string()).optional().describe('Dashboards containing these metrics'),
    owner_id: z.string().optional().describe('Filter by owner'),
    sharing_level: z.enum(['private', 'team', 'organization', 'public']).optional(),
    created_after: z.string().datetime().optional(),
    created_before: z.string().datetime().optional(),
    sort_by: z.enum(['created_at', 'updated_at', 'title', 'relevance']).default('updated_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    limit: z.number().default(50),
    offset: z.number().default(0),
  }),
  outputSchema: z.object({
    dashboards: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        owner_name: z.string(),
        metric_count: z.number(),
        tags: z.array(z.string()),
        sharing_level: z.string(),
        created_at: z.string(),
        updated_at: z.string(),
        relevance_score: z.number().optional(),
      })
    ),
    total_count: z.number(),
    has_more: z.boolean(),
  }),
  execute: async ({ context }) => {
    return await filterDashboards(context as FilterDashboardsParams);
  },
});

const filterDashboards = wrapTraced(
  async (params: FilterDashboardsParams) => {
    // Simulate dashboard data - in real implementation would query database
    const simulatedDashboards = [
      {
        id: 'dash_abc123_1',
        title: 'Sales Dashboard',
        description: 'Overview of sales metrics and performance',
        owner_id: 'user_123',
        owner_name: 'John Smith',
        metric_count: 5,
        tags: ['sales', 'revenue', 'quarterly'],
        sharing_level: 'team',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-20T15:30:00Z',
        metrics: ['metric_abc123_1', 'metric_def456_2', 'metric_ghi789_3'],
      },
      {
        id: 'dash_def456_2',
        title: 'Customer Analytics',
        description: 'Customer behavior and engagement insights',
        owner_id: 'user_456',
        owner_name: 'Sarah Johnson',
        metric_count: 8,
        tags: ['customers', 'analytics', 'behavior'],
        sharing_level: 'organization',
        created_at: '2025-01-10T09:00:00Z',
        updated_at: '2025-01-22T11:15:00Z',
        metrics: ['metric_jkl012_4', 'metric_mno345_5'],
      },
      {
        id: 'dash_ghi789_3',
        title: 'Marketing Performance',
        description: 'Campaign effectiveness and ROI tracking',
        owner_id: 'user_789',
        owner_name: 'Mike Davis',
        metric_count: 6,
        tags: ['marketing', 'campaigns', 'roi'],
        sharing_level: 'private',
        created_at: '2025-01-18T14:00:00Z',
        updated_at: '2025-01-21T16:45:00Z',
        metrics: ['metric_pqr678_6'],
      },
      {
        id: 'dash_jkl012_4',
        title: 'Financial Overview',
        description: 'Revenue, costs, and profit analysis',
        owner_id: 'user_123',
        owner_name: 'John Smith',
        metric_count: 4,
        tags: ['finance', 'revenue', 'costs'],
        sharing_level: 'public',
        created_at: '2025-01-12T11:30:00Z',
        updated_at: '2025-01-19T13:20:00Z',
        metrics: ['metric_abc123_1', 'metric_stu901_7'],
      },
    ];

    // Apply filters
    let filteredDashboards = simulatedDashboards.filter((dashboard) => {
      // Search text filter
      if (params.search_text) {
        const searchLower = params.search_text.toLowerCase();
        const matchesText =
          dashboard.title.toLowerCase().includes(searchLower) ||
          dashboard.description?.toLowerCase().includes(searchLower);
        if (!matchesText) return false;
      }

      // Tags filter
      if (params.tags && params.tags.length > 0) {
        const hasMatchingTag = params.tags.some((tag) =>
          dashboard.tags.includes(tag.toLowerCase())
        );
        if (!hasMatchingTag) return false;
      }

      // Metrics filter
      if (params.has_metrics && params.has_metrics.length > 0) {
        const hasMatchingMetric = params.has_metrics.some((metricId) =>
          dashboard.metrics.includes(metricId)
        );
        if (!hasMatchingMetric) return false;
      }

      // Owner filter
      if (params.owner_id && dashboard.owner_id !== params.owner_id) {
        return false;
      }

      // Sharing level filter
      if (params.sharing_level && dashboard.sharing_level !== params.sharing_level) {
        return false;
      }

      // Date filters
      if (params.created_after) {
        if (new Date(dashboard.created_at) < new Date(params.created_after)) {
          return false;
        }
      }

      if (params.created_before) {
        if (new Date(dashboard.created_at) > new Date(params.created_before)) {
          return false;
        }
      }

      return true;
    });

    // Apply text search ranking if search_text provided
    if (params.search_text) {
      filteredDashboards = rankByTextRelevance(filteredDashboards, params.search_text);
    }

    // Apply sorting
    filteredDashboards = applySorting(filteredDashboards, params.sort_by, params.sort_order);

    const totalCount = filteredDashboards.length;

    // Apply pagination
    const paginatedDashboards = filteredDashboards.slice(
      params.offset,
      params.offset + params.limit
    );

    // Format results
    const formattedDashboards = paginatedDashboards.map((dashboard) => ({
      id: dashboard.id,
      title: dashboard.title,
      description: dashboard.description,
      owner_name: dashboard.owner_name,
      metric_count: dashboard.metric_count,
      tags: dashboard.tags,
      sharing_level: dashboard.sharing_level,
      created_at: dashboard.created_at,
      updated_at: dashboard.updated_at,
      relevance_score: (dashboard as DashboardWithRelevance).relevanceScore,
    }));

    return {
      dashboards: formattedDashboards,
      total_count: totalCount,
      has_more: params.offset + params.limit < totalCount,
    };
  },
  { name: 'filter-dashboards' }
);

function applySorting(
  dashboards: Dashboard[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Dashboard[] {
  return dashboards.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'updated_at':
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'relevance':
        comparison = (b.relevanceScore || 0) - (a.relevanceScore || 0);
        return comparison; // Relevance is always desc
      default:
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

function rankByTextRelevance(
  dashboards: Dashboard[],
  searchText: string
): DashboardWithRelevance[] {
  const searchTerms = searchText.toLowerCase().split(/\s+/);

  return dashboards
    .map((dashboard) => {
      let score = 0;
      const title = dashboard.title.toLowerCase();
      const description = (dashboard.description || '').toLowerCase();

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
        ...dashboard,
        relevanceScore: score,
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
    search_in: z
      .array(z.enum(['title', 'description', 'metric_titles', 'sql_queries']))
      .default(['title', 'description', 'metric_titles']),
    limit: z.number().default(20),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        dashboard_id: z.string(),
        dashboard_title: z.string(),
        matches: z.array(
          z.object({
            type: z.enum(['title', 'description', 'metric', 'sql']),
            content: z.string(),
            highlight: z.string(),
          })
        ),
        score: z.number(),
      })
    ),
    total_results: z.number(),
  }),
  execute: async ({ context }) => {
    return await searchDashboardContent(context as SearchContentParams);
  },
});

const searchDashboardContent = wrapTraced(
  async (params: SearchContentParams) => {
    const { search_in, limit } = params;

    // Simulate complex search that includes metric content
    const simulatedSearchResults = [
      {
        dashboard_id: 'dash_abc123_1',
        dashboard_title: 'Sales Dashboard',
        matches: [
          {
            type: 'title' as const,
            content: 'Sales Dashboard',
            highlight: '<mark>Sales</mark> Dashboard',
          },
          {
            type: 'metric' as const,
            content: 'Monthly Sales Revenue',
            highlight: 'Monthly <mark>Sales</mark> Revenue',
          },
        ],
        score: 25,
      },
      {
        dashboard_id: 'dash_def456_2',
        dashboard_title: 'Customer Analytics',
        matches: [
          {
            type: 'description' as const,
            content: 'Customer behavior and engagement insights',
            highlight: '<mark>Customer</mark> behavior and engagement insights',
          },
          {
            type: 'sql' as const,
            content: 'SELECT customer_id, COUNT(*) FROM orders',
            highlight: 'SELECT <mark>customer</mark>_id, COUNT(*) FROM orders',
          },
        ],
        score: 15,
      },
    ];

    // Filter results based on search_in preferences
    const filteredResults = simulatedSearchResults
      .map((result) => ({
        ...result,
        matches: result.matches.filter((match) => {
          if (match.type === 'metric' && !search_in.includes('metric_titles')) return false;
          if (match.type === 'sql' && !search_in.includes('sql_queries')) return false;
          if (match.type === 'title' && !search_in.includes('title')) return false;
          if (match.type === 'description' && !search_in.includes('description')) return false;
          return true;
        }),
      }))
      .filter((result) => result.matches.length > 0)
      .slice(0, limit);

    return {
      results: filteredResults,
      total_results: filteredResults.length,
    };
  },
  { name: 'search-dashboards-content' }
);
