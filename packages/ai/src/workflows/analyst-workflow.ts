import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { createTodosStep } from '../steps/create-todos';
import { extractValuesSearchStep } from '../steps/extract-values-search';
import { generateChatTitleStep } from '../steps/generate-chat-title';

export interface AnalystWorkflowRuntimeContext {
  userId: string;
  threadId: string;
}

const inputSchema = z.object({
  prompt: z.string(),
});

const outputSchema = z.object({
  title: z.string(),
  todos: z.array(z.string()),
  values: z.array(z.string()),
});

const analystWorkflow = createWorkflow({
  id: 'analyst-workflow',
  inputSchema,
  outputSchema,
  steps: [generateChatTitleStep, extractValuesSearchStep, createTodosStep],
})
  .parallel([generateChatTitleStep, extractValuesSearchStep, createTodosStep])
  .commit();

export default analystWorkflow;
