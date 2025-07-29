import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { dashboardFiles, metricFilesToDashboardFiles } from '../../schema';

export async function checkDashboardsContainingMetric(metricId: string): Promise<{ id: string }[]> {
  const result = await db
    .select({
      id: dashboardFiles.id,
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
