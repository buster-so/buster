import { checkPermission } from '@buster/access-controls';
import { getDashboardById } from '@buster/database/queries';
import {
  GetDashboardScreenshotParamsSchema,
  GetDashboardScreenshotQuerySchema,
} from '@buster/server-shared/screenshots';
import { getDashboardScreenshot } from '@buster/server-shared/screenshots/methods';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createImageResponse } from '../../../../../shared-helpers/create-image-response';
import { standardErrorHandler } from '../../../../../utils/response';

const app = new Hono()
  .get(
    '/',

    zValidator('param', GetDashboardScreenshotParamsSchema),
    zValidator('query', GetDashboardScreenshotQuerySchema),
    async (c) => {
      const dashboardId = c.req.valid('param').id;
      const search = c.req.valid('query');
      const user = c.get('busterUser');

      const dashboard = await getDashboardById({ dashboardId });
      if (!dashboard) {
        throw new HTTPException(404, { message: 'Dashboard not found' });
      }

      const permission = await checkPermission({
        userId: user.id,
        assetId: dashboardId,
        assetType: 'chat',
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
        const screenshotBuffer = await getDashboardScreenshot({
          ...search,
          dashboardId,
          supabaseCookieKey: c.get('supabaseCookieKey'),
          supabaseUser: c.get('supabaseUser'),
          accessToken: c.get('accessToken'),
          organizationId: dashboard.organizationId,
        });

        return createImageResponse(screenshotBuffer, search.type);
      } catch (error) {
        console.error('Failed to generate chat screenshot URL', {
          dashboardId,
          error,
        });
        throw new Error('Failed to generate dashboard screenshot URL');
      }
    }
  )
  .onError(standardErrorHandler);

export default app;
