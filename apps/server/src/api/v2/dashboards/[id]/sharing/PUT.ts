import { checkPermission } from '@buster/access-controls';
import {
  bulkCreateAssetPermissions,
  findUsersByEmails,
  getDashboardById,
  getUserOrganizationId,
  updateDashboard,
} from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import { type ShareUpdateRequest, ShareUpdateRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { type Context, Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getDashboardHandler } from '../GET';

export async function updateDashboardShareHandler(
  dashboardId: string,
  request: ShareUpdateRequest,
  user: User & { organizationId: string },
  c: Context
) {
  // Check if dashboard exists
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
      message: 'You do not have permission to update sharing for this dashboard',
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
        assetId: dashboardId,
        assetType: 'dashboard_file' as const,
        role: mappedRole,
        createdBy: user.id,
      });
    }

    // Create/update permissions in bulk
    if (permissions.length > 0) {
      await bulkCreateAssetPermissions({ permissions });
    }
  }

  // Update dashboard sharing settings
  await updateDashboard({
    dashboardId,
    userId: user.id,
    publicly_accessible,
    public_expiry_date,
    public_password,
    workspace_sharing,
  });

  const updatedDashboard: GetDashboardResponse = await getDashboardHandler(
    { dashboardId },
    user,
    c
  );

  return updatedDashboard;
}

const app = new Hono().put('/', zValidator('json', ShareUpdateRequestSchema), async (c) => {
  const dashboardId = c.req.param('id');
  const request = c.req.valid('json');
  const user = c.get('busterUser');

  if (!dashboardId) {
    throw new HTTPException(404, { message: 'Dashboard not found' });
  }

  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, { message: 'User is not associated with an organization' });
  }

  const updatedDashboard: GetDashboardResponse = await updateDashboardShareHandler(
    dashboardId,
    request,
    {
      ...user,
      organizationId: userOrg.organizationId,
    },
    c
  );

  return c.json(updatedDashboard);
});

export default app;
