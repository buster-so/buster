import { createStep } from '@mastra/core';
import { z } from 'zod';
import { MessageHistorySchema } from '../../utils/memory/types';
import { flagChatOutputSchema } from './flag-chat-step';
import { identifyAssumptionsOutputSchema } from './identify-assumptions-step';

// Input schema for parallel results
const inputSchema = z.object({
  'flag-chat': flagChatOutputSchema,
  'identify-assumptions': identifyAssumptionsOutputSchema,
});

// Output schema combines both results into a flat object
export const combineParallelResultsOutputSchema = z.object({
  // Base fields (from both steps, should be identical)
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  isSlackFollowUp: z
    .boolean()
    .describe('Whether this is a follow-up message for an existing Slack thread'),
  previousMessages: z.array(z.string()).describe('Array of previous messages for context'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),

  // Fields from flag-chat step
  toolCalled: z.string().describe('Name of the tool that was called by the flag chat agent'),
  flagChatMessage: z.string().optional().describe('The message from the flag chat tool'),
  flagChatTitle: z.string().optional().describe('The title from the flag chat tool'),

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
            'segmentInterpretation',
            'quantityInterpretation',
            'requestScope',
            'metricDefinition',
            'segmentDefinition',
            'businessLogic',
            'policyInterpretation',
            'optimization',
            'aggregation',
            'filtering',
            'sorting',
            'grouping',
            'calculationMethod',
            'dataRelevance',
            'valueScale',
            'joinSelection',
            'metricAmbiguity',
            'dataStaticAssumption',
            'uniqueIdentifier',
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

export const combineParallelResultsStepExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof combineParallelResultsOutputSchema>> => {
  const flagChatResult = inputData['flag-chat'];
  const assumptionsResult = inputData['identify-assumptions'];

  // Combine results into a flat object
  return {
    // Base fields (taking from flag-chat result, they should be identical)
    conversationHistory: flagChatResult.conversationHistory,
    userName: flagChatResult.userName,
    messageId: flagChatResult.messageId,
    userId: flagChatResult.userId,
    chatId: flagChatResult.chatId,
    isFollowUp: flagChatResult.isFollowUp,
    isSlackFollowUp: flagChatResult.isSlackFollowUp,
    previousMessages: flagChatResult.previousMessages,
    datasets: flagChatResult.datasets,

    // Fields from flag-chat step
    toolCalled: flagChatResult.toolCalled,
    flagChatMessage: flagChatResult.flagChatMessage,
    flagChatTitle: flagChatResult.flagChatTitle,

    // Fields from identify-assumptions step
    assumptions: assumptionsResult.assumptions,
  };
};

export const combineParallelResultsStep = createStep({
  id: 'combine-parallel-results',
  description:
    'This step combines the parallel results from flag-chat and identify-assumptions into a flat object.',
  inputSchema,
  outputSchema: combineParallelResultsOutputSchema,
  execute: combineParallelResultsStepExecution,
});
