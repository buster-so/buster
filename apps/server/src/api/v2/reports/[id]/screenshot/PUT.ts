import { checkPermission } from '@buster/access-controls';
import { getReportFileById } from '@buster/database/queries';
import {
  AssetIdParamsSchema,
  PutScreenshotRequestSchema,
  type PutScreenshotResponse,
} from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { uploadScreenshotHandler } from '../../../../../shared-helpers/upload-screenshot-handler';

const app = new Hono().put(
  '/',
  zValidator('json', PutScreenshotRequestSchema),
  zValidator('param', AssetIdParamsSchema),
  async (c) => {
    const assetId = c.req.valid('param').id;
    const { base64Image } = c.req.valid('json');
    const user = c.get('busterUser');

    const report = await getReportFileById({ reportId: assetId, userId: user.id });

    if (!report) {
      throw new HTTPException(404, { message: 'Report not found' });
    }

    const permission = await checkPermission({
      userId: user.id,
      assetId,
      assetType: 'report_file',
      requiredRole: 'can_edit',
      workspaceSharing: report.workspace_sharing,
      organizationId: report.organization_id,
    });

    if (!permission.hasAccess) {
      throw new HTTPException(403, {
        message: 'You do not have permission to upload a screenshot for this report',
      });
    }

    const result: PutScreenshotResponse = await uploadScreenshotHandler({
      assetType: 'report_file',
      assetId,
      base64Image,
      organizationId: report.organization_id,
    });

    return c.json(result);
  }
);

export default app;
