import { checkPermission } from '@buster/access-controls';
import { type User, getMetricIdsInReport, getReportFileById } from '@buster/database/queries';
import {
  GetReportParamsSchema,
  GetReportQuerySchema,
  type GetReportResponse,
} from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getMetricsInAncestorAssetFromMetricIds } from '../../../../shared-helpers/metric-helpers';
import { standardErrorHandler } from '../../../../utils/response';
import { throwUnauthorizedError } from '../../../../shared-helpers/asset-public-access';

export async function getReportHandler(
  reportId: string,
  user: User,
  versionNumber?: number | undefined,
  password?: string | undefined
): Promise<GetReportResponse> {
  const [report, metricIds] = await Promise.all([
    getReportFileById({
      reportId,
      userId: user.id,
      versionNumber,
    }),
    getMetricIdsInReport({ reportId }),
  ]);

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
    throwUnauthorizedError({
      publiclyAccessible: report.publicly_accessible ?? false,
      publicExpiryDate: report.public_expiry_date ?? undefined,
      publicPassword: report.public_password ?? undefined,
      userSuppliedPassword: password,
    });
  }

  const metrics = await getMetricsInAncestorAssetFromMetricIds(metricIds, user);

  const response: GetReportResponse = {
    ...report,
    permission: permission.effectiveRole,
    metrics,
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
