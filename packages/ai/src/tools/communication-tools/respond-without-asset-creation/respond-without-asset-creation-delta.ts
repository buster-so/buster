import { type UpdateMessageEntriesParams, updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../utils/streaming/optimistic-json-parser';
import {
  createRespondWithoutAssetCreationRawLlmMessageEntry,
  createRespondWithoutAssetCreationResponseMessage,
} from './helpers/respond-without-asset-creation-transform-helper';
import type {
  RespondWithoutAssetCreationContext,
  RespondWithoutAssetCreationInput,
  RespondWithoutAssetCreationState,
} from './respond-without-asset-creation-tool';

// Type-safe key extraction from the schema - will cause compile error if field name changes
// Using keyof with the inferred type ensures we're using the actual schema keys
const FINAL_RESPONSE_KEY =
  'final_response' as const satisfies keyof RespondWithoutAssetCreationInput;

export function createRespondWithoutAssetCreationDelta(
  context: RespondWithoutAssetCreationContext,
  state: RespondWithoutAssetCreationState
) {
  return async function respondWithoutAssetCreationDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Accumulate the delta to the args
    state.args = (state.args || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(state.args);

    // Extract final_response from the optimistically parsed values - type-safe key
    const finalResponse = getOptimisticValue<string>(
      parseResult.extractedValues,
      FINAL_RESPONSE_KEY
    );

    if (finalResponse !== undefined && finalResponse !== '') {
      // Update the state with the extracted final_response
      state.final_response = finalResponse;

      // Create the response entries with the current state
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
        console.error(
          '[respond-without-asset-creation] Failed to update streaming entries:',
          error
        );
      }
    }
  };
}
