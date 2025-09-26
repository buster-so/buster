import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { metricFilesToReportFiles } from '../../schema';

// Input validation schema
export const GetMetricIdsInReportInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
});

type GetMetricIdsInReportInput = z.infer<typeof GetMetricIdsInReportInputSchema>;

/**
 * Retrieves all metric file IDs associated with a report that are not soft-deleted.
 * @param params - Object containing the reportId
 * @returns Promise<string[]> - Array of metric file IDs
 */
export const getMetricIdsInReport = async (
  params: GetMetricIdsInReportInput
): Promise<string[]> => {
  const { reportId } = GetMetricIdsInReportInputSchema.parse(params);

  try {
    const metricRelationships = await db
      .select({
        metricFileId: metricFilesToReportFiles.metricFileId,
      })
      .from(metricFilesToReportFiles)
      .where(
        and(
          eq(metricFilesToReportFiles.reportFileId, reportId),
          isNull(metricFilesToReportFiles.deletedAt)
        )
      );

    return metricRelationships.map((relationship) => relationship.metricFileId);
  } catch (error) {
    console.error('Error retrieving metric IDs for report:', {
      reportId,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to retrieve metric IDs for report');
  }
};
