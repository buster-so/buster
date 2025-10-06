import { checkPermission } from '@buster/access-controls';
import { getMetricFileById, listAssetPermissions } from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { ShareGetResponse } from '@buster/server-shared/reports';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function getMetricSharingHandler(
  metricId: string,
  user: User
): Promise<ShareGetResponse> {
  // Check if metric exists
  const metric = await getMetricFileById(metricId);
  if (!metric) {
    throw new HTTPException(404, { message: 'Metric not found' });
  }

  // Check if user has permission to view the metric
  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_view',
    workspaceSharing: metric.workspaceSharing,
    organizationId: metric.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this metric',
    });
  }

  // Get all permissions for the metric
  const permissions = await listAssetPermissions({
    assetId: metricId,
    assetType: 'metric_file',
  });

  return {
    permissions,
  };
}

const app = new Hono().get('/', async (c) => {
  const metricId = c.req.param('id');
  const user = c.get('busterUser');

  if (!metricId) {
    throw new HTTPException(400, { message: 'Metric ID is required' });
  }

  const result = await getMetricSharingHandler(metricId, user);

  return c.json(result);
});

export default app;
