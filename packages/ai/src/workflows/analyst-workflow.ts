import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { analystStep } from '../steps/analyst-step';
import { createTodosStep } from '../steps/create-todos-step';
import { extractValuesSearchStep } from '../steps/extract-values-search-step';
import { formatOutputStep } from '../steps/format-output-step';
import { generateChatTitleStep } from '../steps/generate-chat-title-step';
import { thinkAndPrepStep } from '../steps/think-and-prep-step';

// CoreMessage schema for validation
const coreMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.any(), // Content can be string or complex types
  providerOptions: z.any().optional(),
  experimental_providerMetadata: z.any().optional(),
});

export const thinkAndPrepWorkflowInputSchema = z.object({
  prompt: z.string(),
  conversationHistory: z.array(coreMessageSchema).optional(),
});

const outputSchema = z.object({
  title: z.string().optional(),
  todos: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  conversationHistory: z.array(coreMessageSchema).optional(),
  // Keep existing fields for backward compatibility
  finished: z.boolean().optional(),
  outputMessages: z.array(coreMessageSchema).optional(),
  stepData: z.any().optional(),
  metadata: z.any().optional(),
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
  .branch([
    // Only run analystStep if thinkAndPrepStep returned finished: false
    [async ({ inputData }) => inputData.finished === false, analystStep],
  ])
  // Always run format-output-step to standardize the output
  .then(formatOutputStep)
  .commit();

export default analystWorkflow;
