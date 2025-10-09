import type { ModelMessage } from '@buster/ai';

/**
 * State for accumulating messages during agent streaming
 */
export interface MessageAccumulatorState {
  messages: ModelMessage[];
  currentStepAssistantMessage: ModelMessage | null;
  currentToolMessage: ModelMessage | null;
  assistantMessageCreated: boolean;
}

/**
 * Creates initial accumulator state
 */
export function createMessageAccumulatorState(
  initialMessages: ModelMessage[] = []
): MessageAccumulatorState {
  return {
    messages: [...initialMessages],
    currentStepAssistantMessage: null,
    currentToolMessage: null,
    assistantMessageCreated: false,
  };
}

/**
 * Resets step-specific state when a new step starts
 */
export function resetStepState(state: MessageAccumulatorState): MessageAccumulatorState {
  return {
    ...state,
    currentStepAssistantMessage: null,
    currentToolMessage: null,
    assistantMessageCreated: false,
  };
}

/**
 * Adds reasoning content to the current step's assistant message
 */
export function addReasoningContent(
  state: MessageAccumulatorState,
  reasoning: string
): MessageAccumulatorState {
  const reasoningContent = {
    type: 'reasoning' as const,
    text: reasoning,
  };

  if (!state.assistantMessageCreated) {
    // Create new assistant message
    const assistantMessage: ModelMessage = {
      role: 'assistant',
      content: [reasoningContent],
    };

    return {
      ...state,
      messages: [...state.messages, assistantMessage],
      currentStepAssistantMessage: assistantMessage,
      assistantMessageCreated: true,
    };
  }

  // Append to existing assistant message
  if (
    state.currentStepAssistantMessage &&
    Array.isArray(state.currentStepAssistantMessage.content)
  ) {
    (state.currentStepAssistantMessage.content as (typeof reasoningContent)[]).push(
      reasoningContent
    );
  }

  return state;
}

/**
 * Adds text content to the current step's assistant message
 */
export function addTextContent(
  state: MessageAccumulatorState,
  text: string
): MessageAccumulatorState {
  const textContent = {
    type: 'text' as const,
    text,
  };

  if (!state.assistantMessageCreated) {
    // Create new assistant message
    const assistantMessage: ModelMessage = {
      role: 'assistant',
      content: [textContent],
    };

    return {
      ...state,
      messages: [...state.messages, assistantMessage],
      currentStepAssistantMessage: assistantMessage,
      assistantMessageCreated: true,
    };
  }

  // Append to existing assistant message
  if (
    state.currentStepAssistantMessage &&
    Array.isArray(state.currentStepAssistantMessage.content)
  ) {
    (state.currentStepAssistantMessage.content as (typeof textContent)[]).push(textContent);
  }

  return state;
}

/**
 * Adds a tool call to the current step's assistant message
 */
export function addToolCall(
  state: MessageAccumulatorState,
  toolCallId: string,
  toolName: string,
  input: unknown
): MessageAccumulatorState {
  const toolCallContent = {
    type: 'tool-call' as const,
    toolCallId,
    toolName,
    input,
  };

  if (!state.assistantMessageCreated) {
    // Create new assistant message
    const assistantMessage: ModelMessage = {
      role: 'assistant',
      content: [toolCallContent],
    };

    return {
      ...state,
      messages: [...state.messages, assistantMessage],
      currentStepAssistantMessage: assistantMessage,
      assistantMessageCreated: true,
    };
  }

  // Append to existing assistant message (critical: use tracked reference!)
  if (
    state.currentStepAssistantMessage &&
    Array.isArray(state.currentStepAssistantMessage.content)
  ) {
    (state.currentStepAssistantMessage.content as (typeof toolCallContent)[]).push(toolCallContent);
  }

  return state;
}

/**
 * Adds a tool result to the current step's tool message
 * All tool results for a step go into a single tool message
 */
export function addToolResult(
  state: MessageAccumulatorState,
  toolCallId: string,
  toolName: string,
  output: string | Record<string, unknown>
): MessageAccumulatorState {
  const toolResultContent = {
    type: 'tool-result' as const,
    toolCallId,
    toolName,
    output: {
      type: 'json' as const,
      value: typeof output === 'string' ? output : JSON.stringify(output),
    },
  };

  if (!state.currentToolMessage) {
    // Create the tool message on first result
    const toolMessage: ModelMessage = {
      role: 'tool',
      content: [toolResultContent],
    };

    return {
      ...state,
      messages: [...state.messages, toolMessage],
      currentToolMessage: toolMessage,
    };
  }

  // Append to existing tool message
  if (Array.isArray(state.currentToolMessage.content)) {
    (state.currentToolMessage.content as (typeof toolResultContent)[]).push(toolResultContent);
  }

  return state;
}
