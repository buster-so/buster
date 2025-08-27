import { updateMessage, updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { UpdateMessageEntriesParams } from '../../../../../database/src/queries/messages/update-message-entries';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
import {
  createMessageUserClarifyingQuestionRawLlmMessageEntry,
  createMessageUserClarifyingQuestionResponseMessage,
} from './helpers/message-user-clarifying-question-transform-helper';
import {
  MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
  type MessageUserClarifyingQuestionContext,
  type MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Factory function that creates a type-safe callback for the specific agent context
export function createMessageUserClarifyingQuestionStart(
  context: MessageUserClarifyingQuestionContext,
  state: MessageUserClarifyingQuestionState
) {
  return async function messageUserClarifyingQuestionStart(
    options: ToolCallOptions
  ): Promise<void> {
    // Reset state for new tool call to prevent contamination from previous calls
    state.toolCallId = options.toolCallId;
    state.args = undefined;
    state.clarifyingQuestion = undefined;

    const responseEntry = createMessageUserClarifyingQuestionResponseMessage(
      state,
      options.toolCallId
    );
    const rawLlmMessage = createMessageUserClarifyingQuestionRawLlmMessageEntry(
      state,
      options.toolCallId
    );

    // Create the tool result immediately with success: true
    // This ensures it's always present even if the stream terminates early
    const rawToolResultEntry = createRawToolResultEntry(
      options.toolCallId,
      MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
      {
        success: true,
      }
    );

    const entries: UpdateMessageEntriesParams = {
      messageId: context.messageId,
    };

    if (responseEntry) {
      entries.responseMessages = [responseEntry];
    }

    // Include both the tool call and tool result in raw LLM messages
    // Since it's an upsert, sending both together ensures completeness
    const rawLlmMessages = [];
    if (rawLlmMessage) {
      rawLlmMessages.push(rawLlmMessage);
    }
    rawLlmMessages.push(rawToolResultEntry);

    if (rawLlmMessages.length > 0) {
      entries.rawLlmMessages = rawLlmMessages;
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
          isCompleted: true,
          finalReasoningMessage: `Reasoned for ${timeString}`,
        });
      }
    } catch (error) {
      console.error('[message-user-clarifying-question] Failed to update message entries:', error);
    }
  };
}
