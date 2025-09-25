import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { dashboardFiles, metricFilesToDashboardFiles } from '../../schema';
import type { WorkspaceSharing } from '../../schema-types';

export interface DashboardWithSharing {
  id: string;
  organizationId: string;
  workspaceSharing: WorkspaceSharing | null;
  publiclyAccessible: boolean;
  publicExpiryDate: string | null;
  publicPassword: string | null;
}

export async function checkDashboardsContainingMetric(
  metricId: string
): Promise<DashboardWithSharing[]> {
  const result = await db
    .select({
      id: dashboardFiles.id,
      organizationId: dashboardFiles.organizationId,
      workspaceSharing: dashboardFiles.workspaceSharing,
      publiclyAccessible: dashboardFiles.publiclyAccessible,
      publicExpiryDate: dashboardFiles.publicExpiryDate,
      publicPassword: dashboardFiles.publicPassword,
    })
    .from(metricFilesToDashboardFiles)
    .innerJoin(dashboardFiles, eq(dashboardFiles.id, metricFilesToDashboardFiles.dashboardFileId))
    .where(
      and(
        eq(metricFilesToDashboardFiles.metricFileId, metricId),
        isNull(metricFilesToDashboardFiles.deletedAt),
        isNull(dashboardFiles.deletedAt)
      )
    );

  return result;
}
