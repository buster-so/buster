import {
  type CoreMessage,
  type InvalidToolArgumentsError,
  NoSuchToolError,
  type ToolSet,
} from 'ai';
import { ZodError } from 'zod';

/**
 * Union type of all streaming errors that can be healed
 */
export type HealableStreamError = NoSuchToolError | InvalidToolArgumentsError;

/**
 * Result of attempting to heal a tool error
 */
export interface HealingResult {
  healed: boolean;
  healingMessage: CoreMessage;
  healedArgs?: Record<string, unknown>;
}

/**
 * Available visualization tools that need special JSON escape handling
 */
const VISUALIZATION_TOOLS = [
  'create-metrics-file',
  'modify-metrics-file',
  'create-dashboards-file',
  'modify-dashboards-file',
] as const;

/**
 * Checks if a tool is a visualization tool that needs JSON escape healing
 */
function isVisualizationTool(toolName: string): boolean {
  return VISUALIZATION_TOOLS.includes(toolName as (typeof VISUALIZATION_TOOLS)[number]);
}

/**
 * Attempts to heal double-escaped JSON in files parameter for visualization tools
 */
function healVisualizationToolArgs(
  toolName: string,
  toolCallId: string,
  rawArgs: string,
  zodError: ZodError
): HealingResult {
  try {
    const args = JSON.parse(rawArgs);

    // Check if files parameter is string-escaped JSON
    if (typeof args.files === 'string') {
      try {
        // Attempt to parse the escaped JSON string
        const parsedFiles = JSON.parse(args.files);

        // Success! We can heal this
        return {
          healed: true,
          healedArgs: { ...args, files: parsedFiles },
          healingMessage: {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId,
                toolName,
                result: {
                  success: true,
                  message:
                    'Arguments auto-corrected: files parameter was un-escaped from JSON string to proper array format.',
                },
              },
            ],
          },
        };
      } catch (_parseError) {
        // JSON parsing failed, provide specific guidance
        return {
          healed: false,
          healingMessage: {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId,
                toolName,
                result: {
                  error: `The 'files' parameter should be an array, not a JSON string. Please provide it as: files: [{...}] not files: "[{...}]"`,
                },
              },
            ],
          },
        };
      }
    }
  } catch (_argParseError) {
    // Fall through to generic error handling
  }

  // Return generic Zod error message for this tool
  return {
    healed: false,
    healingMessage: {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId,
          toolName,
          result: {
            error: `Invalid arguments for ${toolName}: ${zodError.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          },
        },
      ],
    },
  };
}

/**
 * Handles NoSuchToolError by providing list of available tools
 */
function healNoSuchToolError<T extends ToolSet>(
  toolName: string,
  toolCallId: string,
  availableTools: T
): HealingResult {
  const availableToolNames = Object.keys(availableTools);

  return {
    healed: false,
    healingMessage: {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId,
          toolName,
          result: {
            error: `Tool "${toolName}" is not available. Available tools: ${availableToolNames.join(', ')}. Please use one of the available tools instead.`,
          },
        },
      ],
    },
  };
}

/**
 * Handles generic InvalidToolArgumentsError for non-visualization tools
 */
function healGenericToolArgumentsError(
  toolName: string,
  toolCallId: string,
  zodError: ZodError
): HealingResult {
  return {
    healed: false,
    healingMessage: {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId,
          toolName,
          result: {
            error: `Invalid arguments for ${toolName}: ${zodError.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          },
        },
      ],
    },
  };
}

/**
 * Handles generic streaming errors (network, server, etc.)
 */
function healGenericStreamingError(error: Error): HealingResult {
  let healingMessage: string;

  if (error.message.includes('rate_limit_error') || error.message.includes('429')) {
    healingMessage = 'Rate limit reached, please wait and try again.';
  } else if (
    error.message.includes('500') ||
    error.message.includes('502') ||
    error.message.includes('503') ||
    error.message.includes('504')
  ) {
    healingMessage = 'Server temporarily unavailable, retrying...';
  } else if (
    error.message.includes('timeout') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ECONNRESET')
  ) {
    healingMessage = 'Connection timeout, please retry.';
  } else if (
    (error.message.includes('stream') && error.message.includes('ended')) ||
    error.message.includes('unexpected_end')
  ) {
    healingMessage = 'Please continue where you left off.';
  } else if (
    (error.name === 'SyntaxError' && error.message.includes('JSON')) ||
    error.message.includes('JSON parse')
  ) {
    healingMessage =
      'There was an issue with the response format. Please try again with proper formatting.';
  } else if (error.message.includes('content_policy')) {
    healingMessage = 'Please rephrase your response to comply with content policies.';
  } else {
    healingMessage = 'An error occurred, please try again.';
  }

  return {
    healed: false, // These require a retry, not auto-healing
    healingMessage: {
      role: 'user',
      content: healingMessage,
    },
  };
}

/**
 * Main function to attempt healing of streaming tool errors
 */
export function healStreamingToolError<T extends ToolSet>(
  error: HealableStreamError,
  availableTools: T
): HealingResult | null {
  // Handle NoSuchToolError
  if (NoSuchToolError.isInstance(error)) {
    const toolCallId = 'toolCallId' in error ? String(error.toolCallId) : 'unknown';
    const toolName = 'toolName' in error ? String(error.toolName) : 'unknown';

    return healNoSuchToolError(toolName, toolCallId, availableTools);
  }

  // Handle InvalidToolArgumentsError
  if (error.name === 'AI_InvalidToolArgumentsError') {
    const toolCallId = 'toolCallId' in error ? String(error.toolCallId) : 'unknown';
    const toolName = 'toolName' in error ? String(error.toolName) : 'unknown';
    const rawArgs = 'args' in error ? String(error.args) : '{}';

    // Extract Zod error if available
    let zodError: ZodError;
    if ('cause' in error && error.cause instanceof ZodError) {
      zodError = error.cause;
    } else {
      // Create a generic Zod error structure
      zodError = new ZodError([
        {
          code: 'custom',
          message: error.message || 'Invalid arguments provided',
          path: [],
        },
      ]);
    }

    // Check if this is a visualization tool that needs special handling
    if (isVisualizationTool(toolName)) {
      return healVisualizationToolArgs(toolName, toolCallId, rawArgs, zodError);
    }
    return healGenericToolArgumentsError(toolName, toolCallId, zodError);
  }

  // Handle generic streaming errors (network, server, rate limit, etc.)
  if (error instanceof Error) {
    return healGenericStreamingError(error);
  }

  // Error type not supported for healing
  return null;
}

/**
 * Checks if an error is a streaming error that can potentially be healed
 */
export function isHealableStreamError(error: unknown): error is HealableStreamError {
  return (
    NoSuchToolError.isInstance(error) ||
    (error instanceof Error && error.name === 'AI_InvalidToolArgumentsError') ||
    // Additional streaming errors that can be healed
    (error instanceof Error &&
      (error.message.includes('rate_limit_error') ||
        error.message.includes('429') ||
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504') ||
        error.message.includes('timeout') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ECONNRESET') ||
        (error.message.includes('stream') && error.message.includes('ended')) ||
        error.message.includes('unexpected_end') ||
        (error.name === 'SyntaxError' && error.message.includes('JSON')) ||
        error.message.includes('JSON parse') ||
        error.message.includes('content_policy')))
  );
}
