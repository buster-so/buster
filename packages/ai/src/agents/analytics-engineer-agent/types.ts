import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelMessage } from 'ai';
import z from 'zod';

export const TodoItemSchema = z.object({
  id: z
    .string()
    .describe(
      'Unique identifier for the todo item. Use existing ID to update, or generate new ID for new items'
    ),
  content: z.string().describe('The content/description of the todo'),
  status: z.enum(['pending', 'in_progress', 'completed']).describe('Current status of the todo'),
  createdAt: z
    .string()
    .datetime()
    .optional()
    .describe(
      'ISO timestamp when todo was created (optional, will be set automatically for new items)'
    ),
  completedAt: z
    .string()
    .datetime()
    .optional()
    .describe('ISO timestamp when todo was completed (optional)'),
});

export type TodoItem = z.infer<typeof TodoItemSchema>;

export const AnalyticsEngineerAgentOptionsSchema = z.object({
  folder_structure: z.string().describe('The file structure of the dbt repository'),
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  organizationId: z.string(),
  messageId: z.string(),
  todosList: z
    .array(TodoItemSchema)
    .default([])
    .describe('Array of todo items to write/update. Include all todos with their current state.'),
  model: z
    .custom<LanguageModelV2>()
    .optional()
    .describe('Custom language model to use (defaults to Sonnet4)'),
  isSubagent: z
    .boolean()
    .optional()
    .describe('Flag indicating this is a subagent (prevents infinite recursion)'),
  isInResearchMode: z
    .boolean()
    .optional()
    .default(false)
    .describe('Flag indicating the agent should only perform read-only operations'),
  abortSignal: z
    .custom<AbortSignal>()
    .optional()
    .describe('Optional abort signal to cancel agent execution'),
  apiKey: z.string().optional().describe('API key for authenticating with the server'),
  apiUrl: z.string().optional().describe('Base URL for API server endpoints'),
});

export const AnalyticsEngineerAgentStreamOptionsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The messages to send to the docs agent'),
});

export type AnalyticsEngineerAgentStreamOptions = z.infer<
  typeof AnalyticsEngineerAgentStreamOptionsSchema
>;

export type AnalyticsEngineerAgentOptions = z.infer<typeof AnalyticsEngineerAgentOptionsSchema>;
