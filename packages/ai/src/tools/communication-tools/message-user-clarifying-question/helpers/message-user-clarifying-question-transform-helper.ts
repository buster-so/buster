import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import {
  MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
  type MessageUserClarifyingQuestionInput,
  type MessageUserClarifyingQuestionState,
} from '../message-user-clarifying-question';

// Key definitions for type-safe extraction
export const MESSAGE_USER_CLARIFYING_QUESTION_KEYS = {
  clarifying_question: 'clarifying_question',
} as const;

// Helper to create response entry for clarifying question
export function createMessageUserClarifyingQuestionResponseMessage(
  state: MessageUserClarifyingQuestionState,
  toolCallId: string
): ChatMessageResponseMessage | undefined {
  if (!state.clarifyingQuestion) {
    return undefined;
  }

  return {
    id: toolCallId,
    type: 'text',
    message: state.clarifyingQuestion,
    is_final_message: true,
  };
}

// Helper to create raw LLM message entry
export function createMessageUserClarifyingQuestionRawLlmMessageEntry(
  state: MessageUserClarifyingQuestionState,
  toolCallId: string
): ModelMessage | undefined {
  // Follow the same pattern as done-tool - use the extracted value, not raw args
  if (!state.clarifyingQuestion) {
    return undefined;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName: MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
        input: { clarifying_question: state.clarifyingQuestion },
      },
    ],
  };
}

// Helper to extract clarifying question value from optimistic parse
export function extractClarifyingQuestion(extractedValues: Map<string, unknown>): string {
  const question = extractedValues.get(MESSAGE_USER_CLARIFYING_QUESTION_KEYS.clarifying_question);

  if (typeof question === 'string') {
    return question;
  }

  return '';
}
