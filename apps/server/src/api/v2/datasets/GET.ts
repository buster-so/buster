import {
  getUserOrganizationId,
  type ListDatasetResult,
  listOrganizationDatasets,
  listPermissionedDatasets,
  type User,
} from '@buster/database/queries';
import {
  type ListDatasetsQuery,
  ListDatasetsQuerySchema,
  type ListDatasetsResponse,
} from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

export const listDatasetsRoute = app.get(
  '/',
  zValidator('query', ListDatasetsQuerySchema),
  async (c) => {
    try {
      const user = c.get('busterUser') as User;

      const query = c.req.valid('query');
      const response: ListDatasetsResponse = await listDatasetsHandler(user, query);
      return c.json(response, 200);
    } catch (error) {
      // Log errors only
      if (!(error instanceof HTTPException)) {
        console.error('[GET /datasets] Unexpected error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        });
      }

      // Re-throw HTTPExceptions as-is
      if (error instanceof HTTPException) {
        throw error;
      }

      // Wrap other errors as 500
      throw new HTTPException(500, {
        message: 'Internal server error',
      });
    }
  }
);

export default app;

/**
 * Handler for listing datasets
 *
 * 1. Get user's organization and role
 * 2. Based on role, list datasets:
 *    - WorkspaceAdmin, DataAdmin, Querier: List all organization datasets with filters
 *    - RestrictedQuerier: List only datasets user has permission to access
 *    - Viewer: Return empty array
 * 3. Format and return response
 */
async function listDatasetsHandler(
  user: User,
  query: ListDatasetsQuery
): Promise<ListDatasetsResponse> {
  // Step 1: Get user's organization and role
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    return [];
  }

  // Step 2: List datasets based on user role
  let datasetResults: ListDatasetResult[] = [];

  if (
    userOrg.role === 'workspace_admin' ||
    userOrg.role === 'data_admin' ||
    userOrg.role === 'querier'
  ) {
    datasetResults = await listOrganizationDatasets({
      organizationId: userOrg.organizationId,
      page: query.page,
      page_size: query.page_size,
      enabled: query.enabled,
      imported: query.imported,
      dataSourceId: query.data_source_id,
    });
  } else if (userOrg.role === 'restricted_querier') {
    datasetResults = await listPermissionedDatasets(user.id, query.page, query.page_size);
  } else if (userOrg.role === 'viewer') {
    datasetResults = [];
  } else {
    const _exhaustiveCheck: never = userOrg.role;
    throw new Error(`Unhandled user role: ${_exhaustiveCheck}`);
  }

  // Step 3: Format response
  const response: ListDatasetsResponse = datasetResults.map((dataset) => ({
    id: dataset.id,
    name: dataset.name,
    data_source: {
      id: dataset.dataSourceId,
      name: dataset.dataSourceName,
    },
    last_queried: null,
    created_at: dataset.createdAt,
    updated_at: dataset.updatedAt,
    enabled: dataset.enabled,
    imported: dataset.imported,
    owner: {
      id: dataset.userId,
      name: dataset.userName || dataset.userEmail,
      avatar_url: dataset.userAvatarUrl,
    },
    belongs_to: null,
  }));

  return response;
}
