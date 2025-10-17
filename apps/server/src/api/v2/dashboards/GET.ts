import { type User, listDashboards } from '@buster/database/queries';
import {
  GetDashboardsQuerySchema,
  type GetDashboardsResponse,
} from '@buster/server-shared/dashboards';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().get('/', zValidator('query', GetDashboardsQuerySchema), async (c) => {
  const query = c.req.valid('query');
  const user = c.get('busterUser');

  console.info(
    `Processing GET request for dashboards list, user_id: ${user.id}, page: ${query.page_token}, page_size: ${query.page_size}`
  );

  const response: GetDashboardsResponse = await listDashboardsHandler(query, user);

  return c.json(response);
});

export default app;

interface ListDashboardsHandlerParams {
  page_token: number;
  page_size: number;
  shared_with_me?: boolean | undefined;
  only_my_dashboards?: boolean | undefined;
}

/**
 * Handler to list dashboards for the current user
 * Supports filtering by ownership and shared status
 */
async function listDashboardsHandler(
  params: ListDashboardsHandlerParams,
  user: User
): Promise<GetDashboardsResponse> {
  const { page_token, page_size, shared_with_me, only_my_dashboards } = params;

  const result = await listDashboards({
    userId: user.id,
    page: page_token,
    page_size,
    shared_with_me,
    only_my_dashboards,
  });

  return result;
}
