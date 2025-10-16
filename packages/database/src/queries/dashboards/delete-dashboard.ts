import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dashboardFiles } from '../../schema';

// Input validation schema for deleting a dashboard
const DeleteDashboardInputSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
});

type DeleteDashboardInput = z.infer<typeof DeleteDashboardInputSchema>;

/**
 * Soft deletes a dashboard by setting the deletedAt timestamp
 * Only deletes if the dashboard exists and is not already deleted
 */
export const deleteDashboard = async (params: DeleteDashboardInput): Promise<void> => {
  const { dashboardId } = DeleteDashboardInputSchema.parse(params);

  try {
    // Soft delete the dashboard
    await db
      .update(dashboardFiles)
      .set({
        deletedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(dashboardFiles.id, dashboardId), isNull(dashboardFiles.deletedAt)));

    console.info(`Successfully soft deleted dashboard ${dashboardId}`);
  } catch (error) {
    console.error(`Failed to delete dashboard ${dashboardId}:`, error);
    throw new Error(
      `Failed to delete dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
