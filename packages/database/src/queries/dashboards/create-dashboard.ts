import { z } from 'zod';
import { db } from '../../connection';
import { assetPermissions, dashboardFiles } from '../../schema';
import { type DashboardYml, DashboardYmlSchema } from '../../schema-types/dashboards';

// Input validation schema for creating a dashboard
export const CreateDashboardInputSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required'),
  fileName: z.string().min(1, 'File name is required'),
  content: DashboardYmlSchema,
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
});

export type CreateDashboardInput = z.infer<typeof CreateDashboardInputSchema>;

// Output type for created dashboard
export type CreateDashboardOutput = {
  id: string;
  name: string;
  fileName: string;
  content: DashboardYml;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Creates a new dashboard in the database
 * @param input - Dashboard creation parameters
 * @returns The newly created dashboard
 */
export async function createDashboard(input: CreateDashboardInput): Promise<CreateDashboardOutput> {
  // Validate input
  const { name, fileName, content, organizationId, userId } =
    CreateDashboardInputSchema.parse(input);

  try {
    const now = new Date().toISOString();

    // Use a transaction to ensure both dashboard and permission are created atomically
    const result = await db.transaction(async (tx) => {
      // Insert the new dashboard
      const [newDashboard] = await tx
        .insert(dashboardFiles)
        .values({
          name,
          fileName,
          content,
          organizationId,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
          versionHistory: {
            '1': {
              content: content,
              updated_at: now,
              version_number: 1,
            },
          },
        })
        .returning({
          id: dashboardFiles.id,
          name: dashboardFiles.name,
          fileName: dashboardFiles.fileName,
          content: dashboardFiles.content,
          organizationId: dashboardFiles.organizationId,
          createdBy: dashboardFiles.createdBy,
          createdAt: dashboardFiles.createdAt,
          updatedAt: dashboardFiles.updatedAt,
        });

      if (!newDashboard) {
        throw new Error('Failed to create dashboard - no data returned from insert');
      }

      // Insert user permission for the dashboard
      await tx.insert(assetPermissions).values({
        identityId: userId,
        identityType: 'user',
        assetId: newDashboard.id,
        assetType: 'dashboard_file',
        role: 'owner',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      });

      return newDashboard;
    });

    console.info(`Successfully created dashboard ${result.id} with owner permissions for user ${userId}`);

    return result;
  } catch (error) {
    console.error('Failed to create dashboard:', error);
    throw new Error(
      `Failed to create dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
