import { getUserOrganizationId, listPermissionedLibraryAssets } from '@buster/database/queries';
import type { AssetListItem, GroupedAssetsKeys } from '@buster/database/schema-types';
import { getAssetScreenshotSignedUrl } from '@buster/search';
import { type AssetGetResponse, GetAssetsRequestQuerySchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { convertScreenshotUrl } from '@shared-helpers/screenshots';
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
      ordering,
      orderingDirection,
      groupBy,
      query,
      includeAssetChildren,
      pinCollections,
    });

    // Handle grouped vs non-grouped responses
    let response: AssetGetResponse;
    if ('groups' in dbResponse) {
      // Grouped response
      const groupsWithUrls: Partial<Record<GroupedAssetsKeys, AssetListItem[]>> = {};
      for (const [groupKey, assets] of Object.entries(dbResponse.groups) as [
        GroupedAssetsKeys,
        AssetListItem[],
      ][]) {
        groupsWithUrls[groupKey] = await Promise.all(
          assets.map((asset) => convertScreenshotUrl(asset, userOrg.organizationId))
        );
      }
      response = {
        ...dbResponse,
        groups: groupsWithUrls,
      };
    } else {
      // Regular paginated response
      const dataWithUrls = await Promise.all(
        dbResponse.data.map((asset) => convertScreenshotUrl(asset, userOrg.organizationId))
      );
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
