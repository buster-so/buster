import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { createTodosStep } from '../steps/create-todos';
import { extractValuesSearchStep } from '../steps/extract-values-search';
import { generateChatTitleStep } from '../steps/generate-chat-title';
import { thinkAndPrepStep } from '../steps/think-and-prep-step';

export interface AnalystWorkflowRuntimeContext {
  userId: string;
  threadId: string;
}

export const thinkAndPrepWorkflowInputSchema = z.object({
  prompt: z.string(),
});

const outputSchema = z.object({
  title: z.string(),
  todos: z.array(z.string()),
  values: z.array(z.string()),
});

const analystWorkflow = createWorkflow({
  id: 'analyst-workflow',
  inputSchema: thinkAndPrepWorkflowInputSchema,
  outputSchema,
  steps: [generateChatTitleStep, extractValuesSearchStep, createTodosStep],
})
  .parallel([generateChatTitleStep, extractValuesSearchStep, createTodosStep])
  .then(thinkAndPrepStep)
  .commit();

export default analystWorkflow;
