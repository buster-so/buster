import type { User } from '@buster/database';
import type {
  GetReportsListRequest,
  GetReportsListResponse,
  ReportListItem,
} from '@buster/server-shared/reports';
import { GetReportsListRequestSchema } from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

async function getReportsListHandler(
  request: GetReportsListRequest,
  user: User
): Promise<GetReportsListResponse> {
  const stubbedReports: ReportListItem[] = [
    {
      id: 'report-1',
      name: 'Sales Analysis Q4',
      file_name: 'sales_analysis_q4.md',
      description: 'Quarterly sales performance analysis',
      created_by_id: user.id,
      created_by_name: user.name,
      created_by_avatar: user.avatarUrl,
      last_edited: '2024-01-20T14:30:00Z',
      is_shared: false,
    },
    {
      id: 'report-2',
      name: 'Customer Metrics Dashboard',
      file_name: 'customer_metrics.md',
      description: 'Key customer engagement metrics',
      created_by_id: user.id,
      created_by_name: user.name,
      created_by_avatar: user.avatarUrl,
      last_edited: '2024-01-18T16:45:00Z',
      is_shared: false,
    },
    {
      id: 'report-3',
      name: 'Marketing Campaign Results',
      file_name: 'marketing_campaign_results.md',
      description: 'Analysis of recent marketing campaigns',
      created_by_id: user.id,
      created_by_name: user.name,
      created_by_avatar: user.avatarUrl,
      last_edited: '2024-01-12T11:15:00Z',
      is_shared: false,
    },
  ];

  const { page, page_size } = request;
  // Page is 1-based, so we need to subtract 1 for array indexing
  const startIndex = (page - 1) * page_size;
  const endIndex = startIndex + page_size;
  const paginatedReports: ReportListItem[] = stubbedReports.slice(startIndex, endIndex);

  const result: GetReportsListResponse = {
    data: paginatedReports,
    pagination: {
      page,
      page_size,
      total: stubbedReports.length,
      total_pages: Math.ceil(stubbedReports.length / page_size),
    },
  };

  return result;
}

const app = new Hono().get('/', zValidator('query', GetReportsListRequestSchema), async (c) => {
  const request = c.req.valid('query');
  const user = c.get('busterUser');

  const response = await getReportsListHandler(request, user);

  return c.json(response);
});

export default app;
