import { updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
import { messageUserClarifyingQuestionRawLlmMessageEntry } from './helpers/message-user-clarifying-question-transform-helper';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionOutput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';
import { MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME } from './message-user-clarifying-question';

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
  const rawLlmMessage = messageUserClarifyingQuestionRawLlmMessageEntry(toolCallId, state);
  const rawToolResultEntry = createRawToolResultEntry(
    toolCallId,
    MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
    output
  );

  try {
    // Send both messages together: tool call followed by result
    await updateMessageEntries({
      messageId,
      rawLlmMessages: [rawLlmMessage, rawToolResultEntry],
    });
  } catch (error) {
    console.error('[message-user-clarifying-question] Error updating message entries:', error);
  }

  return output;
}

// Factory function for execute callback
export function createMessageUserClarifyingQuestionExecute(
  context: MessageUserClarifyingQuestionContext,
  state: MessageUserClarifyingQuestionState
) {
  // Wrap the execution with tracing
  const executeMessageUserClarifyingQuestion = wrapTraced(
    async (
      _input: MessageUserClarifyingQuestionInput
    ): Promise<MessageUserClarifyingQuestionOutput> => {
      if (!state.toolCallId) {
        throw new Error('Tool call ID is required');
      }

      return processMessageUserClarifyingQuestion(state, state.toolCallId, context.messageId);
    },
    { name: 'Message User Clarifying Question' }
  );

  // Return the execute function
  return async (
    input: MessageUserClarifyingQuestionInput
  ): Promise<MessageUserClarifyingQuestionOutput> => {
    return await executeMessageUserClarifyingQuestion(input);
  };
}
