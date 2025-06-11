import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { analystStep } from '../steps/analyst-step';
import { createTodosStep } from '../steps/create-todos-step';
import { extractValuesSearchStep } from '../steps/extract-values-search-step';
import { formatOutputStep } from '../steps/format-output-step';
import { generateChatTitleStep } from '../steps/generate-chat-title-step';
import { thinkAndPrepStep } from '../steps/think-and-prep-step';
import { MessageHistorySchema, StepFinishDataSchema } from '../utils/memory/types';

// Runtime context schema for type safety
export const AnalystRuntimeContextSchema = z.object({
  userId: z.string(),
  threadId: z.string(),
  dataSourceId: z.string(),
  dataSourceSyntax: z.string(),
  organizationId: z.string(),
  messageId: z.string().optional(), // Optional for testing scenarios
});

export type AnalystRuntimeContext = z.infer<typeof AnalystRuntimeContextSchema>;

export const thinkAndPrepWorkflowInputSchema = z.object({
  prompt: z.string(),
  conversationHistory: MessageHistorySchema.optional(),
});

// Metadata schema for output
const WorkflowMetadataSchema = z.object({
  toolsUsed: z.array(z.string()).optional(),
  finalTool: z.string().optional(),
  text: z.string().optional(),
  reasoning: z.string().optional(),
});

const outputSchema = z.object({
  title: z.string().optional(),
  todos: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  conversationHistory: MessageHistorySchema.optional(),
  // Keep existing fields for backward compatibility
  finished: z.boolean().optional(),
  outputMessages: MessageHistorySchema.optional(),
  stepData: StepFinishDataSchema.optional(),
  metadata: WorkflowMetadataSchema.optional(),
});

const analystWorkflow = createWorkflow({
  id: 'analyst-workflow',
  inputSchema: thinkAndPrepWorkflowInputSchema,
  outputSchema,
  steps: [
    generateChatTitleStep,
    extractValuesSearchStep,
    createTodosStep,
    thinkAndPrepStep,
    analystStep,
    formatOutputStep,
  ],
})
  .parallel([generateChatTitleStep, extractValuesSearchStep, createTodosStep])
  .then(thinkAndPrepStep)
  .then(analystStep) // Always run analyst step - it will pass through if finished
  .then(formatOutputStep)
  .commit();

export default analystWorkflow;
