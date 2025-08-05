import { getUserOrganizationId, updateReport } from '@buster/database';
import type { ShareUpdateResponse, UpdateReportResponse } from '@buster/server-shared/reports';
import { type ShareUpdateRequest, ShareUpdateRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getReportHandler } from '../GET';

async function updateReportShareHandler(
  reportId: string,
  request: ShareUpdateRequest,
  user: { id: string; organizationId: string }
) {
  const _hasPermissionToEditAssetPermissions = true; //DALLIN: Check if user has permission to edit asset permissions

  if (!_hasPermissionToEditAssetPermissions) {
    throw new HTTPException(403, {
      message: 'User does not have permission to edit asset permissions',
    });
  }

  const { publicly_accessible, public_expiry_date, public_password, workspace_sharing } = request;

  if (publicly_accessible || public_expiry_date || public_password || workspace_sharing) {
    //DALLIN: Check if user has permission to edit settings
  }

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
    id: user.id,
    organizationId: userOrg.organizationId,
  });

  return c.json(updatedReport);
});

export default app;
