import type { ModelMessage } from '@buster/ai';
import type { CliAgentMessage } from '../services/analytics-engineer-handler';
import type { AgentMessage } from '../types/agent-messages';

/**
 * Tool name constants - single source of truth for tool name strings
 */
const TOOL_NAMES = {
  READ_FILE: 'readFileTool',
  WRITE_FILE: 'writeFileTool',
  EDIT_FILE: 'editFileTool',
  MULTI_EDIT_FILE: 'multiEditFileTool',
  BASH: 'bashTool',
  GREP: 'grepTool',
  LS: 'lsTool',
  TASK: 'taskTool',
  IDLE: 'idleTool',
} as const;

/**
 * Type guards for tool arguments and results
 */

// Read file tool types
interface ReadFileArgs {
  filePath: string;
}

interface ReadFileResult {
  status: 'success' | 'error';
  file_path: string;
  content?: string;
  truncated?: boolean;
  error_message?: string;
}

function isReadFileArgs(args: unknown): args is ReadFileArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'filePath' in args &&
    typeof (args as ReadFileArgs).filePath === 'string'
  );
}

function isReadFileResult(result: unknown): result is ReadFileResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'status' in result &&
    'file_path' in result &&
    ((result as ReadFileResult).status === 'success' ||
      (result as ReadFileResult).status === 'error')
  );
}

// Write file tool types
interface WriteFileArgs {
  files: Array<{ path: string; content: string }>;
}

interface WriteFileResult {
  results: Array<{ status: 'success' | 'error'; filePath: string; errorMessage?: string }>;
}

function isWriteFileArgs(args: unknown): args is WriteFileArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'files' in args &&
    Array.isArray((args as WriteFileArgs).files)
  );
}

function isWriteFileResult(result: unknown): result is WriteFileResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'results' in result &&
    Array.isArray((result as WriteFileResult).results)
  );
}

// Edit file tool types
interface EditFileArgs {
  filePath: string;
  oldString?: string;
  newString?: string;
  edits?: Array<{ oldString: string; newString: string }>;
}

interface EditFileResult {
  success: boolean;
  filePath: string;
  diff?: string;
  finalDiff?: string;
  message?: string;
  errorMessage?: string;
}

function isEditFileArgs(args: unknown): args is EditFileArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'filePath' in args &&
    typeof (args as EditFileArgs).filePath === 'string'
  );
}

function isEditFileResult(result: unknown): result is EditFileResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    'filePath' in result &&
    typeof (result as EditFileResult).success === 'boolean'
  );
}

// Bash tool types
interface BashArgs {
  command: string;
  description?: string;
}

interface BashResult {
  stdout?: string;
  stderr?: string;
  exitCode: number;
  success: boolean;
}

function isBashArgs(args: unknown): args is BashArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'command' in args &&
    typeof (args as BashArgs).command === 'string'
  );
}

function isBashResult(result: unknown): result is BashResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'exitCode' in result &&
    'success' in result &&
    typeof (result as BashResult).exitCode === 'number' &&
    typeof (result as BashResult).success === 'boolean'
  );
}

// Grep tool types
interface GrepArgs {
  pattern: string;
  glob?: string;
  command: string;
}

interface GrepResult {
  matches: Array<{ path: string; lineNum: number; lineText: string }>;
  totalMatches: number;
  truncated: boolean;
}

function isGrepArgs(args: unknown): args is GrepArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'pattern' in args &&
    'command' in args &&
    typeof (args as GrepArgs).pattern === 'string' &&
    typeof (args as GrepArgs).command === 'string'
  );
}

function isGrepResult(result: unknown): result is GrepResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'matches' in result &&
    'totalMatches' in result &&
    'truncated' in result &&
    Array.isArray((result as GrepResult).matches)
  );
}

// Ls tool types
interface LsArgs {
  path?: string;
  command: string;
  depth?: number;
}

interface LsResult {
  output: string;
  success: boolean;
  count: number;
  truncated: boolean;
  errorMessage?: string;
}

function isLsArgs(args: unknown): args is LsArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'command' in args &&
    typeof (args as LsArgs).command === 'string'
  );
}

function isLsResult(result: unknown): result is LsResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'output' in result &&
    'success' in result &&
    'count' in result &&
    'truncated' in result
  );
}

// Task tool types
interface TaskArgs {
  instructions: string;
}

interface TaskResult {
  status: 'success' | 'error';
  summary?: string;
  messages?: AgentMessage[];
  error_message?: string;
}

function isTaskArgs(args: unknown): args is TaskArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'instructions' in args &&
    typeof (args as TaskArgs).instructions === 'string'
  );
}

function isTaskResult(result: unknown): result is TaskResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'status' in result &&
    ((result as TaskResult).status === 'success' || (result as TaskResult).status === 'error')
  );
}

// Idle tool types
interface IdleArgs {
  final_response?: string;
}

function isIdleArgs(args: unknown): args is IdleArgs {
  return typeof args === 'object' && args !== null;
}

/**
 * Tool invocation type from ModelMessage
 */
interface ToolInvocation {
  state: 'call' | 'result';
  toolCallId: string;
  toolName: string;
  args: unknown;
  result?: unknown;
}

/**
 * Type guard for tool invocations
 */
