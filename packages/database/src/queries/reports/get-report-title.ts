import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles } from '../../schema';

export const GetReportTitleInputSchema = z.object({
  assetId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
});

export type GetReportTitleInput = z.infer<typeof GetReportTitleInputSchema>;

// Updated return type to remove null since we now throw an error instead
export async function getReportTitle(input: GetReportTitleInput): Promise<string> {
  const validated = GetReportTitleInputSchema.parse(input);

  const [report] = await db
    .select({
      name: reportFiles.name,
      publiclyAccessible: reportFiles.publiclyAccessible,
      organizationId: reportFiles.organizationId,
    })
    .from(reportFiles)
    .where(and(eq(reportFiles.id, validated.assetId), isNull(reportFiles.deletedAt)))
    .limit(1);

  // Throw error instead of returning null
  if (!report) {
    throw new Error(`Report with ID ${validated.assetId} not found`);
  }

  // Throw error for permission failure instead of returning null
  if (!report.publiclyAccessible && report.organizationId !== validated.organizationId) {
    throw new Error(
      `Access denied: Report with ID ${validated.assetId} is not publicly accessible and does not belong to the specified organization`
    );
  }

  return report.name;
}
