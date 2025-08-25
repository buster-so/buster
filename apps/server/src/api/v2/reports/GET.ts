import type { User } from '@buster/database';
import { getReportsWithPermissions } from '@buster/database';
import type { GetReportsListRequest, GetReportsListResponse } from '@buster/server-shared/reports';
import { GetReportsListRequestSchema } from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

async function getReportsListHandler(
  request: GetReportsListRequest,
  user: User
): Promise<GetReportsListResponse> {
  const { page, page_size, shared_with_me, only_my_reports } = request;

  const reports = await getReportsWithPermissions({
    userId: user.id,
    page,
    page_size,
    sharedWithMe: shared_with_me,
    onlyMyReports: only_my_reports,
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
