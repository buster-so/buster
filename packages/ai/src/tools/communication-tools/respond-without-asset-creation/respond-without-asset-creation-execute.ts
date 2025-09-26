import { updateMessage, updateMessageEntries } from '@buster/database/queries';
import { wrapTraced } from 'braintrust';
import { cleanupState } from '../../shared/cleanup-state';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
import { createRespondWithoutAssetCreationRawLlmMessageEntry } from './helpers/respond-without-asset-creation-transform-helper';
import {
  RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME,
  type RespondWithoutAssetCreationContext,
  type RespondWithoutAssetCreationInput,
  type RespondWithoutAssetCreationOutput,
  type RespondWithoutAssetCreationState,
} from './respond-without-asset-creation-tool';

async function processRespondWithoutAssetCreation(
  state: RespondWithoutAssetCreationState,
  toolCallId: string,
  messageId: string
): Promise<RespondWithoutAssetCreationOutput> {
  const output: RespondWithoutAssetCreationOutput = {
    success: true,
  };

  // Create both the tool call and result messages to maintain proper ordering
  const rawLlmMessage = createRespondWithoutAssetCreationRawLlmMessageEntry(state, toolCallId);
  const rawToolResultEntry = createRawToolResultEntry(
    toolCallId,
    RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME,
    output
  );

  try {
    // Send both messages together: tool call followed by result
    const rawLlmMessages = rawLlmMessage
      ? [rawLlmMessage, rawToolResultEntry]
      : [rawToolResultEntry];

    await updateMessageEntries({
      messageId,
      rawLlmMessages,
    });

    // Mark the message as completed
    await updateMessage(messageId, {
      isCompleted: true,
    });
  } catch (error) {
    console.error('[respond-without-asset-creation] Error updating message entries:', error);
  }

  return output;
}

// Factory function that creates the execute function with proper context typing
export function createRespondWithoutAssetCreationExecute(
  context: RespondWithoutAssetCreationContext,
  state: RespondWithoutAssetCreationState
) {
  return wrapTraced(
    async (
      _input: RespondWithoutAssetCreationInput,
      options?: { toolCallId?: string }
    ): Promise<RespondWithoutAssetCreationOutput> => {
      // Use toolCallId from state if available, otherwise from options
      const toolCallId = state.toolCallId || options?.toolCallId;
      if (!toolCallId) {
        throw new Error('Tool call ID is required');
      }

      const result = await processRespondWithoutAssetCreation(state, toolCallId, context.messageId);
      cleanupState(state);
      return result;
    },
    { name: 'Respond Without Asset Creation' }
  );
}
