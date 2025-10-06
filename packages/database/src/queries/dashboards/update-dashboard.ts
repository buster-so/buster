import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dashboardFiles } from '../../schema';
import { WorkspaceSharingSchema } from '../../schema-types';

// Type for updating dashboardFiles - excludes read-only fields
type UpdateDashboardData = Partial<
  Omit<typeof dashboardFiles.$inferInsert, 'id' | 'createdBy' | 'createdAt' | 'deletedAt'>
>;

// Input validation schema for updating a dashboard
const UpdateDashboardInputSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  name: z.string().optional(),
  publicly_accessible: z.boolean().optional(),
  public_expiry_date: z.string().nullable().optional(),
  public_password: z.string().nullable().optional(),
  workspace_sharing: WorkspaceSharingSchema.optional(),
});

type UpdateDashboardInput = z.infer<typeof UpdateDashboardInputSchema>;

/**
 * Updates a dashboard with the provided fields
 * Only updates fields that are provided in the input
 * Always updates the updatedAt timestamp
 */
export const updateDashboard = async (params: UpdateDashboardInput): Promise<void> => {
  // Validate and destructure input
  const {
    dashboardId,
    userId,
    name,
    publicly_accessible,
    public_expiry_date,
    public_password,
    workspace_sharing,
  } = UpdateDashboardInputSchema.parse(params);

  try {
    // Build update data - only include fields that are provided
    const updateData: UpdateDashboardData = {
      updatedAt: new Date().toISOString(),
    };

    // Only add fields that are provided
    if (name !== undefined) {
      updateData.name = name;
    }

    if (publicly_accessible !== undefined) {
      updateData.publiclyAccessible = publicly_accessible;
      // Set publiclyEnabledBy to userId when enabling, null when disabling
      updateData.publiclyEnabledBy = publicly_accessible ? userId : null;
    }

    if (public_expiry_date !== undefined) {
      updateData.publicExpiryDate = public_expiry_date;
    }

    if (public_password !== undefined) {
      updateData.publicPassword = public_password;
    }

    if (workspace_sharing !== undefined) {
      updateData.workspaceSharing = workspace_sharing;

      if (workspace_sharing !== 'none') {
        updateData.workspaceSharingEnabledBy = userId;
        updateData.workspaceSharingEnabledAt = new Date().toISOString();
      } else {
        updateData.workspaceSharingEnabledBy = null;
        updateData.workspaceSharingEnabledAt = null;
      }
    }

    // Update the dashboard
    await db
      .update(dashboardFiles)
      .set(updateData)
      .where(and(eq(dashboardFiles.id, dashboardId), isNull(dashboardFiles.deletedAt)));

    console.info(`Successfully updated dashboard ${dashboardId}`);
  } catch (error) {
    console.error(`Failed to update dashboard ${dashboardId}:`, error);
    throw new Error(
      `Failed to update dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
