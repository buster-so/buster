import { getUserOrganizationId, listPermissionedLibraryAssets } from '@buster/database/queries';
import { getAssetScreenshotSignedUrl } from '@buster/search';
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
      const dbResponse = await listPermissionedLibraryAssets({
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

      // Convert screenshot bucket keys to signed URLs
      const dataWithUrls = await Promise.all(
        dbResponse.data.map(async (asset) => {
          let screenshotUrl: string | null = null;
          if (asset.screenshot_url) {
            try {
              screenshotUrl = await getAssetScreenshotSignedUrl({
                key: asset.screenshot_url,
                organizationId: userOrg.organizationId,
              });
            } catch (error) {
              console.error('Failed to generate screenshot URL:', error);
            }
          }
          return {
            ...asset,
            screenshot_url: screenshotUrl,
          };
        })
      );

      const response: LibraryGetResponse = {
        ...dbResponse,
        data: dataWithUrls,
      };

      return c.json(response);
    } catch (error) {
      console.error('Error while listing permissioned library assets:', error);
      throw new HTTPException(500, { message: 'Error while listing library assets' });
    }
  }
);

export default app;
