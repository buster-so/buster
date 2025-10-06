import { checkPermission } from '@buster/access-controls';
import { getDashboardById } from '@buster/database/queries';
import {
  AssetIdParamsSchema,
  PutDashboardScreenshotRequestSchema,
  type PutScreenshotResponse,
} from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { uploadScreenshotHandler } from '../../../../../shared-helpers/upload-screenshot-handler';

const app = new Hono().put(
  '/',
  zValidator('json', PutDashboardScreenshotRequestSchema),
  zValidator('param', AssetIdParamsSchema),
  async (c) => {
    const assetId = c.req.valid('param').id;
    const { base64Image } = c.req.valid('json');
    const user = c.get('busterUser');

    const dashboard = await getDashboardById({ dashboardId: assetId });
    if (!dashboard) {
      throw new HTTPException(404, { message: 'Dashboard not found' });
    }

    const permission = await checkPermission({
      userId: user.id,
      assetId,
      assetType: 'dashboard_file',
      requiredRole: 'can_edit',
      workspaceSharing: dashboard.workspaceSharing,
      organizationId: dashboard.organizationId,
    });

    if (!permission.hasAccess) {
      throw new HTTPException(403, {
        message: 'You do not have permission to upload a screenshot for this dashboard',
      });
    }

    const result: PutScreenshotResponse = await uploadScreenshotHandler({
      assetType: 'dashboard_file',
      assetId,
      base64Image,
      organizationId: dashboard.organizationId,
    });

    return c.json(result);
  }
);

export default app;
