import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../connection';
import { dashboardFiles, messages, messagesToFiles } from '../schema';

// Input schema for type safety
const GetChatDashboardFilesInputSchema = z.object({
  chatId: z.string().min(1),
});

type GetChatDashboardFilesInput = z.infer<typeof GetChatDashboardFilesInputSchema>;

// Dashboard content schema for parsing
const DashboardContentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rows: z.array(
    z.object({
      id: z.number(),
      items: z.array(
        z.object({
          id: z.string().uuid(),
        })
      ),
      columnSizes: z.array(z.number()),
    })
  ),
});

// Output type for dashboard file context
export type DashboardFileContext = {
  id: string;
  name: string;
  versionNumber: number;
  metricIds: string[]; // Extracted metric IDs
};

export type DashboardFile = InferSelectModel<typeof dashboardFiles>;

/**
 * Extract metric IDs from dashboard content
 * @param content - Dashboard content JSONB
 * @returns Array of metric IDs
 */
function extractMetricIds(content: unknown): string[] {
  try {
    const parsedContent = DashboardContentSchema.parse(content);

    // Extract all metric IDs from all rows and items
    const metricIds = parsedContent.rows.flatMap((row) =>
      row.items.map((item) => item.id)
    );

    // Return unique metric IDs
    return [...new Set(metricIds)];
  } catch {
    // If parsing fails, return empty array
    return [];
  }
}

/**
 * Get all dashboard files associated with a chat through its messages
 * @param input - Object containing chatId
 * @returns Array of dashboard file contexts with metric IDs (can be empty)
 */
export async function getChatDashboardFiles(
  input: GetChatDashboardFilesInput
): Promise<DashboardFileContext[]> {
  try {
    // Validate input
    const { chatId } = GetChatDashboardFilesInputSchema.parse(input);

    // Query to get all dashboard files associated with messages in this chat
    const results = await db
      .selectDistinct({
        id: dashboardFiles.id,
        name: dashboardFiles.name,
        versionNumber: messagesToFiles.versionNumber,
        content: dashboardFiles.content,
      })
      .from(messages)
      .innerJoin(
        messagesToFiles,
        and(
          eq(messages.id, messagesToFiles.messageId),
          isNull(messagesToFiles.deletedAt),
          eq(messagesToFiles.isDuplicate, false)
        )
      )
      .innerJoin(
        dashboardFiles,
        and(eq(messagesToFiles.fileId, dashboardFiles.id), isNull(dashboardFiles.deletedAt))
      )
      .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)));

    // Transform results to extract metric IDs
    return results.map((result) => ({
      id: result.id,
      name: result.name,
      versionNumber: result.versionNumber,
      metricIds: extractMetricIds(result.content),
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid input for getChatDashboardFiles: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw new Error(
      `Failed to fetch dashboard files for chat: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}