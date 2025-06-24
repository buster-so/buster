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
  name: z.string().describe('Name for the post-processing operation'),
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

export const formatInitialMessageOutputSchema = z.object({
  // Pass through all input fields
  conversationHistory: MessageHistorySchema.optional(),
  name: z.string().describe('Name for the post-processing operation'),
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
    .describe('The formatted summary message for initial message, or null if no major assumptions'),
});

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
</output_format>
`;

const DEFAULT_OPTIONS = {
  maxSteps: 1,
};

export const initialMessageAgent = new Agent({
  name: 'Format Initial Message',
  instructions: initialMessageInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});

const formatInitialMessageStepExecution = async ({
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
        formattedMessage: null,
      };
    }

    // Prepare context about issues and assumptions for the agent
    const issuesAndAssumptions = {
      flagged_issues: inputData.summaryMessage || inputData.message || 'No issues flagged',
      major_assumptions: majorAssumptions,
    };

    const contextMessage = `Issues and assumptions identified from the chat that require data team attention:

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
          output: z.object({
            title: z.string().describe('A concise title for the summary message, 3-6 words long.'),
            summary_message: z
              .string()
              .describe('A simple and concise summary of the issues and assumptions.'),
          }),
        });
        return response.object;
      },
      {
        name: 'Format Initial Message',
      }
    );

    const initialResult = await tracedInitialMessage();
    const summaryMessage = `${initialResult.title}: ${initialResult.summary_message}`;

    // Return all input data plus the formatted message
    return {
      ...inputData,
      formattedMessage: summaryMessage,
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
