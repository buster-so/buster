import { checkPermission } from '@buster/access-controls';
import { getDashboardById, listAssetPermissions } from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { ShareGetResponse } from '@buster/server-shared/reports';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function getDashboardSharingHandler(
  dashboardId: string,
  user: User
): Promise<ShareGetResponse> {
  // Check if dashboard exists
  const dashboard = await getDashboardById({ dashboardId });
  if (!dashboard) {
    throw new HTTPException(404, { message: 'Dashboard not found' });
  }

  // Check if user has permission to view the dashboard
  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: dashboardId,
    assetType: 'dashboard_file',
    requiredRole: 'can_view',
    workspaceSharing: dashboard.workspaceSharing,
    organizationId: dashboard.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this dashboard',
    });
  }

  // Get all permissions for the dashboard
  const permissions = await listAssetPermissions({
    assetId: dashboardId,
    assetType: 'dashboard_file',
  });

  return {
    permissions,
  };
}

const app = new Hono().get('/', async (c) => {
  const dashboardId = c.req.param('id');
  const user = c.get('busterUser');

  if (!dashboardId) {
    throw new HTTPException(400, { message: 'Dashboard ID is required' });
  }

  const result = await getDashboardSharingHandler(dashboardId, user);

  return c.json(result);
});

export default app;
