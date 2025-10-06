import { checkPermission } from '@buster/access-controls';
import { getAssetScreenshotBucketKey, getReportFileById } from '@buster/database/queries';
import { getAssetScreenshotSignedUrl } from '@buster/search';
import { AssetIdParamsSchema, type GetScreenshotResponse } from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get('/', zValidator('param', AssetIdParamsSchema), async (c) => {
  const reportId = c.req.valid('param').id;
  const user = c.get('busterUser');

  const report = await getReportFileById({ reportId, userId: user.id });

  if (!report) {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  const existingKey = await getAssetScreenshotBucketKey({
    assetType: 'report_file',
    assetId: reportId,
  });

  if (!existingKey) {
    const result: GetScreenshotResponse = {
      success: false,
      error: 'Screenshot not found',
    };
    return c.json(result);
  }

  const permission = await checkPermission({
    userId: user.id,
    assetId: reportId,
    assetType: 'report_file',
    requiredRole: 'can_view',
    workspaceSharing: report.workspace_sharing,
    organizationId: report.organization_id,
  });

  if (!permission.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this report',
    });
  }

  try {
    const signedUrl = await getAssetScreenshotSignedUrl({
      key: existingKey,
      organizationId: report.organization_id,
    });

    const result: GetScreenshotResponse = {
      success: true,
      url: signedUrl,
    };
    return c.json(result);
  } catch (error) {
    console.error('Failed to generate report screenshot URL', {
      reportId,
      error,
    });
  }

  const response: GetScreenshotResponse = {
    success: false,
    error: 'Failed to generate screenshot URL',
  };
  return c.json(response);
});

export default app;
