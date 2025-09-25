import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { metricFilesToReportFiles, reportFiles } from '../../schema';
import type { WorkspaceSharing } from '../../schema-types';

export interface ReportWithSharing {
  id: string;
  organizationId: string;
  workspaceSharing: WorkspaceSharing | null;
  publiclyAccessible: boolean;
  publicExpiryDate: string | null;
  publicPassword: string | null;
}

export async function checkReportsContainingMetric(metricId: string): Promise<ReportWithSharing[]> {
  const result = await db
    .select({
      id: reportFiles.id,
      organizationId: reportFiles.organizationId,
      workspaceSharing: reportFiles.workspaceSharing,
      publiclyAccessible: reportFiles.publiclyAccessible,
      publicExpiryDate: reportFiles.publicExpiryDate,
      publicPassword: reportFiles.publicPassword,
    })
    .from(metricFilesToReportFiles)
    .innerJoin(reportFiles, eq(reportFiles.id, metricFilesToReportFiles.reportFileId))
    .where(
      and(
        eq(metricFilesToReportFiles.metricFileId, metricId),
        isNull(metricFilesToReportFiles.deletedAt),
        isNull(reportFiles.deletedAt)
      )
    );

  return result;
}
