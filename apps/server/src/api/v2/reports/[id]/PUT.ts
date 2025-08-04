import type { User } from '@buster/database';
import type { UpdateReportRequest, UpdateReportResponse } from '@buster/server-shared/reports';
import { UpdateReportRequestSchema } from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

async function updateReportHandler(
  reportId: string,
  request: UpdateReportRequest,
  user: User
): Promise<UpdateReportResponse> {
  const existingReport: UpdateReportResponse = {
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
        type: 'h1' as const,
        children: [{ text: 'Sales Analysis Q4' }],
      },
      {
        type: 'p' as const,
        children: [{ text: 'This report analyzes our Q4 sales performance.' }],
      },
    ],
  };

  if (!reportId || reportId === 'invalid') {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  const updatedReport: UpdateReportResponse = {
    ...existingReport,
    ...(request as Partial<UpdateReportResponse>),
    updated_at: new Date().toISOString(),
  };

  return updatedReport;
}

const app = new Hono().put('/', zValidator('json', UpdateReportRequestSchema), async (c) => {
  const reportId = c.req.param('id');
  const request = c.req.valid('json');
  const user = c.get('busterUser');

  if (!reportId) {
    throw new HTTPException(404, { message: 'Report ID is required' });
  }

  const response = await updateReportHandler(reportId, request, user);
  return c.json(response);
});

export default app;
