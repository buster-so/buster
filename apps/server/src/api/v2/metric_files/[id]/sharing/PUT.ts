import { checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import {
  bulkCreateAssetPermissions,
  findUsersByEmails,
  getMetricFileById,
  getUserOrganizationId,
  updateMetric,
} from '@buster/database/queries';
import type { ShareMetricUpdateResponse } from '@buster/server-shared/metrics';
import { type ShareUpdateRequest, ShareUpdateRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getMetricHandler } from '../getMetricHandler';

export async function updateMetricShareHandler(
  metricId: string,
  request: ShareUpdateRequest,
  user: User & { organizationId: string }
) {
  // Check if metric exists
  const metric = await getMetricFileById(metricId);
  if (!metric) {
    throw new HTTPException(404, { message: 'Metric not found' });
  }

  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'full_access',
    workspaceSharing: metric.workspaceSharing,
    organizationId: metric.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to update sharing for this metric',
    });
  }

  const { publicly_accessible, public_expiry_date, public_password, workspace_sharing, users } =
    request;

  // Handle user permissions if provided
  if (users && users.length > 0) {
    // Extract emails from the user permissions
    const emails = users.map((u) => u.email);

    // Find users by emails
    const userMap = await findUsersByEmails(emails);

    const permissions = [];

    for (const userPermission of users) {
      const targetUser = userMap.get(userPermission.email);

      if (!targetUser) {
        // Skip users that don't exist - you may want to collect these and return as warnings
        continue;
      }

      // Map ShareRole to AssetPermissionRole
      const roleMapping = {
        owner: 'owner',
        full_access: 'full_access',
        can_edit: 'can_edit',
        can_filter: 'can_filter',
        can_view: 'can_view',
        viewer: 'can_view', // Map viewer to can_view
      } as const;

      const mappedRole = roleMapping[userPermission.role];
      if (!mappedRole) {
        throw new HTTPException(400, {
          message: `Invalid role: ${userPermission.role} for user ${userPermission.email}`,
        });
      }

      permissions.push({
        identityId: targetUser.id,
        identityType: 'user' as const,
        assetId: metricId,
        assetType: 'metric_file' as const,
        role: mappedRole,
        createdBy: user.id,
      });
    }

    // Create/update permissions in bulk
    if (permissions.length > 0) {
      await bulkCreateAssetPermissions({ permissions });
    }
  }

  // Update metric sharing settings
  await updateMetric({
    metricId,
    userId: user.id,
    publicly_accessible,
    public_expiry_date,
    public_password,
    workspace_sharing,
  });

  const updatedMetric: ShareMetricUpdateResponse = await getMetricHandler({ metricId }, user);

  return updatedMetric;
}

const app = new Hono().put('/', zValidator('json', ShareUpdateRequestSchema), async (c) => {
  const metricId = c.req.param('id');
  const request = c.req.valid('json');
  const user = c.get('busterUser');

  if (!metricId) {
    throw new HTTPException(404, { message: 'Metric not found' });
  }

  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, { message: 'User is not associated with an organization' });
  }

  const updatedMetric: ShareMetricUpdateResponse = await updateMetricShareHandler(
    metricId,
    request,
    {
      ...user,
      organizationId: userOrg.organizationId,
    }
  );

  return c.json(updatedMetric);
});

export default app;
