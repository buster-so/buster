import {
  BASH_TOOL_NAME,
  type BashToolInput,
  EDIT_FILE_TOOL_NAME,
  type EditFileToolInput,
  GREP_TOOL_NAME,
  type GrepToolInput,
  IDLE_TOOL_NAME,
  type IdleInput,
  LS_TOOL_NAME,
  type LsToolInput,
  type ModelMessage,
  READ_FILE_TOOL_NAME,
  type ReadFileToolInput,
  TASK_TOOL_NAME,
  WRITE_FILE_TOOL_NAME,
  type WriteFileToolInput,
} from '@buster/ai';
import type { CliAgentMessage } from '../services';
import type { AgentMessage } from '../types/agent-messages';
import type { MessageContent } from './content-schemas';

// All the old type guards and functions have been removed
// The new implementation uses AI SDK v5 content arrays directly

/**
 * Transforms AI SDK v5 ModelMessage array to CLI display format
 * Handles content arrays with tool-call, tool-result, text, and reasoning objects
 *
 * This is the main export - converts ModelMessage[] (source of truth) to CliAgentMessage[] for UI
 */
export function transformModelMessagesToUI(modelMessages: ModelMessage[]): CliAgentMessage[] {
  const uiMessages: CliAgentMessage[] = [];
  let messageId = 0;

  // Track tool calls for matching with results
  const toolCallMap = new Map<string, { toolName: string; input: unknown; messageIndex: number }>();

  // Guard against invalid input
  if (!modelMessages || !Array.isArray(modelMessages)) {
    console.error('transformModelMessagesToUI received invalid input:', modelMessages);
    return [];
  }

  try {
    for (const msg of modelMessages) {
      // Skip invalid messages
      if (!msg || !msg.role) {
        console.warn('Skipping message without role:', msg);
        continue;
      }

      // User messages - handle string or content array
      if (msg.role === 'user') {
        let content: string;
        if (typeof msg.content === 'string') {
          content = msg.content;
        } else if (Array.isArray(msg.content)) {
          // Extract text from content array - cast to unknown first to handle AI SDK types
          const textContent = (msg.content as unknown as MessageContent[]).find(
            (c) => c.type === 'text'
          ) as { type: 'text'; text: string } | undefined;
          content = textContent?.text || '';
        } else {
          content = JSON.stringify(msg.content);
        }

        uiMessages.push({
          id: ++messageId,
          message: {
            kind: 'user',
            content,
          },
        });
        continue;
      }

      // Assistant messages - process content array
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        // Collect text content for concatenation
        let textContent = '';

        for (const content of msg.content as MessageContent[]) {
          if (content.type === 'text') {
            // Accumulate text content
            textContent += content.text;
          } else if (content.type === 'tool-call') {
            // Create 'start' event message for tool call
            const agentMessage = createToolStartMessage(content.toolName, content.input);
            if (agentMessage) {
              const msgIndex = uiMessages.length;
              uiMessages.push({
                id: ++messageId,
                message: agentMessage,
              });

              // Store for later matching with result
              toolCallMap.set(content.toolCallId, {
                toolName: content.toolName,
                input: content.input,
                messageIndex: msgIndex,
              });
            }
          }
          // Skip reasoning content (internal to model)
        }

        // Add accumulated text content if any
        if (textContent.trim()) {
          uiMessages.push({
            id: ++messageId,
            message: {
              kind: 'text-delta',
              content: textContent,
            },
          });
        }
      }

      // Tool result messages - match with tool calls
      if (msg.role === 'tool' && Array.isArray(msg.content)) {
        for (const content of msg.content as MessageContent[]) {
          if (content.type === 'tool-result') {
            const toolCall = toolCallMap.get(content.toolCallId);
            if (!toolCall) {
              console.warn('Tool result without matching call:', content.toolCallId);
              continue;
            }

            // Parse output
            let output: unknown;
            try {
              output = JSON.parse(content.output.value);
            } catch {
              output = content.output.value;
            }

            // Update the corresponding 'start' message to 'complete'
            const startMessage = uiMessages[toolCall.messageIndex];
            if (startMessage) {
              startMessage.message = {
                ...startMessage.message,
                event: 'complete',
                result: output,
              } as AgentMessage;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error transforming messages:', error);
    console.error('Messages:', JSON.stringify(modelMessages, null, 2));
    throw error;
  }

  return uiMessages;
}

/**
 * Creates a 'start' event message for a tool call
 * Maps tool names to their corresponding AgentMessage kinds with proper types
 */
function createToolStartMessage(toolName: string, input: unknown): AgentMessage | null {
  // Map known tool names to message kinds with proper input types
  switch (toolName) {
    case READ_FILE_TOOL_NAME:
      return {
        kind: 'read',
        event: 'start',
        args: input as ReadFileToolInput,
      };

    case WRITE_FILE_TOOL_NAME:
      return {
        kind: 'write',
        event: 'start',
        args: input as WriteFileToolInput,
      };

    case EDIT_FILE_TOOL_NAME:
      return {
        kind: 'edit',
        event: 'start',
        args: input as EditFileToolInput,
      };

    case BASH_TOOL_NAME:
      return {
        kind: 'bash',
        event: 'start',
        args: input as BashToolInput,
      };

    case GREP_TOOL_NAME: {
      const grepInput = input as GrepToolInput;
      // Generate command string for display
      let command = `grep ${grepInput.pattern}`;
      if (grepInput.path) command += ` ${grepInput.path}`;
      if (grepInput.glob) command += ` --glob ${grepInput.glob}`;
      // Only include defined optional properties to match AgentMessage type
      return {
        kind: 'grep',
        event: 'start',
        args: {
          pattern: grepInput.pattern,
          ...(grepInput.glob !== undefined && { glob: grepInput.glob }),
          command,
        },
      };
    }

    case LS_TOOL_NAME: {
      const lsInput = input as LsToolInput;
      // Generate command string for display
      const command = `ls ${lsInput.path || '.'}`;
      // Only include defined optional properties to match AgentMessage type
      return {
        kind: 'ls',
        event: 'start',
        args: {
          ...(lsInput.path !== undefined && { path: lsInput.path }),
          command,
        },
      };
    }

    case TASK_TOOL_NAME:
      return {
        kind: 'task',
        event: 'start',
        // Task tool input structure based on the actual tool
        args: input as { instructions: string; description?: string },
      };

    case IDLE_TOOL_NAME:
      return {
        kind: 'idle',
        args: input as IdleInput,
      };

    default:
      // Unknown tool - skip silently
      console.warn('Unknown tool name:', toolName);
      return null;
  }
}
