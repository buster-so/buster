import { createWorkflow } from '@mastra/core';
import { combineParallelResultsStep } from '../steps/post-processing/combine-parallel-results-step';
import { flagChatStep } from '../steps/post-processing/flag-chat-step';
import { formatFollowUpMessageStep } from '../steps/post-processing/format-follow-up-message-step';
import { formatInitialMessageStep } from '../steps/post-processing/format-initial-message-step';
import { identifyAssumptionsStep } from '../steps/post-processing/identify-assumptions-step';
import {
  postProcessingWorkflowInputSchema,
  postProcessingWorkflowOutputSchema,
} from '../steps/post-processing/schemas';
import type {
  PostProcessingWorkflowInput,
  PostProcessingWorkflowOutput,
} from '../steps/post-processing/schemas';

const postProcessingWorkflow = createWorkflow({
  id: 'post-processing-workflow',
  inputSchema: postProcessingWorkflowInputSchema,
  outputSchema: postProcessingWorkflowOutputSchema,
})
  .parallel([flagChatStep, identifyAssumptionsStep])
  .then(combineParallelResultsStep)
  .branch([
    // Branch for follow-up messages (only if it's both a follow-up AND Slack message exists)
    [
      async ({ inputData }) =>
        inputData?.isFollowUp === true && inputData?.isSlackFollowUp === true,
      formatFollowUpMessageStep,
    ],
    // Otherwise use initial message format
    [async ({ inputData }) => inputData?.isSlackFollowUp === false, formatInitialMessageStep],
  ])
  .commit();

export default postProcessingWorkflow;

// Re-export schemas and types for external use
export {
  postProcessingWorkflowInputSchema,
  postProcessingWorkflowOutputSchema,
  type PostProcessingWorkflowInput,
  type PostProcessingWorkflowOutput,
};
