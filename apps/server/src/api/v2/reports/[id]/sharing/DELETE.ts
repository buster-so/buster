import {
  checkAssetPermission,
  findUsersByEmails,
  getReport,
  removeAssetPermission,
} from '@buster/database';
import type { User } from '@buster/database';
import type { ShareDeleteResponse } from '@buster/server-shared/reports';
import type { ShareDeleteRequest } from '@buster/server-shared/share';
import { ShareDeleteRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function deleteReportSharingHandler(
  reportId: string,
  emails: ShareDeleteRequest,
  user: User
): Promise<ShareDeleteResponse> {
  // Check if user has permission to modify sharing for the report
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
      message: 'You do not have permission to modify sharing for this report',
    });
  }

  // Get the report to verify it exists and get owner info
  const report = await getReport({ reportId, userId: user.id });
  if (!report) {
    throw new HTTPException(404, { message: 'Report not found' });
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
    if (targetUser.id === report.created_by_id) {
      continue; // Skip the owner
    }

    // Remove the permission
    await removeAssetPermission({
      identityId: targetUser.id,
      identityType: 'user',
      assetId: reportId,
      assetType: 'report_file',
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
  const reportId = c.req.param('id');
  const emails = c.req.valid('json');
  const user = c.get('busterUser');

  if (!reportId) {
    throw new HTTPException(400, { message: 'Report ID is required' });
  }

  const result = await deleteReportSharingHandler(reportId, emails, user);

  return c.json(result);
});

export default app;
