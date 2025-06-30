import { z } from 'zod';
import { MessageHistorySchema } from '../utils/memory/types';

// Dashboard file context schema
export const DashboardFileContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  versionNumber: z.number(),
  metricIds: z.array(z.string()),
});

export type DashboardFileContext = z.infer<typeof DashboardFileContextSchema>;

// Input schema for the analyst workflow
export const thinkAndPrepWorkflowInputSchema = z.object({
  prompt: z.string(),
  conversationHistory: MessageHistorySchema.optional(),
  dashboardFiles: z.array(DashboardFileContextSchema).optional(),
});

// Runtime context schema for type safety
export const AnalystRuntimeContextSchema = z.object({
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  dataSourceSyntax: z.string(),
  organizationId: z.string(),
  messageId: z.string().optional(), // Optional for testing scenarios
  workflowStartTime: z.number().optional(), // Track workflow start time in milliseconds - optional for backward compatibility
});

export type AnalystRuntimeContext = z.infer<typeof AnalystRuntimeContextSchema>;
