import type { User } from '@buster/database';
import { getReportsList } from '@buster/database';
import type { GetReportsListRequest, GetReportsListResponse } from '@buster/server-shared/reports';
import { GetReportsListRequestSchema } from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

async function getReportsListHandler(
  request: GetReportsListRequest,
  user: User
): Promise<GetReportsListResponse> {
  const { page, page_size } = request;

  const reports = await getReportsList({
    userId: user.id,
    page,
    page_size,
  });

  const result: GetReportsListResponse = reports;

  return result;
}

const app = new Hono().get('/', zValidator('query', GetReportsListRequestSchema), async (c) => {
  const request = c.req.valid('query');
  const user = c.get('busterUser');

  const response = await getReportsListHandler(request, user);

  return c.json(response);
});

export default app;
