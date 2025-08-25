import { hasAssetPermission } from '@buster/access-controls';
import { getReportMetadata } from '@buster/database';
import type { Context } from 'hono';
import { z } from 'zod';
import { errorResponse } from '../../../utils/response';
import { extractParamFromWhere } from './_helpers';

type ReportMetadata = Awaited<ReturnType<typeof getReportMetadata>>;

const AcceptedColumnsEnum = z.enum(['content', 'name', 'id', 'publicly_accessible']);
const columnsSchema = z.object({
  columns: z
    .string()
    .min(1, 'Columns are required')
    .refine(
      (columns) => {
        const columnsArray = columns.split(',');
        return columnsArray.every((column) => {
          return AcceptedColumnsEnum.safeParse(column)?.success;
        });
      },
      {
        message:
          'Invalid column provided. Accepted columns are: content, name, id, publicly_accessible',
      }
    ),
});

export const reportFilesProxyRouter = async (
  url: URL,
  _userId: string,
  c: Context
): Promise<URL> => {
  const reportId = extractParamFromWhere(url, 'id');
  const columns = url.searchParams.get('columns');

  // Validate columns using Zod
  const validationResult = columnsSchema.safeParse({ columns });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors[0]?.message || 'Invalid columns parameter';
    throw errorResponse(errorMessage, 403);
  }

  if (!reportId) {
    throw errorResponse('Report ID (id) is required', 403);
  }

  // Get report metadata for access control
  let reportData: ReportMetadata;
  try {
    reportData = await getReportMetadata({ reportId });
  } catch (error) {
    console.error('Error getting report metadata:', error);
    throw errorResponse('Report not found', 404);
  }

  if (!reportData) {
    throw errorResponse('Report not found', 404);
  }

  // Check access using existing asset permission system
  const hasAccess = await hasAssetPermission({
    userId: c.get('supabaseUser').id,
    assetId: reportId,
    assetType: 'report_file',
    requiredRole: 'can_view',
    organizationId: reportData.organizationId,
    workspaceSharing: reportData.workspaceSharing,
  });

  if (!hasAccess) {
    throw errorResponse('You do not have access to this report', 403);
  }

  return url;
};
