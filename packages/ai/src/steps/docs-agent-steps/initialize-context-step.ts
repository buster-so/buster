import { z } from 'zod';
import { DocsAgentContextSchema } from '../../agents/docs-agent/docs-agent-context';

// Zod schemas first - following Zod-first approach
export const initializeContextParamsSchema = z.object({
  message: z.string().describe('The user message'),
  organizationId: z.string().describe('The organization ID'),
  context: DocsAgentContextSchema.describe('The docs agent context'),
});

export const initializeContextResultSchema = z.object({
  message: z.string().describe('The user message'),
  organizationId: z.string().describe('The organization ID'),
  contextInitialized: z.boolean().describe('Whether context was initialized'),
  context: DocsAgentContextSchema.describe('The initialized context'),
});

// Export types from schemas
export type InitializeContextParams = z.infer<typeof initializeContextParamsSchema>;
export type InitializeContextResult = z.infer<typeof initializeContextResultSchema>;

/**
 * Initializes the context for the docs agent workflow
 * This is a simple pass-through function that validates and structures the input data
 */
export async function runInitializeContextStep(
  params: InitializeContextParams
): Promise<InitializeContextResult> {
  // Validate input
  const validatedParams = initializeContextParamsSchema.parse(params);

  // Return structured data for next steps
  return {
    message: validatedParams.message,
    organizationId: validatedParams.organizationId,
    contextInitialized: true,
    context: {
      sandbox: validatedParams.context.sandbox,
      todoList: validatedParams.context.todoList,
      notepad: validatedParams.context.notepad,
      clarificationQuestions: validatedParams.context.clarificationQuestions,
      dataSourceId: validatedParams.context.dataSourceId,
    },
  };
}
