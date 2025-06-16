import type { CoreMessage, ToolCallPart } from 'ai';

/**
 * Format a single CoreMessage as a reasoning entry
 */
function formatMessageAsReasoningEntry(message: CoreMessage): unknown {
  if (!message) {
    console.error('formatMessageAsReasoningEntry: Received null/undefined message');
    return null;
  }

  try {
    // Check if this is an assistant message with tool calls
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      const toolCalls = message.content.filter(
        (part): part is ToolCallPart => part.type === 'tool-call'
      );

      if (toolCalls.length > 0) {
        // Process each tool call and extract its content
        const reasoningMessages = [];

        for (const toolCall of toolCalls) {
          const args = (toolCall.args || {}) as Record<string, unknown>;

          switch (toolCall.toolName) {
            case 'sequentialThinking':
            case 'sequential-thinking':
              if (args.thought) {
                reasoningMessages.push({
                  id: toolCall.toolCallId,
                  type: 'text',
                  title: 'Thinking...',
                  status: 'completed',
                  message: args.thought,
                  message_chunk: null,
                  secondary_title: undefined,
                  finished_reasoning: !args.nextThoughtNeeded,
                });
              }
              break;

            case 'createMetrics':
            case 'create-metrics-file':
              if (args.files && Array.isArray(args.files)) {
                const files: Record<string, unknown> = {};
                const fileIds: string[] = [];

                for (const file of args.files) {
                  const fileId = crypto.randomUUID();
                  fileIds.push(fileId);
                  files[fileId] = {
                    id: fileId,
                    file_type: 'metric',
                    file_name: file.name || 'untitled_metric.yml',
                    version_number: 1,
                    status: 'loading',
                    file: {
                      text: file.yml_content || '',
                      text_chunk: undefined,
                      modified: undefined,
                    },
                  };
                }

                reasoningMessages.push({
                  id: toolCall.toolCallId,
                  type: 'files',
                  title: `Creating ${args.files.length} metric${args.files.length === 1 ? '' : 's'}`,
                  status: 'loading',
                  secondary_title: undefined,
                  file_ids: fileIds,
                  files,
                });
              }
              break;

            case 'executeSql':
            case 'execute-sql':
              if (args.queries && Array.isArray(args.queries)) {
                const queryText = args.queries.map((q: any) => q.sql || q).join('\n\n');
                reasoningMessages.push({
                  id: toolCall.toolCallId,
                  type: 'text',
                  title: 'Executing SQL',
                  status: 'loading',
                  message: queryText,
                  message_chunk: null,
                  secondary_title: undefined,
                  finished_reasoning: false,
                });
              } else if (args.sql) {
                reasoningMessages.push({
                  id: toolCall.toolCallId,
                  type: 'text',
                  title: 'Executing SQL',
                  status: 'loading',
                  message: args.sql,
                  message_chunk: null,
                  secondary_title: undefined,
                  finished_reasoning: false,
                });
              }
              break;

            case 'doneTool':
            case 'done-tool':
            case 'respondWithoutAnalysis':
            case 'respond-without-analysis':
              // These are response messages, not reasoning messages
              // They will be handled by extractResponseMessages
              break;

            case 'submitThoughts':
              if (args.thoughts) {
                reasoningMessages.push({
                  id: toolCall.toolCallId,
                  type: 'text',
                  title: 'Submitting Analysis',
                  status: 'completed',
                  message: args.thoughts,
                  message_chunk: null,
                  secondary_title: undefined,
                  finished_reasoning: false,
                });
              }
              break;

            default:
              // For other tools, try to extract meaningful content
              let messageContent: string;
              try {
                messageContent = JSON.stringify(args, null, 2);
              } catch (stringifyError) {
                console.error(
                  `Failed to stringify args for tool ${toolCall.toolName}:`,
                  stringifyError
                );
                messageContent = '[Unable to display tool arguments]';
              }

              reasoningMessages.push({
                id: toolCall.toolCallId,
                type: 'text',
                title: toolCall.toolName,
                status: 'loading',
                message: messageContent,
                message_chunk: null,
                secondary_title: getToolTiming(toolCall.toolName, toolCompletions),
                finished_reasoning: false,
              });
          }
        }

        // Return the reasoning messages if we have any
        if (reasoningMessages.length === 1) {
          return reasoningMessages[0];
        } else if (reasoningMessages.length > 0) {
          // For multiple tool calls in one message, return them as separate entries
          return reasoningMessages;
        } else if (toolCalls.length > 0) {
          // We had tool calls but no reasoning messages (e.g., doneTool, respondWithoutAnalysis)
          // Return null to skip this message
          return null;
        }
      }
    }

    // Check if this is a tool result message - update status to completed
    if (message.role === 'tool') {
      // We already created the reasoning message from the tool call
      // Skip tool results as we don't need them
      return null;
    }

    // Handle todo list messages
    if (
      message.role === 'user' &&
      typeof message.content === 'string' &&
      message.content.includes('<todo_list>')
    ) {
      // Extract todos
      const todoMatch = message.content.match(/<todo_list>([\s\S]*?)<\/todo_list>/);
      if (todoMatch) {
        const todoContent = todoMatch[1].trim();
        const fileId = crypto.randomUUID();

        return {
          id: crypto.randomUUID(),
          type: 'files',
          title: 'TODO List',
          status: 'completed',
          secondary_title: undefined, // TODO lists don't have associated tool timing
          file_ids: [fileId],
          files: {
            [fileId]: {
              id: fileId,
              file_type: 'metric', // Using metric type for now
              file_name: 'todo_list.txt',
              version_number: 1,
              status: 'completed',
              file: {
                text: todoContent,
                text_chunk: undefined,
                modified: undefined,
              },
            },
          },
        };
      }
    }

    // Extract the content based on message type (non-tool messages)
    let messageContent = '';

    if (typeof message.content === 'string') {
      messageContent = message.content;
    } else if (Array.isArray(message.content)) {
      // Handle multi-part content (e.g., text + images)
      messageContent = message.content
        .map((part) => {
          if (part.type === 'text') {
            return part.text;
          }
          return `[${part.type}]`;
        })
        .join(' ');
    }

    // Skip user messages entirely (except todo lists which are handled above)
    if (message.role === 'user') {
      return null;
    }

    // Skip non-tool assistant messages (e.g., plain text responses)
    if (message.role === 'assistant') {
      return null;
    }

    // Skip any other message types that aren't tool-related
    return null;
  } catch (error) {
    console.error('Error in formatMessageAsReasoningEntry:', error);
    return null;
  }
}

