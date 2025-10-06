import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { metricFiles } from '../../schema';
import { WorkspaceSharingSchema } from '../../schema-types';

// Type for updating metricFiles - excludes read-only fields
type UpdateMetricData = Partial<
  Omit<typeof metricFiles.$inferInsert, 'id' | 'createdBy' | 'createdAt' | 'deletedAt'>
>;

// Input validation schema for updating a metric
const UpdateMetricInputSchema = z.object({
  metricId: z.string().uuid('Metric ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  name: z.string().optional(),
  publicly_accessible: z.boolean().optional(),
  public_expiry_date: z.string().nullable().optional(),
  public_password: z.string().nullable().optional(),
  workspace_sharing: WorkspaceSharingSchema.optional(),
});

type UpdateMetricInput = z.infer<typeof UpdateMetricInputSchema>;

/**
 * Updates a metric with the provided fields
 * Only updates fields that are provided in the input
 * Always updates the updatedAt timestamp
 */
export const updateMetric = async (params: UpdateMetricInput): Promise<void> => {
  // Validate and destructure input
  const {
    metricId,
    userId,
    name,
    publicly_accessible,
    public_expiry_date,
    public_password,
    workspace_sharing,
  } = UpdateMetricInputSchema.parse(params);

  try {
    // Build update data - only include fields that are provided
    const updateData: UpdateMetricData = {
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

    // Update the metric
    await db
      .update(metricFiles)
      .set(updateData)
      .where(and(eq(metricFiles.id, metricId), isNull(metricFiles.deletedAt)));

    console.info(`Successfully updated metric ${metricId}`);
  } catch (error) {
    console.error(`Failed to update metric ${metricId}:`, error);
    throw new Error(
      `Failed to update metric: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
