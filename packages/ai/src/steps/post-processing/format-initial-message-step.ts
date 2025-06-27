import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import type { z } from 'zod';
import { generateSummary } from '../../tools/post-processing/generate-summary';
import { MessageHistorySchema } from '../../utils/memory/types';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { standardizeMessages } from '../../utils/standardizeMessages';
import { postProcessingWorkflowOutputSchema } from './schemas';

// Import the schema from combine-parallel-results step
import { combineParallelResultsOutputSchema } from './combine-parallel-results-step';

// Input schema matches the output of combine-parallel-results step
const inputSchema = combineParallelResultsOutputSchema;

// Use the unified schema from the workflow
export const formatInitialMessageOutputSchema = postProcessingWorkflowOutputSchema;

const initialMessageInstructions = `
<intro>
- You are a specialized AI agent within an AI-powered data analyst system.
- Your role is to review the assumptions and issues identified (that resulted from the chat between the AI data analyst (Buster) and the user) and generate one cohesive, simple, concise summary that will be sent to the data team as Slack Message.
- Your tasks include:
  - Analyzing the issues and assumptions identified.
  - Providing a simple summary message for the data team's Slack channel.
  - Providing a 3-6 word title that will serve as the header for the summary message.
</intro>

<agent_loop>
You operate in a loop to complete tasks:
1. Immediately start by reviewing the issues and assumptions.
2. Continue reviewing until you have thoroughly assessed the issues and assumptions.
3. Use the \`generateSummary\` tool to provide a summary and title.
</agent_loop>

<tool_use_rules>
- Follow tool schemas exactly, including all required parameters
- Do not mention tool names to users
- Use \`generateSummary\` tool to provide a summary and title.
- If only one assumption or issue is listed, return the existing description and rewrite the title to only be 3-6 words long.
</tool_use_rules>

<output_format>
- Use \`generateSummary\` tool to provide a summary and title.
  - Include a 3-6 word title that will serve as the header for the summary_message.
  - Include a simple summary message that briefly describes the issues and assumptions detected.
    - The summary message should be concise and informative, suitable for sending to the data team's Slack channel.
    - The summary message should start with the user's name (e.g. Kevin reqeuested...)
    - When referring to the "AI analyst" or "AI data analyst", you should refer to it by it's name, "Buster" (e.g. "Buster made assumptions..." instead of "The AI analyst made assumptions...")
</output_format>
`;

const DEFAULT_OPTIONS = {
  maxSteps: 1,
  temperature: 0,
  maxTokens: 10000,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
    },
  },
};

export const initialMessageAgent = new Agent({
  name: 'Format Initial Message',
  instructions: initialMessageInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  tools: {
    generateSummary,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});

export const formatInitialMessageStepExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof formatInitialMessageOutputSchema>> => {
  try {
    // Check if there are any major assumptions
    const majorAssumptions = inputData.assumptions?.filter((a) => a.label === 'major') || [];

    // If no major assumptions, return null for formatted_message
    if (majorAssumptions.length === 0) {
      return {
        ...inputData,
      };
    }

    // Prepare context about issues and assumptions for the agent
    const issuesAndAssumptions = {
      flagged_issues: inputData.flagChatMessage || 'No issues flagged',
      major_assumptions: majorAssumptions,
    };

    const contextMessage = `Issues and assumptions identified from the chat that require data team attention:

User: ${inputData.userName}

Issues Flagged: ${issuesAndAssumptions.flagged_issues}

Major Assumptions Identified: ${
      issuesAndAssumptions.major_assumptions.length > 0
        ? issuesAndAssumptions.major_assumptions
            .map((a) => `- ${a.descriptiveTitle}: ${a.explanation}`)
            .join('\n')
        : 'No major assumptions identified'
    }

Generate a cohesive summary with title for the data team.`;

    const messages: CoreMessage[] = standardizeMessages(contextMessage);

    const tracedInitialMessage = wrapTraced(
      async () => {
        const response = await initialMessageAgent.generate(messages, {
          toolChoice: 'required',
        });
        return response;
      },
      {
        name: 'Format Initial Message',
      }
    );

    const initialResult = await tracedInitialMessage();

    // Extract tool call information
    const toolCalls = initialResult.toolCalls || [];
    if (toolCalls.length === 0) {
      throw new Error('No tool was called by the format initial message agent');
    }

    const toolCall = toolCalls[0]; // Should only be one with maxSteps: 1
    if (!toolCall) {
      throw new Error('Tool call is undefined');
    }

    if (toolCall.toolName !== 'generateSummary') {
      throw new Error(`Unexpected tool called: ${toolCall.toolName}`);
    }

    return {
      ...inputData,
      summaryMessage: toolCall.args.summary_message,
      summaryTitle: toolCall.args.title,
    };
  } catch (error) {
    console.error('Failed to format initial message:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to format the initial message. Please try again later.');
  }
};

export const formatInitialMessageStep = createStep({
  id: 'format-initial-message',
  description:
    'This step checks for major assumptions and generates a summary message for initial messages if major assumptions are found.',
  inputSchema,
  outputSchema: formatInitialMessageOutputSchema,
  execute: formatInitialMessageStepExecution,
});
