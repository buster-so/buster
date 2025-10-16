import { checkPermission } from '@buster/access-controls';
import { bulkUpdateLibraryField, getUserOrganizationId } from '@buster/database/queries';
import {
  type LibraryPostRequestBody,
  LibraryPostRequestBodySchema,
  type LibraryPostResponse,
} from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().post('/', zValidator('json', LibraryPostRequestBodySchema), async (c) => {
  const assets = c.req.valid('json');
  const user = c.get('busterUser');

  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg) {
    throw new HTTPException(403, { message: 'User not associated with any organization' });
  }

  const failedAssets: LibraryPostResponse['failedItems'] = [];
  const assetsToSave: LibraryPostRequestBody = [];

  // User needs direct full_access permissions to save to library
  const permissionCheckPromises = assets.map((asset) =>
    checkPermission({
      userId: user.id,
      assetId: asset.assetId,
      assetType: asset.assetType,
      organizationId: userOrg.organizationId,
      requiredRole: 'full_access',
    })
  );

  const permissionChecks = await Promise.all(permissionCheckPromises);

  for (let i = 0; i < assets.length; i++) {
    const permissionCheck = permissionChecks[i];
    const asset = assets[i];
    if (permissionCheck && asset) {
      if (permissionCheck.hasAccess) {
        assetsToSave.push(asset);
      } else {
        failedAssets.push({
          assetId: asset.assetId,
          assetType: asset.assetType,
          error: 'User does not have permission to save to library',
        });
      }
    }
  }

  const savedAssetResponse = await bulkUpdateLibraryField(assetsToSave, true);
  const success = savedAssetResponse.success && failedAssets.length === 0;

  const output: LibraryPostResponse = {
    success,
    successItems: savedAssetResponse.successItems,
    failedItems: [...failedAssets, ...savedAssetResponse.failedItems],
  };

  return c.json(output);
});

export default app;
