import { checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import {
  bulkCreateAssetPermissions,
  findUsersByEmails,
  getDashboardById,
} from '@buster/database/queries';
import type { SharePostRequest, SharePostResponse } from '@buster/server-shared/share';
import { SharePostRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function createDashboardSharingHandler(
  dashboardId: string,
  shareRequests: SharePostRequest,
  user: User
): Promise<SharePostResponse> {
  // Get the dashboard to verify it exists
  const dashboard = await getDashboardById({ dashboardId });
  if (!dashboard) {
    throw new HTTPException(404, { message: 'Dashboard not found' });
  }

  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: dashboardId,
    assetType: 'dashboard_file',
    requiredRole: 'can_edit',
    workspaceSharing: dashboard.workspaceSharing,
    organizationId: dashboard.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to edit this dashboard',
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
      assetId: dashboardId,
      assetType: 'dashboard_file' as const,
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
  const dashboardId = c.req.param('id');
  const shareRequests = c.req.valid('json');
  const user = c.get('busterUser');

  if (!dashboardId) {
    throw new HTTPException(400, { message: 'Dashboard ID is required' });
  }

  const result = await createDashboardSharingHandler(dashboardId, shareRequests, user);

  return c.json(result);
});

export default app;
