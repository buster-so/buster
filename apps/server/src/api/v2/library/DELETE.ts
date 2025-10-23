import { checkPermission } from '@buster/access-controls';
import { bulkUpdateLibraryField, getUserOrganizationId } from '@buster/database/queries';
import type { LibraryDeleteRequestBody, LibraryDeleteResponse } from '@buster/server-shared';
import { LibraryDeleteRequestBodySchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().delete(
  '/',
  zValidator('json', LibraryDeleteRequestBodySchema),
  async (c) => {
    const assets = c.req.valid('json');
    const user = c.get('busterUser');

    const userOrg = await getUserOrganizationId(user.id);
    if (!userOrg) {
      throw new HTTPException(403, { message: 'User not associated with any organization' });
    }

    const failedAssets: LibraryDeleteResponse['failedItems'] = [];
    const assetsToUpdate: LibraryDeleteRequestBody = [];

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

      if (!asset || !permissionCheck) {
        continue;
      }

      if (permissionCheck.hasAccess) {
        assetsToUpdate.push(asset);
      } else {
        failedAssets.push({
          assetId: asset.assetId,
          assetType: asset.assetType,
          error: 'User does not have permission to save to library',
        });
      }
    }

    const updateResult = await bulkUpdateLibraryField(assetsToUpdate, user.id, false);
    const success = updateResult.success && failedAssets.length === 0;

    const output: LibraryDeleteResponse = {
      success,
      successItems: updateResult.successItems,
      failedItems: [...failedAssets, ...updateResult.failedItems],
    };

    return c.json(output);
  }
);

export default app;
