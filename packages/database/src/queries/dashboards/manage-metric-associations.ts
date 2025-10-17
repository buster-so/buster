import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dashboardFiles, metricFilesToDashboardFiles } from '../../schema';

// Input validation schema
const ManageMetricAssociationsInputSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  metricIds: z.array(z.string().uuid('Metric ID must be a valid UUID')),
  userId: z.string().uuid().optional(),
});

type ManageMetricAssociationsInput = z.infer<typeof ManageMetricAssociationsInputSchema>;

/**
 * Updates the metric_files_to_dashboard_files relationships for a given dashboard.
 * - Creates new relationships for metrics not already linked
 * - Updates updatedAt for existing relationships that should remain
 * - Soft deletes relationships that are no longer needed
 */
export const manageMetricAssociations = async (
  params: ManageMetricAssociationsInput
): Promise<void> => {
  const { dashboardId, metricIds, userId } = ManageMetricAssociationsInputSchema.parse(params);

  try {
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      // 1. Get all existing relationships for this dashboard (including soft-deleted ones)
      const existingRelationships = await tx
        .select({
          metricFileId: metricFilesToDashboardFiles.metricFileId,
          deletedAt: metricFilesToDashboardFiles.deletedAt,
        })
        .from(metricFilesToDashboardFiles)
        .where(eq(metricFilesToDashboardFiles.dashboardFileId, dashboardId));

      const existingMetricIds = new Set(existingRelationships.map((rel) => rel.metricFileId));
      const activeExistingMetricIds = new Set(
        existingRelationships.filter((rel) => rel.deletedAt === null).map((rel) => rel.metricFileId)
      );
      const softDeletedMetricIds = new Set(
        existingRelationships.filter((rel) => rel.deletedAt !== null).map((rel) => rel.metricFileId)
      );

      // 2. Determine what actions to take
      const metricsToCreate = metricIds.filter((id) => !existingMetricIds.has(id));
      const metricsToRestore = metricIds.filter((id) => softDeletedMetricIds.has(id));
      const metricsToUpdate = metricIds.filter((id) => activeExistingMetricIds.has(id));
      const metricsToDelete = Array.from(activeExistingMetricIds).filter(
        (id) => !metricIds.includes(id)
      );

      // 3. Create new relationships
      if (metricsToCreate.length > 0) {
        let createdBy = userId;
        if (!userId) {
          const [createdByResponse] = await db
            .select({ id: dashboardFiles.createdBy })
            .from(dashboardFiles)
            .where(eq(dashboardFiles.id, dashboardId));
          if (createdByResponse?.id) {
            createdBy = createdByResponse.id;
          }
        }

        if (createdBy) {
          const newRelationships = metricsToCreate.map((metricId) => ({
            metricFileId: metricId,
            dashboardFileId: dashboardId,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            createdBy: createdBy,
          }));

          await tx.insert(metricFilesToDashboardFiles).values(newRelationships);
        } else {
          throw new Error('Could not find user id for dashboard created by');
        }
      }

      // 4. Restore soft-deleted relationships (undelete and update)
      if (metricsToRestore.length > 0) {
        await tx
          .update(metricFilesToDashboardFiles)
          .set({
            deletedAt: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(metricFilesToDashboardFiles.dashboardFileId, dashboardId),
              inArray(metricFilesToDashboardFiles.metricFileId, metricsToRestore)
            )
          );
      }

      // 5. Update existing active relationships
      if (metricsToUpdate.length > 0) {
        await tx
          .update(metricFilesToDashboardFiles)
          .set({
            updatedAt: now,
          })
          .where(
            and(
              eq(metricFilesToDashboardFiles.dashboardFileId, dashboardId),
              inArray(metricFilesToDashboardFiles.metricFileId, metricsToUpdate),
              isNull(metricFilesToDashboardFiles.deletedAt)
            )
          );
      }

      // 6. Soft delete relationships that should no longer exist
      if (metricsToDelete.length > 0) {
        await tx
          .update(metricFilesToDashboardFiles)
          .set({
            deletedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(metricFilesToDashboardFiles.dashboardFileId, dashboardId),
              inArray(metricFilesToDashboardFiles.metricFileId, metricsToDelete),
              isNull(metricFilesToDashboardFiles.deletedAt)
            )
          );
      }
    });
  } catch (error) {
    console.error('Error updating metric-to-dashboard relationships:', {
      dashboardId,
      metricIds: metricIds.length,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to update metric-to-dashboard relationships');
  }
};
