import { getUserOrganizationId, listPermissionedSharedAssets } from '@buster/database/queries';
import type { AssetListItem } from '@buster/database/schema-types';
import { getAssetScreenshotSignedUrl } from '@buster/search';
import { type AssetGetResponse, GetAssetsRequestQuerySchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get('/', zValidator('query', GetAssetsRequestQuerySchema), async (c) => {
  const {
    page,
    page_size,
    assetTypes,
    endDate,
    startDate,
    includeCreatedBy,
    excludeCreatedBy,
    ordering,
    orderingDirection,
    groupBy,
    query,
    includeAssetChildren,
    pinCollections,
  } = c.req.valid('query');
  const user = c.get('busterUser');

  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    // If user is not associated with an organization, return an empty response
    const output: AssetGetResponse = {
      data: [],
      pagination: {
        page,
        page_size,
        has_more: false,
      },
    };
    return c.json(output);
  }

  try {
    const dbResponse = await listPermissionedSharedAssets({
      userId: user.id,
      organizationId: userOrg.organizationId,
      page,
      page_size,
      assetTypes,
      endDate,
      startDate,
      includeCreatedBy,
      excludeCreatedBy,
      ordering,
      orderingDirection,
      groupBy,
      query,
      includeAssetChildren,
      pinCollections,
    });

    // Helper function to convert screenshot bucket keys to signed URLs
    const convertScreenshotUrl = async (asset: AssetListItem) => {
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
    };

    // Handle grouped vs non-grouped responses
    let response: AssetGetResponse;
    if ('groups' in dbResponse) {
      // Grouped response
      const groupsWithUrls: Record<string, AssetListItem[]> = {};
      for (const [groupKey, assets] of Object.entries(dbResponse.groups)) {
        groupsWithUrls[groupKey] = await Promise.all(assets.map(convertScreenshotUrl));
      }
      response = {
        ...dbResponse,
        groups: groupsWithUrls,
      };
    } else {
      // Regular paginated response
      const dataWithUrls = await Promise.all(dbResponse.data.map(convertScreenshotUrl));
      response = {
        ...dbResponse,
        data: dataWithUrls,
      };
    }

    return c.json(response);
  } catch (error) {
    console.error('Error while listing permissioned library assets:', error);
    throw new HTTPException(500, { message: 'Error while listing library assets' });
  }
});

export default app;
