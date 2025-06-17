import type { CoreMessage, ToolCallPart } from 'ai';
import { z } from 'zod';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../../../server/src/types/chat-types/chat-message.type';

// Zod schemas for reasoning entry types
const ReasoningTextEntrySchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  title: z.string(),
  status: z.enum(['loading', 'completed', 'failed']),
  message: z.string().optional(),
  message_chunk: z.string().optional().nullable(),
  secondary_title: z.string().optional(),
  finished_reasoning: z.boolean().optional(),
});

const ReasoningFileTypeSchema = z.enum(['metric', 'dashboard', 'reasoning', 'agent-action']);

const ReasoningFileSchema = z.object({
  id: z.string(),
  file_type: ReasoningFileTypeSchema,
  file_name: z.string(),
  version_number: z.number(),
  status: z.enum(['loading', 'completed', 'failed']),
  file: z.object({
    text: z.string().optional(),
    text_chunk: z.string().optional(),
    modified: z.array(z.tuple([z.number(), z.number()])).optional(),
  }),
});

const ReasoningFilesEntrySchema = z.object({
  id: z.string(),
  type: z.literal('files'),
  title: z.string(),
  status: z.enum(['loading', 'completed', 'failed']),
  secondary_title: z.string().optional(),
  file_ids: z.array(z.string()),
  files: z.record(z.string(), ReasoningFileSchema),
});

const ReasoningEntrySchema = z.union([ReasoningTextEntrySchema, ReasoningFilesEntrySchema]);

type ReasoningEntry = z.infer<typeof ReasoningEntrySchema>;
type ReasoningTextEntry = z.infer<typeof ReasoningTextEntrySchema>;
type ReasoningFilesEntry = z.infer<typeof ReasoningFilesEntrySchema>;
type ReasoningFile = z.infer<typeof ReasoningFileSchema>;

// Response message schemas
const ResponseTextMessageSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  message: z.string(),
  is_final_message: z.boolean().optional(),
});

type ResponseTextMessage = z.infer<typeof ResponseTextMessageSchema>;

/**
 * Format a single CoreMessage as a reasoning entry
 */
