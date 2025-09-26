import { updateMessage, updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import type { UpdateMessageEntriesParams } from '../../../../../database/src/queries/messages/update-message-entries';
import {
  createRespondWithoutAssetCreationRawLlmMessageEntry,
  createRespondWithoutAssetCreationResponseMessage,
} from './helpers/respond-without-asset-creation-transform-helper';
import type {
  RespondWithoutAssetCreationContext,
  RespondWithoutAssetCreationState,
} from './respond-without-asset-creation-tool';

// Factory function that creates a type-safe callback for the specific agent context
export function createRespondWithoutAssetCreationStart(
  context: RespondWithoutAssetCreationContext,
  state: RespondWithoutAssetCreationState
) {
  return async function respondWithoutAssetCreationStart(options: ToolCallOptions): Promise<void> {
    // Reset state for new tool call to prevent contamination from previous calls
    state.toolCallId = options.toolCallId;
    state.args = undefined;
    state.final_response = undefined;

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

    // Only include the tool call message, not the result
    // The result will be added in the execute function
    if (rawLlmMessage) {
      entries.rawLlmMessages = [rawLlmMessage];
    }

    try {
      if (entries.responseMessages || entries.rawLlmMessages) {
        await updateMessageEntries(entries);
      }

      // Mark message as completed and add final reasoning message with workflow time
      if (context.messageId) {
        const currentTime = Date.now();
        const elapsedTimeMs = currentTime - context.workflowStartTime;
        const elapsedSeconds = Math.floor(elapsedTimeMs / 1000);

        let timeString: string;
        if (elapsedSeconds < 60) {
          timeString = `${elapsedSeconds} seconds`;
        } else {
          const elapsedMinutes = Math.floor(elapsedSeconds / 60);
          timeString = `${elapsedMinutes} minutes`;
        }

        await updateMessage(context.messageId, {
          finalReasoningMessage: `Reasoned for ${timeString}`,
        });
      }
    } catch (error) {
      console.error('[respond-without-asset-creation] Failed to update message entries:', error);
    }
  };
}
