import { getUserOrganizationId, listPermissionedLibraryAssets } from '@buster/database/queries';
import { GetLibraryAssetsRequestQuerySchema, type LibraryGetResponse } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get(
  '/',
  zValidator('query', GetLibraryAssetsRequestQuerySchema),
  async (c) => {
    const { page, page_size, assetTypes, endDate, startDate, includeCreatedBy, excludeCreatedBy } =
      c.req.valid('query');
    const user = c.get('busterUser');

    // Get user's organization
    const userOrg = await getUserOrganizationId(user.id);
    if (!userOrg?.organizationId) {
      throw new HTTPException(403, { message: 'User not associated with any organization' });
    }
    try {
      const response: LibraryGetResponse = await listPermissionedLibraryAssets({
        userId: user.id,
        organizationId: userOrg.organizationId,
        page,
        page_size,
        assetTypes,
        endDate,
        startDate,
        includeCreatedBy,
        excludeCreatedBy,
      });
      return c.json(response);
    } catch (error) {
      console.error('Error while listing permissioned library assets:', error);
      throw new HTTPException(500, { message: 'Error while listing library assets' });
    }
  }
);

export default app;
