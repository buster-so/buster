import type { PermissionedDataset } from '@buster/access-controls';
import type { MessageHistory } from '@buster/ai/utils/memory/types';
import type { PostProcessingWorkflowInput } from '@buster/ai/workflows/post-processing-workflow';
import type { CoreMessage } from 'ai';
import type { ConversationMessage, MessageContext, PostProcessingResult } from '../types';

/**
 * Combine raw LLM messages from multiple messages into a single conversation history
 */
export function buildConversationHistory(
  messages: ConversationMessage[]
): MessageHistory | undefined {
  if (messages.length === 0) {
    return undefined;
  }

  const allMessages: CoreMessage[] = [];

  for (const message of messages) {
    if (!message.rawLlmMessages) {
      continue;
    }

    try {
      // rawLlmMessages from the database is already CoreMessage[]
      if (Array.isArray(message.rawLlmMessages)) {
        allMessages.push(...message.rawLlmMessages);
      }
    } catch (_error) {
      // Skip messages that can't be parsed
      // Continue with other messages
    }
  }

  if (allMessages.length === 0) {
    return undefined;
  }

  // Return as MessageHistory which is CoreMessage[]
  return allMessages as MessageHistory;
}

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
    (dataset) => dataset.ymlFile !== null && dataset.ymlFile !== undefined
  );

  if (validDatasets.length === 0) {
    return '';
  }

  return validDatasets.map((dataset) => dataset.ymlFile).join('\n---\n');
}

/**
 * Build complete workflow input from collected data
 */
export function buildWorkflowInput(
  messageContext: MessageContext,
  conversationMessages: ConversationMessage[],
  previousPostProcessingResults: PostProcessingResult[],
  datasets: PermissionedDataset[]
): PostProcessingWorkflowInput {
  // Build conversation history from all messages
  const conversationHistory = buildConversationHistory(conversationMessages);

  // Determine if this is a follow-up
  const isFollowUp = previousPostProcessingResults.length > 0;

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
    previousMessages,
    datasets: datasetsYaml,
  };
}
