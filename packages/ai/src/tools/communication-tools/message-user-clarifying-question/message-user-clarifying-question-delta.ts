import { type UpdateMessageEntriesParams, updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../utils/streaming/optimistic-json-parser';
import {
  createMessageUserClarifyingQuestionRawLlmMessageEntry,
  createMessageUserClarifyingQuestionResponseMessage,
} from './helpers/message-user-clarifying-question-transform-helper';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Type-safe key extraction from the schema - will cause compile error if field name changes
// Using keyof with the inferred type ensures we're using the actual schema keys
const CLARIFYING_QUESTION_KEY =
  'clarifying_question' as const satisfies keyof MessageUserClarifyingQuestionInput;

export function createMessageUserClarifyingQuestionDelta(
  context: MessageUserClarifyingQuestionContext,
  state: MessageUserClarifyingQuestionState
) {
  return async function messageUserClarifyingQuestionDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Accumulate the delta to the args
    state.args = (state.args || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(state.args);

    // Extract clarifying_question from the optimistically parsed values - type-safe key
    const clarifyingQuestion = getOptimisticValue<string>(
      parseResult.extractedValues,
      CLARIFYING_QUESTION_KEY
    );

    if (clarifyingQuestion !== undefined && clarifyingQuestion !== '') {
      // Update the state with the extracted clarifying_question
      state.clarifyingQuestion = clarifyingQuestion;

      // Create the response entries with the current state
      const responseEntry = createMessageUserClarifyingQuestionResponseMessage(
        state,
        options.toolCallId
      );
      const rawLlmMessage = createMessageUserClarifyingQuestionRawLlmMessageEntry(
        state,
        options.toolCallId || ''
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
          '[message-user-clarifying-question] Failed to update streaming entries:',
          error
        );
      }
    }
  };
}
