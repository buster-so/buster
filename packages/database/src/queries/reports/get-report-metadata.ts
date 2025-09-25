import { and, eq, isNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles } from '../../schema';

// Input validation schema using Zod
const GetReportMetadataInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
});

type GetReportMetadataInput = z.infer<typeof GetReportMetadataInputSchema>;

/**
 * Get report metadata for access control purposes
 * Returns organizationId and workspaceSharing for a specific report
 */
export async function getReportMetadata(params: GetReportMetadataInput) {
  // Validate input
  const validated = GetReportMetadataInputSchema.parse(params);

  // Execute query
  const result = await db
    .select({
      organizationId: reportFiles.organizationId,
      workspaceSharing: reportFiles.workspaceSharing,
      publiclyAccessible: reportFiles.publiclyAccessible,
      publicExpiryDate: reportFiles.publicExpiryDate,
      publicPassword: reportFiles.publicPassword,
    })
    .from(reportFiles)
    .where(and(eq(reportFiles.id, validated.reportId), isNull(reportFiles.deletedAt)))
    .limit(1);

  if (!result.length || !result[0]) {
    throw new Error('Report not found');
  }

  return result[0];
}

// Export types for consumers
export type { GetReportMetadataInput };