/**
 * Convert an array of CoreMessages to reasoning format
 * Each message becomes its own reasoning entry
 *
 * @param messages - Array of CoreMessage objects from the LLM conversation
 * @returns Array of reasoning entries, one for each message
 */
export function formatLlmMessagesAsReasoning(messages: CoreMessage[]): unknown[] {
  if (!Array.isArray(messages)) {
    console.error(
      'formatLlmMessagesAsReasoning: Expected array of messages, got:',
      typeof messages
    );
    return [];
  }

  const reasoningEntries: unknown[] = [];

  for (const message of messages) {
    try {
      const formatted = formatMessageAsReasoningEntry(message);
      if (formatted) {
        if (Array.isArray(formatted)) {
          reasoningEntries.push(...formatted);
        } else {
          reasoningEntries.push(formatted);
        }
      }
    } catch (error) {
      console.error('Error formatting message:', error, message);
      // Continue processing other messages
    }
  }

  return reasoningEntries;
}

/**
 * Get the current reasoning array and append new reasoning entries
 * This ensures reasoning builds on itself like conversation history
 *
 * @param currentReasoning - Existing reasoning array (if any)
 * @param newMessages - New CoreMessages to append as reasoning
 * @returns Combined reasoning array
 */
export function appendToReasoning(
  currentReasoning: unknown[] | null | undefined,
  newMessages: CoreMessage[]
): unknown[] {
  const existing = currentReasoning || [];
  const newReasoningEntries = formatLlmMessagesAsReasoning(newMessages);
  return [...existing, ...newReasoningEntries];
}

/**
 * Extract response messages from CoreMessages
 * Specifically looks for doneTool and respondWithoutAnalysis tool calls
 */
export function extractResponseMessages(messages: CoreMessage[]): unknown[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const responseMessages: unknown[] = [];

  for (const message of messages) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      const toolCalls = message.content.filter(
        (part): part is ToolCallPart => part.type === 'tool-call'
      );

      for (const toolCall of toolCalls) {
        const args = (toolCall.args || {}) as Record<string, any>;

        if (toolCall.toolName === 'doneTool' || toolCall.toolName === 'done-tool') {
          responseMessages.push({
            id: toolCall.toolCallId,
            type: 'text',
            message: args.final_response || '',
            is_final_message: true,
          });
        } else if (
          toolCall.toolName === 'respondWithoutAnalysis' ||
          toolCall.toolName === 'respond-without-analysis'
        ) {
          responseMessages.push({
            id: toolCall.toolCallId,
            type: 'text',
            message: args.response || '',
            is_final_message: true,
          });
        }
      }
    }
  }

  return responseMessages;
}
