import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import type { z } from 'zod';
import { generateUpdateMessage } from '../../tools/post-processing/generate-update-message';
import { MessageHistorySchema } from '../../utils/memory/types';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { standardizeMessages } from '../../utils/standardizeMessages';
import { postProcessingWorkflowOutputSchema } from './schemas';

// Import the schema from combine-parallel-results step
import { combineParallelResultsOutputSchema } from './combine-parallel-results-step';

// Input schema matches the output of combine-parallel-results step
const inputSchema = combineParallelResultsOutputSchema;

// Use the unified schema from the workflow
export const formatFollowUpMessageOutputSchema = postProcessingWorkflowOutputSchema;

const followUpMessageInstructions = `
<intro>
- You are a specialized AI agent within an AI-powered data analyst system.
- Your role is to generate an update summary for new issues and assumptions identified from subsequent messages after an initial alert has been sent to the data team.
- You will be provided with the new issues and assumptions identified from the latest messages in the chat.
- Your task is to review these new issues and assumptions and generate a concise summary that will be sent as a reply to the original alert in the data team's Slack channel.
</intro>

<agent_loop>
You operate in a loop to complete tasks:
1. Immediately start by reviewing the new issues and assumptions provided.
2. Continue reviewing until you have thoroughly assessed the new issues and assumptions.
3. Use the \`generateUpdateMessage\` tool to provide the update summary.
</agent_loop>

<tool_use_rules>
- Follow the tool schema exactly, including all required parameters.
- Do not mention tool names to users.
- Use the \`generateUpdateMessage\` tool to provide the update summary.
</tool_use_rules>

<output_format>
- Use the \`generateUpdateMessage\` tool with the \`update_message\` parameter.
  - The \`update_message\` should be a concise and informative summary of the new issues and assumptions.
  - The summary should be suitable for sending as a reply to the original alert in the data team's Slack channel.
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

export const followUpMessageAgent = new Agent({
  name: 'Format Follow-up Message',
  instructions: followUpMessageInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  tools: {
    generateUpdateMessage,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});

export const formatFollowUpMessageStepExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof formatFollowUpMessageOutputSchema>> => {
  try {
    // Prepare context about issues and assumptions for the agent
    const issuesAndAssumptions = {
      flagged_issues: inputData.flagChatMessage || 'No issues flagged',
      assumptions: inputData.assumptions || [],
    };

    const contextMessage = `New issues and assumptions identified from the latest chat messages:

User: ${inputData.userName}

Issues Flagged: ${issuesAndAssumptions.flagged_issues}

Assumptions Identified: ${
      issuesAndAssumptions.assumptions.length > 0
        ? issuesAndAssumptions.assumptions
            .map((a) => `- ${a.descriptiveTitle}: ${a.explanation}`)
            .join('\n')
        : 'No new assumptions identified'
    }

Generate a concise update message for the data team.`;

    const messages: CoreMessage[] = standardizeMessages(contextMessage);

    const tracedFollowUpMessage = wrapTraced(
      async () => {
        const response = await followUpMessageAgent.generate(messages, {
          toolChoice: 'required',
        });
        return response;
      },
      {
        name: 'Format Follow-up Message',
      }
    );

    const followUpResult = await tracedFollowUpMessage();

    // Extract tool call information
    const toolCalls = followUpResult.toolCalls || [];
    if (toolCalls.length === 0) {
      throw new Error('No tool was called by the format follow-up message agent');
    }

    const toolCall = toolCalls[0]; // Should only be one with maxSteps: 1
    if (!toolCall) {
      throw new Error('Tool call is undefined');
    }

    if (toolCall.toolName !== 'generateUpdateMessage') {
      throw new Error(`Unexpected tool called: ${toolCall.toolName}`);
    }

    const updateMessage = toolCall.args.update_message;

    // Return all input data plus the formatted message
    return {
      ...inputData,
      summaryMessage: updateMessage,
      summaryTitle: 'Follow-up Update', // Default title for follow-up messages
      message: updateMessage, // Store the update message in the message field as well
    };
  } catch (error) {
    console.error('Failed to format follow-up message:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to format the follow-up message. Please try again later.');
  }
};

export const formatFollowUpMessageStep = createStep({
  id: 'format-follow-up-message',
  description:
    'This step generates an update message for follow-up messages with new issues and assumptions identified.',
  inputSchema,
  outputSchema: formatFollowUpMessageOutputSchema,
  execute: formatFollowUpMessageStepExecution,
});
