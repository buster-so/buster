import type { User } from '@buster/database/queries';
import { getReportWorkspaceSharing, updateReport } from '@buster/database/queries';
import type { UpdateReportRequest, UpdateReportResponse } from '@buster/server-shared/reports';
import { UpdateReportRequestSchema } from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { checkIfAssetIsEditable } from '../../../../shared-helpers/asset-public-access';
import { getReportHandler } from './GET';

async function updateReportHandler(
  reportId: string,
  request: UpdateReportRequest,
  user: User
): Promise<UpdateReportResponse> {
  if (!reportId || reportId === 'invalid') {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  await checkIfAssetIsEditable({
    user,
    assetId: reportId,
    assetType: 'report_file',
    workspaceSharing: getReportWorkspaceSharing,
    requiredRole: 'can_edit',
  });

  const { name, content, update_version = false } = request;

  // Update the report in the database
  await updateReport(
    {
      reportId,
      userId: user.id,
      name,
      content,
    },
    update_version
  );

  // Get and return the updated report
  const updatedReport: UpdateReportResponse = await getReportHandler(reportId, user);

  return updatedReport;
}

const app = new Hono().put('/', zValidator('json', UpdateReportRequestSchema), async (c) => {
  const reportId = c.req.param('id');
  const request = c.req.valid('json');
  const user = c.get('busterUser');

  if (!reportId) {
    throw new HTTPException(404, { message: 'Report ID is required' });
  }

  const response = await updateReportHandler(reportId, request, user);
  return c.json(response);
});

export default app;