function isToolInvocation(inv: unknown): inv is ToolInvocation {
  return (
    typeof inv === 'object' &&
    inv !== null &&
    'state' in inv &&
    'toolCallId' in inv &&
    'toolName' in inv &&
    'args' in inv &&
    ((inv as ToolInvocation).state === 'call' || (inv as ToolInvocation).state === 'result')
  );
}

/**
 * Transform a single tool invocation to an AgentMessage
 * Only returns messages for completed tool invocations (state === 'result')
 */
function transformToolInvocation(invocation: ToolInvocation): AgentMessage | null {
  // Only show completed tool invocations
  if (invocation.state !== 'result') {
    return null;
  }

  const toolName = invocation.toolName;
  const args = invocation.args;
  const result = invocation.result;

  switch (toolName) {
    case TOOL_NAMES.READ_FILE:
      if (!isReadFileArgs(args)) {
        console.warn('Invalid read file args:', args);
        return null;
      }
      if (!isReadFileResult(result)) {
        console.warn('Invalid read file result:', result);
        return null;
      }
      return {
        kind: 'read',
        event: 'complete',
        args,
        result,
      };

    case TOOL_NAMES.WRITE_FILE:
      if (!isWriteFileArgs(args)) {
        console.warn('Invalid write file args:', args);
        return null;
      }
      if (!isWriteFileResult(result)) {
        console.warn('Invalid write file result:', result);
        return null;
      }
      return {
        kind: 'write',
        event: 'complete',
        args,
        result,
      };

    case TOOL_NAMES.EDIT_FILE:
    case TOOL_NAMES.MULTI_EDIT_FILE:
      if (!isEditFileArgs(args)) {
        console.warn('Invalid edit file args:', args);
        return null;
      }
      if (!isEditFileResult(result)) {
        console.warn('Invalid edit file result:', result);
        return null;
      }
      return {
        kind: 'edit',
        event: 'complete',
        args,
        result,
      };

    case TOOL_NAMES.BASH:
      if (!isBashArgs(args)) {
        console.warn('Invalid bash args:', args);
        return null;
      }
      if (!isBashResult(result)) {
        console.warn('Invalid bash result:', result);
        return null;
      }
      return {
        kind: 'bash',
        event: 'complete',
        args,
        result,
      };

    case TOOL_NAMES.GREP:
      if (!isGrepArgs(args)) {
        console.warn('Invalid grep args:', args);
        return null;
      }
      if (!isGrepResult(result)) {
        console.warn('Invalid grep result:', result);
        return null;
      }
      return {
        kind: 'grep',
        event: 'complete',
        args,
        result,
      };

    case TOOL_NAMES.LS:
      if (!isLsArgs(args)) {
        console.warn('Invalid ls args:', args);
        return null;
      }
      if (!isLsResult(result)) {
        console.warn('Invalid ls result:', result);
        return null;
      }
      return {
        kind: 'ls',
        event: 'complete',
        args,
        result,
      };

    case TOOL_NAMES.TASK: {
      if (!isTaskArgs(args)) {
        console.warn('Invalid task args:', args);
        return null;
      }
      if (!isTaskResult(result)) {
        console.warn('Invalid task result:', result);
        return null;
      }
      const nestedMessages = result.messages?.filter(
        (message): message is Exclude<AgentMessage, { kind: 'user' } | { kind: 'text-delta' }> =>
          message.kind !== 'user' && message.kind !== 'text-delta'
      );

      // Destructure to separate messages from other properties
      const { messages: _, ...resultWithoutMessages } = result;

      return {
        kind: 'task',
        event: 'complete',
        args,
        result: nestedMessages
          ? {
              ...resultWithoutMessages,
              messages: nestedMessages,
            }
          : resultWithoutMessages,
      };
    }

    case TOOL_NAMES.IDLE:
      if (!isIdleArgs(args)) {
        console.warn('Invalid idle args:', args);
        return null;
      }
      return {
        kind: 'idle',
        args,
      };

    default:
      // Unknown tool - skip silently
      return null;
  }
}

/**
 * Transforms AI SDK ModelMessage array to CLI display format
 * Extracts user messages, tool calls, and tool results for display
 *
 * This is the main export - converts ModelMessage[] (source of truth) to CliAgentMessage[] for UI
 */
export function transformModelMessagesToUI(modelMessages: ModelMessage[]): CliAgentMessage[] {
  const uiMessages: CliAgentMessage[] = [];
  let messageId = 0;

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

      // User messages - simple conversion
      if (msg.role === 'user') {
        uiMessages.push({
          id: ++messageId,
          message: {
            kind: 'user',
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          },
        });
        continue;
      }

      // Assistant messages - extract tool invocations
      if (msg.role === 'assistant') {
        // Handle tool invocations if present
        if ('toolInvocations' in msg && Array.isArray(msg.toolInvocations)) {
          for (const invocation of msg.toolInvocations) {
            if (!isToolInvocation(invocation)) {
              console.warn('Invalid tool invocation:', invocation);
              continue;
            }

            const agentMessage = transformToolInvocation(invocation);
            if (agentMessage) {
              uiMessages.push({
                id: ++messageId,
                message: agentMessage,
              });
            }
          }
        }
      }

      // Skip system messages and other message types
    }
  } catch (error) {
    console.error('Error transforming messages:', error);
    console.error('Messages:', JSON.stringify(modelMessages, null, 2));
    throw error;
  }

  return uiMessages;
}
