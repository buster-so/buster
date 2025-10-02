import { checkPermission } from '@buster/access-controls';
import { getMetricFileById } from '@buster/database/queries';
import { getAssetScreenshotSignedUrl } from '@buster/search';
import { AssetIdParamsSchema, type GetScreenshotResponse } from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get('/', zValidator('param', AssetIdParamsSchema), async (c) => {
  const metricId = c.req.valid('param').id;
  const user = c.get('busterUser');

  const metric = await getMetricFileById(metricId);
  if (!metric) {
    throw new HTTPException(404, { message: 'Metric not found' });
  }

  if (!metric.screenshotBucketKey) {
    const result: GetScreenshotResponse = {
      success: false,
      error: 'Screenshot not found',
    };
    return c.json(result);
  }

  const permission = await checkPermission({
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_view',
    workspaceSharing: metric.workspaceSharing,
    organizationId: metric.organizationId,
  });

  if (!permission.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this metric',
    });
  }

  try {
    const signedUrl = await getAssetScreenshotSignedUrl({
      key: metric.screenshotBucketKey,
      organizationId: metric.organizationId,
    });
    const result: GetScreenshotResponse = {
      success: true,
      url: signedUrl,
    };
    return c.json(result);
  } catch (error) {
    console.error('Failed to generate metric screenshot URL', {
      metricId,
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
