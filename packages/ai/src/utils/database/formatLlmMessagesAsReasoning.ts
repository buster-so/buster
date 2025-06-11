import type { CoreMessage, ToolCallPart } from 'ai';

/**
 * Format a single CoreMessage as a reasoning entry
 */
function formatMessageAsReasoningEntry(message: CoreMessage): any {
  if (!message) {
    console.error('formatMessageAsReasoningEntry: Received null/undefined message');
    return null;
  }
  
  try {
  // Check if this is an assistant message with tool calls
  if (message.role === 'assistant' && Array.isArray(message.content)) {
    const toolCalls = message.content.filter((part): part is ToolCallPart => part.type === 'tool-call');
    
    if (toolCalls.length > 0) {
      // Process each tool call and extract its content
      const reasoningMessages = [];
      
      for (const toolCall of toolCalls) {
        const args = (toolCall.args || {}) as Record<string, any>;
        
        switch (toolCall.toolName) {
          case 'sequentialThinking':
          case 'sequential-thinking':
            if (args.thought) {
              reasoningMessages.push({
                id: toolCall.toolCallId,
                type: 'text',
                title: `Thought ${args.thoughtNumber || '?'} of ${args.totalThoughts || '?'}`,
                status: 'completed',
                message: args.thought,
                message_chunk: null,
                secondary_title: 'TODO',
                finished_reasoning: !args.nextThoughtNeeded,
              });
            }
            break;

          case 'createMetrics':
          case 'create-metrics-file':
            if (args.files && Array.isArray(args.files)) {
              const files: Record<string, any> = {};
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
                secondary_title: 'TODO',
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
                secondary_title: 'TODO',
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
                secondary_title: 'TODO',
                finished_reasoning: false,
              });
            }
            break;

          case 'doneTool':
          case 'done-tool':
            reasoningMessages.push({
              id: toolCall.toolCallId,
              type: 'text',
              title: 'Completed',
              status: 'completed',
              message: args.message || 'Analysis complete',
              message_chunk: null,
              secondary_title: 'TODO',
              finished_reasoning: true,
            });
            break;

          case 'respondWithoutAnalysis':
          case 'respond-without-analysis':
            reasoningMessages.push({
              id: toolCall.toolCallId,
              type: 'text',
              title: 'Response',
              status: 'completed',
              message: args.message || '',
              message_chunk: null,
              secondary_title: 'TODO',
              finished_reasoning: false,
            });
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
                secondary_title: 'TODO',
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
              console.error(`Failed to stringify args for tool ${toolCall.toolName}:`, stringifyError);
              messageContent = '[Unable to display tool arguments]';
            }
            
            reasoningMessages.push({
              id: toolCall.toolCallId,
              type: 'text',
              title: toolCall.toolName,
              status: 'loading',
              message: messageContent,
              message_chunk: null,
              secondary_title: 'TODO',
              finished_reasoning: false,
            });
        }
      }
      
      // Return the first message if only one, or create a container
      if (reasoningMessages.length === 1) {
        return reasoningMessages[0];
      } else if (reasoningMessages.length > 0) {
        // For multiple tool calls in one message, return them as separate entries
        // This is handled by the caller
        return reasoningMessages;
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
  if (message.role === 'user' && typeof message.content === 'string' && message.content.includes('<todo_list>')) {
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
        secondary_title: 'TODO',
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

  // Default formatting for regular messages
  return {
    id: crypto.randomUUID(),
    type: 'text',
    title: message.role === 'user' ? 'User' : 'Assistant',
    status: 'completed',
    message: messageContent,
    message_chunk: null,
    secondary_title: 'TODO',
    finished_reasoning: false,
  };
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
export function formatLlmMessagesAsReasoning(messages: CoreMessage[]): any[] {
  if (!Array.isArray(messages)) {
    console.error('formatLlmMessagesAsReasoning: Expected array of messages, got:', typeof messages);
    return [];
  }
  
  const reasoningEntries: any[] = [];
  
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
  currentReasoning: any[] | null | undefined,
  newMessages: CoreMessage[]
): any[] {
  const existing = currentReasoning || [];
  const newReasoningEntries = formatLlmMessagesAsReasoning(newMessages);
  return [...existing, ...newReasoningEntries];
}