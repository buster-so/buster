import { checkPermission } from '@buster/access-controls';
import {
  bulkCreateAssetPermissions,
  findUsersByEmails,
  getMetricFileById,
} from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { SharePostResponse } from '@buster/server-shared/share';
import type { SharePostRequest } from '@buster/server-shared/share';
import { SharePostRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { checkIfAssetIsEditable } from '../../../../../shared-helpers/asset-public-access';

export async function createMetricSharingHandler(
  metricId: string,
  shareRequests: SharePostRequest,
  user: User
): Promise<SharePostResponse> {
  // Get the metric to verify it exists
  const metric = await getMetricFileById(metricId);
  if (!metric) {
    throw new HTTPException(404, { message: 'Metric not found' });
  }

  // Check if user has permission to edit the metric
  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_edit',
    workspaceSharing: metric.workspaceSharing,
    organizationId: metric.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to edit this metric',
    });
  }

  // Extract emails from the share requests
  const emails = shareRequests.map((req) => req.email);

  // Find users by emails
  const userMap = await findUsersByEmails(emails);

  const permissions = [];
  const sharedEmails = [];
  const notFoundEmails = [];

  for (const shareRequest of shareRequests) {
    const targetUser = userMap.get(shareRequest.email);

    if (!targetUser) {
      notFoundEmails.push(shareRequest.email);
      continue;
    }

    sharedEmails.push(shareRequest.email);

    // Map ShareRole to AssetPermissionRole
    const roleMapping = {
      owner: 'owner',
      full_access: 'full_access',
      can_edit: 'can_edit',
      can_filter: 'can_filter',
      can_view: 'can_view',
      viewer: 'can_view', // Map viewer to can_view
    } as const;

    const mappedRole = roleMapping[shareRequest.role];
    if (!mappedRole) {
      throw new HTTPException(400, {
        message: `Invalid role: ${shareRequest.role} for user ${shareRequest.email}`,
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

  // Create permissions in bulk
  if (permissions.length > 0) {
    await bulkCreateAssetPermissions({ permissions });
  }

  return {
    success: true,
    shared: sharedEmails,
    notFound: notFoundEmails,
  };
}

const app = new Hono().post('/', zValidator('json', SharePostRequestSchema), async (c) => {
  const metricId = c.req.param('id');
  const shareRequests = c.req.valid('json');
  const user = c.get('busterUser');

  if (!metricId) {
    throw new HTTPException(400, { message: 'Metric ID is required' });
  }

  const result = await createMetricSharingHandler(metricId, shareRequests, user);

  return c.json(result);
});

export default app;
