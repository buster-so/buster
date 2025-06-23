import { z } from 'zod';
import { MessageHistorySchema } from '../utils/memory/types';

// Input schema for the analyst workflow
export const thinkAndPrepWorkflowInputSchema = z.object({
  prompt: z.string(),
  conversationHistory: MessageHistorySchema.optional(),
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
