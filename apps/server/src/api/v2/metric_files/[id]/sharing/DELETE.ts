import { checkPermission } from '@buster/access-controls';
import {
  findUsersByEmails,
  getMetricFileById,
  removeAssetPermission,
} from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { ShareDeleteResponse } from '@buster/server-shared/share';
import type { ShareDeleteRequest } from '@buster/server-shared/share';
import { ShareDeleteRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function deleteMetricSharingHandler(
  metricId: string,
  emails: ShareDeleteRequest,
  user: User
): Promise<ShareDeleteResponse> {
  // Get the metric to verify it exists and get owner info
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
      message: 'You do not have permission to delete sharing for this metric',
    });
  }

  // Find users by emails
  const userMap = await findUsersByEmails(emails);

  const removedEmails = [];
  const notFoundEmails = [];

  for (const email of emails) {
    const targetUser = userMap.get(email);

    if (!targetUser) {
      notFoundEmails.push(email);
      continue;
    }

    // Don't allow removing permissions from the owner
    if (targetUser.id === metric.createdBy) {
      continue; // Skip the owner
    }

    // Remove the permission
    await removeAssetPermission({
      identityId: targetUser.id,
      identityType: 'user',
      assetId: metricId,
      assetType: 'metric_file',
      updatedBy: user.id,
    });

    removedEmails.push(email);
  }

  return {
    success: true,
    removed: removedEmails,
    notFound: notFoundEmails,
  };
}

const app = new Hono().delete('/', zValidator('json', ShareDeleteRequestSchema), async (c) => {
  const metricId = c.req.param('id');
  const emails = c.req.valid('json');
  const user = c.get('busterUser');

  if (!metricId) {
    throw new HTTPException(400, { message: 'Metric ID is required' });
  }

  const result = await deleteMetricSharingHandler(metricId, emails, user);

  return c.json(result);
});

export default app;
