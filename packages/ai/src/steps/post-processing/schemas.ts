import { z } from 'zod';
import { MessageHistorySchema } from '../../utils/memory/types';

// Input schema for the post-processing workflow
export const postProcessingWorkflowInputSchema = z.object({
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  previousMessages: z.array(z.string()).describe('Array of the previous post-processing messages'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),
});

// Unified output schema for the post-processing workflow and format message steps
export const postProcessingWorkflowOutputSchema = z.object({
  // Pass through all input fields
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  previousMessages: z.array(z.string()).describe('Array of the previous post-processing messages'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),

  // Fields from flag-chat step
  toolCalled: z.string().describe('Name of the tool that was called by the flag chat agent'),
  summaryMessage: z.string().optional().describe('Brief summary of the issue detected'),
  summaryTitle: z.string().optional().describe('Short 3-6 word title for the summary'),
  flagChatMessage: z
    .string()
    .optional()
    .describe('Confirmation message indicating no issues found'),
  flagChatTitle: z.string().optional().describe('Short 3-6 word title for the summary'),

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

  // Fields from format message steps
  formattedMessage: z
    .string()
    .nullable()
    .optional()
    .describe('The formatted message content for Slack notifications'),
  message: z.string().optional().describe('The update message content from follow-up messages'),
});

// Export types for use in other modules
export type PostProcessingWorkflowInput = z.infer<typeof postProcessingWorkflowInputSchema>;
export type PostProcessingWorkflowOutput = z.infer<typeof postProcessingWorkflowOutputSchema>;
