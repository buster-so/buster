import { checkPermission } from '@buster/access-controls';
import { getMetricFileById } from '@buster/database/queries';
import {
  GetMetricScreenshotParamsSchema,
  GetMetricScreenshotQuerySchema,
} from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createImageResponse } from '../../../../../shared-helpers/create-image-response';
import { standardErrorHandler } from '../../../../../utils/response';
import { getMetricScreenshotHandler } from './getMetricScreenshotHandler';

const app = new Hono()
  .get(
    '/',
    zValidator('param', GetMetricScreenshotParamsSchema),
    zValidator('query', GetMetricScreenshotQuerySchema),
    async (c) => {
      const metricId = c.req.valid('param').id;
      const { version_number, width, height, type } = c.req.valid('query');
      const user = c.get('busterUser');

      const metric = await getMetricFileById(metricId);
      if (!metric) {
        throw new HTTPException(404, { message: 'Metric not found' });
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
        const screenshotBuffer = await getMetricScreenshotHandler({
          metricId,
          width,
          height,
          version_number,
          context: c,
        });

        return createImageResponse(screenshotBuffer, type);
      } catch (error) {
        console.error('Failed to generate metric image', {
          metricId,
          error,
        });
        throw new Error('Failed to generate metric image');
      }
    }
  )
  .onError(standardErrorHandler);

export default app;
