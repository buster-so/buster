import { type UpdateMessageEntriesParams, updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createMessageUserClarifyingQuestionRawLlmMessageEntry,
  createMessageUserClarifyingQuestionResponseMessage,
} from './helpers/message-user-clarifying-question-transform-helper';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

export function createMessageUserClarifyingQuestionFinish(
  context: MessageUserClarifyingQuestionContext,
  state: MessageUserClarifyingQuestionState
) {
  return async function messageUserClarifyingQuestionFinish(
    options: { input: MessageUserClarifyingQuestionInput } & ToolCallOptions
  ): Promise<void> {
    state.toolCallId = options.toolCallId;
    state.clarifyingQuestion = options.input.clarifying_question;

    const responseEntry = createMessageUserClarifyingQuestionResponseMessage(
      state,
      options.toolCallId
    );
    const rawLlmMessage = createMessageUserClarifyingQuestionRawLlmMessageEntry(
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
      console.error('[message-user-clarifying-question] Failed to update message entries:', error);
    }
  };
}