function formatMessageAsReasoningEntry(
  message: CoreMessage
): ReasoningEntry | ReasoningEntry[] | null {
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
        const reasoningMessages: ReasoningEntry[] = [];

        for (const toolCall of toolCalls) {
          const args = (toolCall.args || {}) as Record<string, unknown>;

          switch (toolCall.toolName) {
            case 'sequentialThinking':
            case 'sequential-thinking':
              if (args.thought) {
                const textEntry: ReasoningTextEntry = {
                  id: toolCall.toolCallId,
                  type: 'text',
                  title: 'Thinking...',
                  status: 'completed',
                  message: args.thought as string,
                  message_chunk: null,
                  secondary_title: undefined,
                  finished_reasoning: !args.nextThoughtNeeded,
                };
                reasoningMessages.push(textEntry);
              }
              break;

            case 'createMetrics':
            case 'create-metrics-file':
              if (args.files && Array.isArray(args.files)) {
                const files: Record<string, ReasoningFile> = {};
                const fileIds: string[] = [];

                for (const file of args.files) {
                  const fileId = crypto.randomUUID();
                  fileIds.push(fileId);
                  const reasoningFile: ReasoningFile = {
                    id: fileId,
                    file_type: 'metric',
                    file_name: (file as { name?: string }).name || 'untitled_metric.yml',
                    version_number: 1,
                    status: 'loading',
                    file: {
                      text: (file as { yml_content?: string }).yml_content || '',
                      text_chunk: undefined,
                      modified: undefined,
                    },
                  };
                  files[fileId] = reasoningFile;
                }

                const filesEntry: ReasoningFilesEntry = {
                  id: toolCall.toolCallId,
                  type: 'files',
                  title: `Creating ${args.files.length} metric${args.files.length === 1 ? '' : 's'}`,
                  status: 'loading',
                  secondary_title: undefined,
                  file_ids: fileIds,
                  files,
                };
                reasoningMessages.push(filesEntry);
              }
              break;

            case 'executeSql':
            case 'execute-sql':
              if (args.queries && Array.isArray(args.queries)) {
                const queryText = args.queries
                  .map((q: unknown) => {
                    if (typeof q === 'string') return q;
                    if (typeof q === 'object' && q !== null && 'sql' in q) {
                      return (q as { sql: unknown }).sql as string;
                    }
                    return String(q);
                  })
                  .join('\n\n');
                const textEntry: ReasoningTextEntry = {
                  id: toolCall.toolCallId,
                  type: 'text',
                  title: 'Executing SQL',
                  status: 'loading',
                  message: queryText,
                  message_chunk: null,
                  secondary_title: undefined,
                  finished_reasoning: false,
                };
                reasoningMessages.push(textEntry);
              } else if (args.sql && typeof args.sql === 'string') {
                const textEntry: ReasoningTextEntry = {
                  id: toolCall.toolCallId,
                  type: 'text',
                  title: 'Executing SQL',
                  status: 'loading',
                  message: args.sql,
                  message_chunk: null,
                  secondary_title: undefined,
                  finished_reasoning: false,
                };
                reasoningMessages.push(textEntry);
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
              if (args.thoughts && typeof args.thoughts === 'string') {
                const textEntry: ReasoningTextEntry = {
                  id: toolCall.toolCallId,
                  type: 'text',
                  title: 'Submitting Analysis',
                  status: 'completed',
                  message: args.thoughts,
                  message_chunk: null,
                  secondary_title: undefined,
                  finished_reasoning: false,
                };
                reasoningMessages.push(textEntry);
              }
              break;

            default: {
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

              const textEntry: ReasoningTextEntry = {
                id: toolCall.toolCallId,
                type: 'text',
                title: toolCall.toolName,
                status: 'loading',
                message: messageContent,
                message_chunk: null,
                secondary_title: undefined,
                finished_reasoning: false,
              };
              reasoningMessages.push(textEntry);
            }
          }
        }

        // Return the reasoning messages if we have any
        if (reasoningMessages.length === 1) {
          const firstMessage = reasoningMessages[0];
          if (firstMessage) return firstMessage;
        }
        if (reasoningMessages.length > 0) {
          // For multiple tool calls in one message, return them as separate entries
          return reasoningMessages;
        }
        if (toolCalls.length > 0) {
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
        const todoContent = todoMatch[1]?.trim() || '';
        const fileId = crypto.randomUUID();
        const todoFile: ReasoningFile = {
          id: fileId,
          file_type: 'agent-action', // Using metric type for now
          file_name: 'todo_list',
          version_number: 1,
          status: 'completed',
          file: {
            text: todoContent,
            text_chunk: undefined,
            modified: undefined,
          },
        };

        const filesEntry: ReasoningFilesEntry = {
          id: crypto.randomUUID(),
          type: 'files',
          title: 'TODOs',
          status: 'completed',
          secondary_title: undefined, // TODO lists don't have associated tool timing
          file_ids: [fileId],
          files: {
            [fileId]: todoFile,
          },
        };
        return filesEntry;
      }
    }

    // Extract the content based on message type (non-tool messages)
    // Note: This content is extracted but not used since we skip non-tool messages
    // Keeping for potential future use or debugging
    let _messageContent = '';

    if (typeof message.content === 'string') {
      _messageContent = message.content;
    } else if (Array.isArray(message.content)) {
      // Handle multi-part content (e.g., text + images)
      _messageContent = message.content
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
export function formatLlmMessagesAsReasoning(
  messages: CoreMessage[]
): ChatMessageReasoningMessage[] {
  if (!Array.isArray(messages)) {
    console.error(
      'formatLlmMessagesAsReasoning: Expected array of messages, got:',
      typeof messages
    );
    return [];
  }

  const reasoningEntries: ChatMessageReasoningMessage[] = [];

  for (const message of messages) {
    try {
      const formatted = formatMessageAsReasoningEntry(message);
      if (formatted) {
        if (Array.isArray(formatted)) {
          // Validate each entry in the array
          for (const entry of formatted) {
            try {
              const validated = ReasoningEntrySchema.parse(entry);
              reasoningEntries.push(validated as ChatMessageReasoningMessage);
            } catch (error) {
              console.error('Invalid reasoning entry:', error, entry);
            }
          }
        } else {
          try {
            const validated = ReasoningEntrySchema.parse(formatted);
            reasoningEntries.push(validated as ChatMessageReasoningMessage);
          } catch (error) {
            console.error('Invalid reasoning entry:', error, formatted);
          }
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
  currentReasoning: ChatMessageReasoningMessage[] | null | undefined,
  newMessages: CoreMessage[]
): ChatMessageReasoningMessage[] {
  const existing: ChatMessageReasoningMessage[] = currentReasoning || [];
  const newReasoningEntries = formatLlmMessagesAsReasoning(newMessages);
  return [...existing, ...newReasoningEntries];
}

/**
 * Extract response messages from CoreMessages
 * Specifically looks for doneTool and respondWithoutAnalysis tool calls
 */
export function extractResponseMessages(messages: CoreMessage[]): ChatMessageResponseMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const responseMessages: ChatMessageResponseMessage[] = [];

  for (const message of messages) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      const toolCalls = message.content.filter(
        (part): part is ToolCallPart => part.type === 'tool-call'
      );

      for (const toolCall of toolCalls) {
        const args = (toolCall.args || {}) as Record<string, unknown>;

        if (toolCall.toolName === 'doneTool' || toolCall.toolName === 'done-tool') {
          const responseMessage: ResponseTextMessage = {
            id: toolCall.toolCallId,
            type: 'text',
            message: (args.final_response as string) || '',
            is_final_message: true,
          };
          try {
            const validated = ResponseTextMessageSchema.parse(responseMessage);
            responseMessages.push(validated as ChatMessageResponseMessage);
          } catch (error) {
            console.error('Invalid response message:', error, responseMessage);
          }
        } else if (
          toolCall.toolName === 'respondWithoutAnalysis' ||
          toolCall.toolName === 'respond-without-analysis'
        ) {
          const responseMessage: ResponseTextMessage = {
            id: toolCall.toolCallId,
            type: 'text',
            message: (args.response as string) || '',
            is_final_message: true,
          };
          try {
            const validated = ResponseTextMessageSchema.parse(responseMessage);
            responseMessages.push(validated as ChatMessageResponseMessage);
          } catch (error) {
            console.error('Invalid response message:', error, responseMessage);
          }
        }
      }
    }
  }

  return responseMessages;
}
