import { updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
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
  } catch (error) {
    console.error('[respond-without-asset-creation] Error updating message entries:', error);
  }

  return output;
}

export function createRespondWithoutAssetCreationExecute(
  context: RespondWithoutAssetCreationContext,
  state: RespondWithoutAssetCreationState
) {
  return wrapTraced(
    async (
      _input: RespondWithoutAssetCreationInput
    ): Promise<RespondWithoutAssetCreationOutput> => {
      if (!state.toolCallId) {
        throw new Error('Tool call ID is required');
      }

      return await processRespondWithoutAssetCreation(state, state.toolCallId, context.messageId);
    },
    { name: 'Respond Without Asset Creation' }
  );
}
