import { checkPermission } from '@buster/access-controls';
import { getDashboardById } from '@buster/database/queries';
import { getAssetScreenshotSignedUrl } from '@buster/search';
import { AssetIdParamsSchema, type GetScreenshotResponse } from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get('/', zValidator('param', AssetIdParamsSchema), async (c) => {
  const dashboardId = c.req.valid('param').id;
  const user = c.get('busterUser');

  const dashboard = await getDashboardById({ dashboardId });
  if (!dashboard) {
    throw new HTTPException(404, { message: 'Dashboard not found' });
  }

  if (!dashboard.screenshotBucketKey) {
    const result: GetScreenshotResponse = {
      success: false,
      error: 'Screenshot not found',
    };
    return c.json(result);
  }

  const permission = await checkPermission({
    userId: user.id,
    assetId: dashboardId,
    assetType: 'dashboard_file',
    requiredRole: 'can_view',
    workspaceSharing: dashboard.workspaceSharing,
    organizationId: dashboard.organizationId,
  });

  if (!permission.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this dashboard',
    });
  }

  try {
    const signedUrl = await getAssetScreenshotSignedUrl({
      key: dashboard.screenshotBucketKey,
      organizationId: dashboard.organizationId,
    });
    const result: GetScreenshotResponse = {
      success: true,
      url: signedUrl,
    };
    return c.json(result);
  } catch (error) {
    console.error('Failed to generate dashboard screenshot URL', {
      dashboardId,
      error,
    });
    const result: GetScreenshotResponse = {
      success: false,
      error: 'Failed to generate screenshot URL',
    };
    return c.json(result);
  }
});

export default app;
