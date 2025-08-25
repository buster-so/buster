import { hasAssetPermission } from '@buster/access-controls';
import { getReport, getReportMetadata } from '@buster/database';
import type { GetReportResponse } from '@buster/server-shared/reports';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../../utils/response';

export async function getReportHandler(
  reportId: string,
  user: { id: string }
): Promise<GetReportResponse> {
  // Get report metadata for access control
  let reportData: Awaited<ReturnType<typeof getReportMetadata>>;
  try {
    reportData = await getReportMetadata({ reportId });
  } catch (error) {
    console.error('Error getting report metadata:', error);
    throw new HTTPException(404, { message: 'Report not found' });
  }

  if (!reportData) {
    throw new HTTPException(404, { message: 'Report not found' });
  }

  // Check access using existing asset permission system
  const hasAccess = await hasAssetPermission({
    userId: user.id,
    assetId: reportId,
    assetType: 'report_file',
    requiredRole: 'can_view',
    organizationId: reportData.organizationId,
    workspaceSharing: reportData.workspaceSharing,
  });

  if (!hasAccess) {
    throw new HTTPException(403, { message: 'You do not have access to this report' });
  }

  // If access is granted, get the full report data
  const report = await getReport({ reportId, userId: user.id });

  const response: GetReportResponse = report;

  return response;
}

const app = new Hono()
  .get('/', async (c) => {
    const reportId = c.req.param('id');
    const user = c.get('busterUser');

    if (!reportId) {
      throw new HTTPException(404, { message: 'Report ID is required' });
    }

    const response: GetReportResponse = await getReportHandler(reportId, user);
    return c.json(response);
  })
  .onError(standardErrorHandler);

export default app;
