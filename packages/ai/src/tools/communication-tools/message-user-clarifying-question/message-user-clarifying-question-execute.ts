import { updateMessage, updateMessageEntries } from '@buster/database/queries';
import { wrapTraced } from 'braintrust';
import { cleanupState } from '../../shared/cleanup-state';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
import { createMessageUserClarifyingQuestionRawLlmMessageEntry } from './helpers/message-user-clarifying-question-transform-helper';
import {
  MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
  type MessageUserClarifyingQuestionContext,
  type MessageUserClarifyingQuestionInput,
  type MessageUserClarifyingQuestionOutput,
  type MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Process message user clarifying question tool execution
async function processMessageUserClarifyingQuestion(
  state: MessageUserClarifyingQuestionState,
  toolCallId: string,
  messageId: string
): Promise<MessageUserClarifyingQuestionOutput> {
  const output: MessageUserClarifyingQuestionOutput = {
    success: true,
  };

  // Create both the tool call and result messages to maintain proper ordering
  const rawLlmMessage = createMessageUserClarifyingQuestionRawLlmMessageEntry(state, toolCallId);
  const rawToolResultEntry = createRawToolResultEntry(
    toolCallId,
    MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
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
    console.error('[message-user-clarifying-question] Error updating message entries:', error);
  }

  return output;
}

// Factory function that creates the execute function with proper context typing
export function createMessageUserClarifyingQuestionExecute(
  context: MessageUserClarifyingQuestionContext,
  state: MessageUserClarifyingQuestionState
) {
  return wrapTraced(
    async (
      _input: MessageUserClarifyingQuestionInput,
      options?: { toolCallId?: string }
    ): Promise<MessageUserClarifyingQuestionOutput> => {
      // Use toolCallId from state if available, otherwise from options
      const toolCallId = state.toolCallId || options?.toolCallId;
      if (!toolCallId) {
        throw new Error('Tool call ID is required');
      }

      const result = await processMessageUserClarifyingQuestion(
        state,
        toolCallId,
        context.messageId
      );
      cleanupState(state);
      return result;
    },
    { name: 'Message User Clarifying Question' }
  );
}
