import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { combineParallelResultsStep } from '../steps/post-processing/combine-parallel-results-step';
import { flagChatStep } from '../steps/post-processing/flag-chat-step';
import {
  formatFollowUpMessageOutputSchema,
  formatFollowUpMessageStep,
} from '../steps/post-processing/format-follow-up-message-step';
import {
  formatInitialMessageOutputSchema,
  formatInitialMessageStep,
} from '../steps/post-processing/format-initial-message-step';
import { identifyAssumptionsStep } from '../steps/post-processing/identify-assumptions-step';
import { MessageHistorySchema } from '../utils/memory/types';

// Input schema for the post-processing workflow
const postProcessingWorkflowInputSchema = z.object({
  conversationHistory: MessageHistorySchema.optional(),
  name: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  previousMessages: z.array(z.string()).describe('Array of the previous post-processing messages'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),
});

// Output schema that represents the flat object from either branch
const postProcessingWorkflowOutputSchema = z.union([
  formatFollowUpMessageOutputSchema,
  formatInitialMessageOutputSchema,
]);

// Export types for use in other modules
export type PostProcessingWorkflowInput = z.infer<typeof postProcessingWorkflowInputSchema>;
export type PostProcessingWorkflowOutput = z.infer<typeof postProcessingWorkflowOutputSchema>;

const postProcessingWorkflow = createWorkflow({
  id: 'post-processing-workflow',
  inputSchema: postProcessingWorkflowInputSchema,
  outputSchema: postProcessingWorkflowOutputSchema,
})
  .parallel([flagChatStep, identifyAssumptionsStep])
  .then(combineParallelResultsStep)
  .branch([
    // Branch for follow-up messages
    [async ({ inputData }) => inputData?.isFollowUp === true, formatFollowUpMessageStep],
    // Branch for initial messages
    [async ({ inputData }) => inputData?.isFollowUp === false, formatInitialMessageStep],
  ])
  .commit();

export default postProcessingWorkflow;

// Re-export schemas for external use
export { postProcessingWorkflowInputSchema, postProcessingWorkflowOutputSchema };
