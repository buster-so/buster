import type { User } from '@buster/database';
import type {
  GetReportIndividualResponse,
  ReportIndividualResponse,
} from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

async function getReportHandler(
  reportId: string,
  user: User
): Promise<GetReportIndividualResponse> {
  return {
    id: reportId,
    name: 'Sales Analysis Q4',
    file_name: 'sales_analysis_q4.md',
    description: 'Quarterly sales performance analysis',
    created_by: user.id,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    deleted_at: null,
    publicly_accessible: false,
    content: [
      {
        type: 'h1',
        children: [{ text: 'Sales Analysis Q4' }],
      },
      {
        type: 'p',
        children: [{ text: 'This report analyzes our Q4 sales performance.' }],
      },
      {
        type: 'metric',
        metricId: '123',
        children: [{ text: '' }],
        caption: [{ text: 'This is a metric' }],
      },
    ],
  };
}

const app = new Hono().get('/', async (c) => {
  const reportId = c.req.param('id');
  const user = c.get('busterUser');

  if (!reportId) {
    throw new HTTPException(404, { message: 'Report ID is required' });
  }

  const response: GetReportIndividualResponse = await getReportHandler(reportId, user);
  return c.json(response);
});

export default app;
