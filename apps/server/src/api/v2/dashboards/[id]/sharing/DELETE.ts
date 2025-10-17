import { checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import {
  findUsersByEmails,
  getDashboardById,
  removeAssetPermission,
} from '@buster/database/queries';
import type { ShareDeleteRequest, ShareDeleteResponse } from '@buster/server-shared/share';
import { ShareDeleteRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function deleteDashboardSharingHandler(
  dashboardId: string,
  emails: ShareDeleteRequest,
  user: User
): Promise<ShareDeleteResponse> {
  // Get the dashboard to verify it exists and get owner info
  const dashboard = await getDashboardById({ dashboardId });
  if (!dashboard) {
    throw new HTTPException(404, { message: 'Dashboard not found' });
  }

  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: dashboardId,
    assetType: 'dashboard_file',
    requiredRole: 'full_access',
    workspaceSharing: dashboard.workspaceSharing,
    organizationId: dashboard.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to delete sharing for this dashboard',
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
    if (targetUser.id === dashboard.createdBy) {
      continue; // Skip the owner
    }

    // Remove the permission
    await removeAssetPermission({
      identityId: targetUser.id,
      identityType: 'user',
      assetId: dashboardId,
      assetType: 'dashboard_file',
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
  const dashboardId = c.req.param('id');
  const emails = c.req.valid('json');
  const user = c.get('busterUser');

  if (!dashboardId) {
    throw new HTTPException(400, { message: 'Dashboard ID is required' });
  }

  const result = await deleteDashboardSharingHandler(dashboardId, emails, user);

  return c.json(result);
});

export default app;
