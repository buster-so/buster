import type { User } from '@buster/database/queries';
import { getUserOrganizationId, listDataSources } from '@buster/database/queries';
import type { ListDataSourcesQuery, ListDataSourcesResponse } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for listing data sources
 *
 * Flow:
 * 1. Get user's organization
 * 2. Call database query with org filtering and pagination
 * 3. Return paginated response
 */
export async function listDataSourcesHandler(
  user: User,
  query: ListDataSourcesQuery
): Promise<ListDataSourcesResponse> {
  // Step 1: Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to view data sources',
    });
  }

  // Step 2: Query data sources with pagination
  const result = await listDataSources({
    organizationId: userOrg.organizationId,
    page: query.page,
    pageSize: query.pageSize,
  });

  // Step 3: Return response
  return result;
}
