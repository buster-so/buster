import { checkPermission } from '@buster/access-controls';
import {
  checkAssetPermission,
  getReportFileById,
  listAssetPermissions,
} from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { ShareGetResponse } from '@buster/server-shared/reports';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function getReportSharingHandler(
  reportId: string,
  user: User
): Promise<ShareGetResponse> {
  // Check if report exists
  const report = await getReportFileById({ reportId, userId: user.id });
  if (!report) {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  // Check if user has permission to view the report
  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: reportId,
    assetType: 'report_file',
    requiredRole: 'can_view',
    workspaceSharing: report.workspace_sharing,
    organizationId: report.organization_id,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this report',
    });
  }

  // Get all permissions for the report
  const permissions = await listAssetPermissions({
    assetId: reportId,
    assetType: 'report_file',
  });

  return {
    permissions,
  };
}

const app = new Hono().get('/', async (c) => {
  const reportId = c.req.param('id');
  const user = c.get('busterUser');

  if (!reportId) {
    throw new HTTPException(400, { message: 'Report ID is required' });
  }

  const result = await getReportSharingHandler(reportId, user);

  return c.json(result);
});

export default app;
