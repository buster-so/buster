import { type UpdateMessageEntriesParams, updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createRespondWithoutAssetCreationRawLlmMessageEntry,
  createRespondWithoutAssetCreationResponseMessage,
} from './helpers/respond-without-asset-creation-transform-helper';
import type {
  RespondWithoutAssetCreationContext,
  RespondWithoutAssetCreationInput,
  RespondWithoutAssetCreationState,
} from './respond-without-asset-creation-tool';

export function createRespondWithoutAssetCreationFinish(
  context: RespondWithoutAssetCreationContext,
  state: RespondWithoutAssetCreationState
) {
  return async function respondWithoutAssetCreationFinish(
    options: { input: RespondWithoutAssetCreationInput } & ToolCallOptions
  ): Promise<void> {
    state.toolCallId = options.toolCallId;
    state.final_response = options.input.final_response;

    const responseEntry = createRespondWithoutAssetCreationResponseMessage(
      state,
      options.toolCallId
    );
    const rawLlmMessage = createRespondWithoutAssetCreationRawLlmMessageEntry(
      state,
      options.toolCallId
    );

    const entries: UpdateMessageEntriesParams = {
      messageId: context.messageId,
    };

    if (responseEntry) {
      entries.responseMessages = [responseEntry];
    }

    if (rawLlmMessage) {
      entries.rawLlmMessages = [rawLlmMessage];
    }

    try {
      if (entries.responseMessages || entries.rawLlmMessages) {
        await updateMessageEntries(entries);
      }
    } catch (error) {
      console.error('[respond-without-asset-creation] Failed to update message entries:', error);
    }
  };
}
