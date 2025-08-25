import type { User } from '@buster/database';
import { getUserOrganizationId, updateReport } from '@buster/database';
import type { UpdateReportRequest, UpdateReportResponse } from '@buster/server-shared/reports';
import { UpdateReportRequestSchema } from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getReportHandler } from './GET';

async function updateReportHandler(
  reportId: string,
  request: UpdateReportRequest,
  user: User
): Promise<UpdateReportResponse> {
  if (!reportId || reportId === 'invalid') {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  // Get user's organization ID
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, { message: 'User is not associated with an organization' });
  }

  const _hasPermissionToEditAsset = true; //DALLIN: Check if user has permission to edit asset

  if (!_hasPermissionToEditAsset) {
    throw new HTTPException(403, { message: 'User does not have permission to edit asset' });
  }

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
