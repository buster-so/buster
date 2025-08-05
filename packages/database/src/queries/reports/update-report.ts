import { and, eq, isNull } from 'drizzle-orm';
import {} from 'drizzle-zod';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles } from '../../schema';
import { workspaceSharingEnum } from '../../schema';
import { ReportElementSchema, type ReportElements } from '../../schema-types';

// Type for updating reportFiles - excludes read-only fields
type UpdateReportData = Partial<
  Omit<typeof reportFiles.$inferInsert, 'id' | 'createdBy' | 'createdAt' | 'deletedAt'>
>;
type VersionHistoryItem = (typeof reportFiles.$inferSelect)['versionHistory']['string'];

const WorkspaceSharingSchema = z.enum(workspaceSharingEnum.enumValues);

// Input validation schema for updating a report
const UpdateReportInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  name: z.string().optional(),
  publicly_accessible: z.boolean().optional(),
  content: z.lazy(() => z.array(ReportElementSchema)).optional() as z.ZodOptional<
    z.ZodType<ReportElements>
  >,
  public_expiry_date: z.string().nullable().optional(),
  public_password: z.string().nullable().optional(),
  workspace_sharing: WorkspaceSharingSchema.optional(),
});

type UpdateReportInput = z.infer<typeof UpdateReportInputSchema>;

/**
 * Updates a report with the provided fields
 * Only updates fields that are provided in the input
 * Always updates the updatedAt timestamp
 */
export const updateReport = async (
  params: UpdateReportInput,
  updateVersion: boolean
): Promise<void> => {
  // Validate and destructure input
  const {
    reportId,
    userId,
    name,
    publicly_accessible,
    content,
    public_expiry_date,
    public_password,
    workspace_sharing,
  } = UpdateReportInputSchema.parse(params);

  try {
    // Build update data - only include fields that are provided
    const updateData: UpdateReportData = {
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

    if (content !== undefined) {
      updateData.content = content;
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

    if (updateVersion) {
      const currentDataResult = await db
        .select()
        .from(reportFiles)
        .where(eq(reportFiles.id, reportId));
      const currentData = currentDataResult[0];
      if (!currentData) {
        throw new Error('Report not found');
      }

      const lastVersion =
        Object.values(currentData.versionHistory).reduce((acc, curr) => {
          return acc + curr.version_number;
        }, 0) ?? 1;

      currentData.versionHistory = {
        ...currentData.versionHistory,
        [lastVersion + 1]: {
          content: content ?? currentData.content,
          updated_at: new Date().toISOString(),
          version_number: lastVersion + 1,
        } satisfies VersionHistoryItem,
      };

      updateData.versionHistory = currentData.versionHistory;
    }

    // Update report in database
    await db
      .update(reportFiles)
      .set(updateData)
      .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)));
  } catch (error) {
    console.error('Error updating report:', {
      reportId,
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to update report');
  }
};
