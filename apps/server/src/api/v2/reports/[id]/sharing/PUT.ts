import {
  bulkCreateAssetPermissions,
  checkAssetPermission,
  findUsersByEmails,
  getReport,
  getUserOrganizationId,
  updateReport,
} from '@buster/database';
import type { User } from '@buster/database';
import type { ShareUpdateResponse, UpdateReportResponse } from '@buster/server-shared/reports';
import { type ShareUpdateRequest, ShareUpdateRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getReportHandler } from '../GET';

export async function updateReportShareHandler(
  reportId: string,
  request: ShareUpdateRequest,
  user: User & { organizationId: string }
) {
  // Check if user has permission to edit asset permissions
  const permissionCheck = await checkAssetPermission({
    assetId: reportId,
    assetType: 'report_file',
    userId: user.id,
  });

  // Check if user has at least full_access permission
  if (
    !permissionCheck.hasAccess ||
    (permissionCheck.role !== 'full_access' && permissionCheck.role !== 'owner')
  ) {
    throw new HTTPException(403, {
      message: 'User does not have permission to edit asset permissions',
    });
  }

  // Check if report exists
  const report = await getReport({ reportId, userId: user.id });
  if (!report) {
    throw new HTTPException(404, { message: 'Report not found' });
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
        assetId: reportId,
        assetType: 'report_file' as const,
        role: mappedRole,
        createdBy: user.id,
      });
    }

    // Create/update permissions in bulk
    if (permissions.length > 0) {
      await bulkCreateAssetPermissions({ permissions });
    }
  }

  // Update report sharing settings
  await updateReport(
    {
      reportId,
      userId: user.id,
      publicly_accessible,
      public_expiry_date,
      public_password,
      workspace_sharing,
    },
    false
  );

  const updatedReport: UpdateReportResponse = await getReportHandler(reportId, user);

  return updatedReport;
}

const app = new Hono().put('/', zValidator('json', ShareUpdateRequestSchema), async (c) => {
  const reportId = c.req.param('id');
  const request = c.req.valid('json');
  const user = c.get('busterUser');

  if (!reportId) {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, { message: 'User is not associated with an organization' });
  }

  const updatedReport: ShareUpdateResponse = await updateReportShareHandler(reportId, request, {
    ...user,
    organizationId: userOrg.organizationId,
  });

  return c.json(updatedReport);
});

export default app;
