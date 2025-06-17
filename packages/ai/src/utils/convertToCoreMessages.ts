import type {
  CoreAssistantMessage,
  CoreMessage,
  CoreSystemMessage,
  CoreToolMessage,
  CoreUserMessage,
  TextPart,
  ToolCallPart,
  ToolResultPart,
} from 'ai';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

interface ToolResultData {
  toolName: string;
  result: unknown;
}

/**
 * Converts OpenAI message format to AI SDK CoreMessage format
 */
export function convertToCoreMessages(openAIMessages: OpenAIMessage[]): CoreMessage[] {
  const coreMessages: CoreMessage[] = [];
  const toolResults: Map<string, ToolResultData> = new Map();

  // First pass: collect tool results
  for (const message of openAIMessages) {
    if (message.role === 'tool' && message.tool_call_id && message.content) {
      try {
        const result = JSON.parse(message.content);
        toolResults.set(message.tool_call_id, {
          toolName: message.name || 'unknown_tool',
          result,
        });
      } catch {
        // If content isn't JSON, use as string
        toolResults.set(message.tool_call_id, {
          toolName: message.name || 'unknown_tool',
          result: message.content,
        });
      }
    }
  }

  // Second pass: convert messages
  for (const message of openAIMessages) {
    switch (message.role) {
      case 'system':
        coreMessages.push({
          role: 'system',
          content: message.content || '',
        } as CoreSystemMessage);
        break;

      case 'user':
        coreMessages.push({
          role: 'user',
          content: message.content || '',
        } as CoreUserMessage);
        break;

      case 'assistant':
        if (message.tool_calls && message.tool_calls.length > 0) {
          // Assistant message with tool calls
          const content: Array<TextPart | ToolCallPart> = [];

          // Add text content if present
          if (message.content) {
            content.push({
              type: 'text',
              text: message.content,
            });
          }

          // Add tool calls
          for (const toolCall of message.tool_calls) {
            let args: unknown;
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch {
              args = toolCall.function.arguments;
            }

            content.push({
              type: 'tool-call',
              toolCallId: toolCall.id,
              toolName: toolCall.function.name,
              args,
            });
          }

          coreMessages.push({
            role: 'assistant',
            content,
          } as CoreAssistantMessage);

          // Check if we have tool results for these tool calls
          const hasResults = message.tool_calls.some((tc) => toolResults.has(tc.id));

          if (hasResults) {
            const toolContent: ToolResultPart[] = [];

            for (const toolCall of message.tool_calls) {
              const toolResult = toolResults.get(toolCall.id);
              if (toolResult) {
                toolContent.push({
                  type: 'tool-result',
                  toolCallId: toolCall.id,
                  toolName: toolResult.toolName,
                  result: toolResult.result,
                });
              }
            }

            if (toolContent.length > 0) {
              coreMessages.push({
                role: 'tool',
                content: toolContent,
              } as CoreToolMessage);
            }
          }
        } else {
          // Regular assistant message
          coreMessages.push({
            role: 'assistant',
            content: message.content || '',
          } as CoreAssistantMessage);
        }
        break;

      case 'tool':
        // Tool messages are handled in the assistant case above
        // Skip them here to avoid duplication
        break;

      default:
        console.warn(`Unknown message role: ${(message as { role: string }).role}`);
    }
  }

  return coreMessages;
}

/**
 * Type guard to check if a message array is in OpenAI format
 */
export function isOpenAIMessageFormat(messages: unknown[]): messages is OpenAIMessage[] {
  return (
    messages.length > 0 &&
    messages.every(
      (msg) =>
        typeof msg.role === 'string' && ['system', 'user', 'assistant', 'tool'].includes(msg.role)
    )
  );
}

/**
 * Utility to convert a single OpenAI message to CoreMessage
 */
export function convertSingleMessage(openAIMessage: OpenAIMessage): CoreMessage[] {
  return convertToCoreMessages([openAIMessage]);
}
