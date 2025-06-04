import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { analystStep } from '../steps/analyst-step';
import { createTodosStep } from '../steps/create-todos-step';
import { extractValuesSearchStep } from '../steps/extract-values-search-step';
import { generateChatTitleStep } from '../steps/generate-chat-title-step';
import { thinkAndPrepStep } from '../steps/think-and-prep-step';

export interface AnalystRuntimeContext {
  userId: string;
  threadId: string;
  dataSourceId: string;
  dataSourceSyntax: string;
  organizationId: string;
  todos: string;
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
  .branch([
    // Only run analystStep if thinkAndPrepStep returned finished: false
    [async ({ inputData }) => inputData.finished === false, analystStep],
  ])
  .commit();

export default analystWorkflow;
