import { getUserOrganizationId, listCollections, type User } from '@buster/database/queries';
import {
  GetCollectionsRequestQuerySchema,
  type GetCollectionsResponse,
} from '@buster/server-shared/collections';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().get('/', zValidator('query', GetCollectionsRequestQuerySchema), async (c) => {
  const query = c.req.valid('query');
  const user = c.get('busterUser');

  const response: GetCollectionsResponse = await listCollectionsHandler(query, user);

  return c.json(response);
});

export default app;

interface ListCollectionsHandlerParams {
  page: number;
  page_size: number;
  shared_with_me?: boolean | undefined;
  owned_by_me?: boolean | undefined;
}

/**
 * Handler to list collections for the current user
 * Supports filtering by ownership and shared status
 */
async function listCollectionsHandler(
  params: ListCollectionsHandlerParams,
  user: User
): Promise<GetCollectionsResponse> {
  const { page, page_size, shared_with_me, owned_by_me } = params;

  const userOrganization = await getUserOrganizationId(user.id);
  if (!userOrganization) {
    return {
      data: [],
      pagination: {
        page: page,
        page_size: page_size,
        has_more: false,
      },
    };
  }

  return await listCollections({
    userId: user.id,
    organizationId: userOrganization.organizationId,
    page,
    page_size,
    shared_with_me,
    owned_by_me,
  });
}

