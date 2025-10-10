import type { ModelMessage, StreamTextResult, ToolSet } from 'ai';
import { tool } from 'ai';
import { z } from 'zod';
import TASK_TOOL_DESCRIPTION from './task-tool-description.txt';
import { createTaskToolExecute } from './task-tool-execute';

export const TASK_TOOL_NAME = 'task';

export const TaskToolInputSchema = z.object({
  description: z
    .string()
    .describe('A short (3-5 word) description of the task for progress tracking and logging'),
  prompt: z
    .string()
    .describe(
      'Detailed instructions for the task to execute. Be specific about what the task agent should accomplish and what information it should return.'
    ),
});

export const TaskToolOutputSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    summary: z.string().describe('Summary of what the task accomplished'),
  }),
  z.object({
    status: z.literal('error'),
    error_message: z.string(),
  }),
]);

// Type for agent factory function
export type AgentFactory = (options: {
  folder_structure: string;
  userId: string;
  chatId: string;
  dataSourceId: string;
  organizationId: string;
  messageId: string;
  isSubagent?: boolean;
  apiKey?: string;
  apiUrl?: string;
}) => {
  stream: (options: { messages: ModelMessage[] }) => Promise<StreamTextResult<ToolSet, never>>;
};

const _TaskToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  projectDirectory: z.string().describe('The root directory of the project'),
  createAgent: z
    .function()
    .describe('Factory function to create a new agent instance for the task'),
});

export type TaskToolInput = z.infer<typeof TaskToolInputSchema>;
export type TaskToolOutput = z.infer<typeof TaskToolOutputSchema>;

// Custom context type with proper typing
export interface TaskToolContext {
  messageId: string;
  projectDirectory: string;
  createAgent: AgentFactory;
}

export function createTaskTool<TAgentContext extends TaskToolContext = TaskToolContext>(
  context: TAgentContext
) {
  const execute = createTaskToolExecute(context);

  return tool({
    description: TASK_TOOL_DESCRIPTION,
    inputSchema: TaskToolInputSchema,
    outputSchema: TaskToolOutputSchema,
    execute,
  });
}
