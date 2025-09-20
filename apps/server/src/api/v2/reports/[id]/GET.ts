import { getReportFileById } from '@buster/database/queries';
import {
  GetReportParamsSchema,
  GetReportQuerySchema,
  type GetReportResponse,
} from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { checkAssetPublicAccess } from '../../../../shared-helpers/asset-public-access';
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

  return await checkAssetPublicAccess<GetReportResponse>({
    user,
    assetId: reportId,
    assetType: 'report_file',
    organizationId: report.organization_id,
    workspaceSharing: report.workspace_sharing,
    password,
    asset: report,
  });
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
