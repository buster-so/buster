import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { MessageHistorySchema } from '../../utils/memory/types';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { standardizeMessages } from '../../utils/standardizeMessages';

// Input schema that accepts the combined results from parallel steps
const inputSchema = z.object({
  // Base fields
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('True if this is a follow-up message'),
  previousMessages: z.array(z.string()).describe('Array of previous messages for context'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),

  // Fields from flag-chat step
  toolCalled: z.string().describe('Name of the tool that was called by the flag chat agent'),
  summaryMessage: z.string().optional().describe('Brief summary of the issue detected'),
  summaryTitle: z.string().optional().describe('Short 3-6 word title for the summary'),
  message: z.string().optional().describe('Confirmation message indicating no issues found'),

  // Fields from identify-assumptions step
  assumptions: z
    .array(
      z.object({
        descriptiveTitle: z.string().describe('A clear, descriptive title for the assumption'),
        classification: z
          .enum([
            'fieldMapping',
            'tableRelationship',
            'dataQuality',
            'dataFormat',
            'dataAvailability',
            'timePeriodInterpretation',
            'timePeriodGranularity',
            'metricInterpretation',
            'metricDefinition',
            'businessLogic',
            'segmentInterpretation',
            'segmentDefinition',
            'requestScope',
            'quantityInterpretation',
            'aggregation',
            'filtering',
            'sorting',
            'grouping',
            'calculationMethod',
            'dataRelevance',
            'dataInterpretation',
          ])
          .describe('The type/category of assumption made'),
        explanation: z
          .string()
          .describe('Detailed explanation of the assumption and its potential impact'),
        label: z
          .enum(['timeRelated', 'vagueRequest', 'major', 'minor'])
          .describe('Label indicating the nature and severity of the assumption'),
      })
    )
    .optional()
    .describe('List of assumptions identified'),
});

export const formatFollowUpMessageOutputSchema = z.object({
  // Pass through all input fields
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('True if this is a follow-up message'),
  previousMessages: z.array(z.string()).describe('Array of previous messages for context'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),

  // Fields from previous steps
  toolCalled: z.string().describe('Name of the tool that was called by the flag chat agent'),
  summaryMessage: z.string().optional().describe('Brief summary of the issue detected'),
  summaryTitle: z.string().optional().describe('Short 3-6 word title for the summary'),
  message: z.string().optional().describe('Confirmation message indicating no issues found'),
  assumptions: z
    .array(
      z.object({
        descriptiveTitle: z.string().describe('A clear, descriptive title for the assumption'),
        classification: z
          .enum([
            'fieldMapping',
            'tableRelationship',
            'dataQuality',
            'dataFormat',
            'dataAvailability',
            'timePeriodInterpretation',
            'timePeriodGranularity',
            'metricInterpretation',
            'metricDefinition',
            'businessLogic',
            'segmentInterpretation',
            'segmentDefinition',
            'requestScope',
            'quantityInterpretation',
            'aggregation',
            'filtering',
            'sorting',
            'grouping',
            'calculationMethod',
            'dataRelevance',
            'dataInterpretation',
          ])
          .describe('The type/category of assumption made'),
        explanation: z
          .string()
          .describe('Detailed explanation of the assumption and its potential impact'),
        label: z
          .enum(['timeRelated', 'vagueRequest', 'major', 'minor'])
          .describe('Label indicating the nature and severity of the assumption'),
      })
    )
    .optional()
    .describe('List of assumptions identified'),

  // New field for this step
  formattedMessage: z
    .string()
    .nullable()
    .describe('The formatted update message for follow-up, or null'),
});

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
      flagged_issues: inputData.summaryMessage || inputData.message || 'No issues flagged',
      assumptions: inputData.assumptions || [],
    };

    const contextMessage = `New issues and assumptions identified from the latest chat messages:

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
          output: z.object({
            update_message: z
              .string()
              .describe(
                'A concise summary of the new issues and assumptions within the context of the Slack thread.'
              ),
          }),
        });
        return response.object;
      },
      {
        name: 'Format Follow-up Message',
      }
    );

    const followUpResult = await tracedFollowUpMessage();
    const updateMessage = followUpResult.update_message;

    // Return all input data plus the formatted message
    return {
      ...inputData,
      formattedMessage: updateMessage,
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
