import { checkPermission } from '@buster/access-controls';
import { getMetricFileById } from '@buster/database/queries';
import {
  AssetIdParamsSchema,
  PutScreenshotRequestSchema,
  type PutScreenshotResponse,
} from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { uploadScreenshotHandler } from '../../../../../shared-helpers/upload-screenshot-handler';

const app = new Hono().put(
  '/',
  zValidator('json', PutScreenshotRequestSchema),
  zValidator('param', AssetIdParamsSchema),
  async (c) => {
    const assetId = c.req.valid('param').id;
    const { base64Image } = c.req.valid('json');
    const user = c.get('busterUser');

    const metric = await getMetricFileById(assetId);
    if (!metric) {
      throw new HTTPException(404, { message: 'Metric not found' });
    }

    const permission = await checkPermission({
      userId: user.id,
      assetId,
      assetType: 'metric_file',
      requiredRole: 'can_edit',
      workspaceSharing: metric.workspaceSharing,
      organizationId: metric.organizationId,
    });

    if (!permission.hasAccess) {
      throw new HTTPException(403, {
        message: 'You do not have permission to upload a screenshot for this metric',
      });
    }

    const result: PutScreenshotResponse = await uploadScreenshotHandler({
      assetType: 'metric_file',
      assetId,
      base64Image,
      organizationId: metric.organizationId,
    });

    return c.json(result);
  }
);

export default app;
