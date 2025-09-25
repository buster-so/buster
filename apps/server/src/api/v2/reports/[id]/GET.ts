import { checkPermission } from '@buster/access-controls';
import { getReportFileById } from '@buster/database/queries';
import {
  GetReportParamsSchema,
  GetReportQuerySchema,
  type GetReportResponse,
} from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../../utils/response';

export async function getReportHandler(
  reportId: string,
  user: { id: string },
  versionNumber?: number | undefined,
  password?: string | undefined
): Promise<GetReportResponse> {
  const report = await getReportFileById({
    reportId,
    userId: user.id,
    versionNumber,
  });

  const permission = await checkPermission({
    userId: user.id,
    assetId: reportId,
    assetType: 'report_file',
    requiredRole: 'can_view',
    workspaceSharing: report.workspace_sharing,
    organizationId: report.organization_id,
    publiclyAccessible: report.publicly_accessible,
    publicExpiryDate: report.public_expiry_date ?? undefined,
    publicPassword: report.public_password ?? undefined,
    userSuppliedPassword: password,
  });

  if (!permission.hasAccess || !permission.effectiveRole) {
    throw new HTTPException(403, { message: 'You do not have permission to view this report' });
  }

  const response: GetReportResponse = {
    ...report,
    permission: permission.effectiveRole,
  };

  return response;
}

const app = new Hono()
  .get(
    '/',
    zValidator('param', GetReportParamsSchema),
    zValidator('query', GetReportQuerySchema),
    async (c) => {
      const { id: reportId } = c.req.valid('param');
      const query = c.req.valid('query');
      const { password, version_number: versionNumber } = query;
      const user = c.get('busterUser');

      if (!reportId) {
        throw new HTTPException(404, { message: 'Report ID is required' });
      }

      const response: GetReportResponse = await getReportHandler(
        reportId,
        user,
        versionNumber,
        password
      );
      return c.json(response);
    }
  )
  .onError(standardErrorHandler);

export default app;
