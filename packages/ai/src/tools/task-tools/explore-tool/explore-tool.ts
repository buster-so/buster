import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelMessage, StreamTextResult, ToolSet } from 'ai';
import { tool } from 'ai';
import { z } from 'zod';
import EXPLORE_TOOL_DESCRIPTION from './explore-tool-description.txt';
import { createExploreToolExecute } from './explore-tool-execute';

export const EXPLORE_TOOL_NAME = 'explore';

export const ExploreToolInputSchema = z.object({
  description: z
    .string()
    .describe('A short (3-5 word) description of what to explore/search for'),
  prompt: z
    .string()
    .describe(
      'Detailed instructions for the exploration task. Specify what information to search for, where to look, and what to return. The explore agent specializes in search, research, and investigation tasks.'
    ),
});

export const ExploreToolOutputSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    findings: z.string().describe('Summary of findings from the exploration'),
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
  model?: LanguageModelV2;
  apiKey?: string;
  apiUrl?: string;
}) => {
  stream: (options: { messages: ModelMessage[] }) => Promise<StreamTextResult<ToolSet, never>>;
};

const _ExploreToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  projectDirectory: z.string().describe('The root directory of the project'),
  createAgent: z
    .function()
    .describe('Factory function to create a new agent instance for exploration'),
});

export type ExploreToolInput = z.infer<typeof ExploreToolInputSchema>;
export type ExploreToolOutput = z.infer<typeof ExploreToolOutputSchema>;

// Custom context type with proper typing
export interface ExploreToolContext {
  messageId: string;
  createAgent: AgentFactory;
}

export function createExploreTool<TAgentContext extends ExploreToolContext = ExploreToolContext>(
  context: TAgentContext
) {
  const execute = createExploreToolExecute(context);

  return tool({
    description: EXPLORE_TOOL_DESCRIPTION,
    inputSchema: ExploreToolInputSchema,
    outputSchema: ExploreToolOutputSchema,
    execute,
  });
}
