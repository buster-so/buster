import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles } from '../../schema';

export const GetReportContentInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
});

type GetReportContentInput = z.infer<typeof GetReportContentInputSchema>;

export async function getReportContent(input: GetReportContentInput): Promise<string | null> {
  const validated = GetReportContentInputSchema.parse(input);
  const { reportId } = validated;

  const result = await db
    .select({ content: reportFiles.content })
    .from(reportFiles)
    .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)))
    .limit(1);

  return result[0]?.content ?? null;
}
