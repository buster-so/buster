import type { PermissionedDataset } from '@buster/access-controls';
import type { MessageHistory } from '@buster/ai/utils/memory/types';
import type { PostProcessingWorkflowInput } from '@buster/ai/workflows/post-processing-workflow';
import type { MessageContext, PostProcessingResult } from '../types';

/**
 * Extract post-processing messages as string array
 */
export function formatPreviousMessages(results: PostProcessingResult[]): string[] {
  return results
    .map((result) => {
      try {
        if (typeof result.postProcessingMessage === 'string') {
          return result.postProcessingMessage;
        }
        // Convert object to formatted string
        return JSON.stringify(result.postProcessingMessage, null, 2);
      } catch (_error) {
        // Skip messages that can't be formatted
        return '';
      }
    })
    .filter((msg) => msg.length > 0);
}

/**
 * Concatenate dataset YAML files
 */
export function concatenateDatasets(datasets: PermissionedDataset[]): string {
  const validDatasets = datasets.filter(
    (dataset) => dataset.ymlContent !== null && dataset.ymlContent !== undefined
  );

  if (validDatasets.length === 0) {
    return '';
  }

  return validDatasets.map((dataset) => dataset.ymlContent).join('\n---\n');
}

/**
 * Build complete workflow input from collected data
 */
export function buildWorkflowInput(
  messageContext: MessageContext,
  previousPostProcessingResults: PostProcessingResult[],
  datasets: PermissionedDataset[],
  slackMessageExists: boolean
): PostProcessingWorkflowInput {
  // Use conversation history directly from the message context
  const conversationHistory = messageContext.rawLlmMessages as MessageHistory;

  // Determine if this is a follow-up
  const isFollowUp = previousPostProcessingResults.length > 0;

  // Determine if this is a Slack follow-up (both follow-up AND Slack message exists)
  const isSlackFollowUp = isFollowUp && slackMessageExists;

  // Format previous messages
  const previousMessages = formatPreviousMessages(previousPostProcessingResults);

  // Concatenate datasets
  const datasetsYaml = concatenateDatasets(datasets);

  return {
    conversationHistory,
    userName: messageContext.userName || 'Unknown User',
    messageId: messageContext.id,
    userId: messageContext.createdBy,
    chatId: messageContext.chatId,
    isFollowUp,
    isSlackFollowUp,
    previousMessages,
    datasets: datasetsYaml,
  };
}
