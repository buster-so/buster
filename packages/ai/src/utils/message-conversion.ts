import type { ModelMessage } from 'ai';

/**
 * Converts AI SDK v4 CoreMessage to v5 ModelMessage
 *
 * Key differences:
 * - ImagePart: mimeType → mediaType
 * - FilePart: mimeType → mediaType, added optional filename
 * - ToolResultPart: result → output (with structured type)
 * - ToolCallPart: remains the same (args field)
 */
export function convertCoreMessageToModelMessage(message: unknown): ModelMessage {
  // Handle null/undefined
  if (!message || typeof message !== 'object' || !('role' in message)) {
    return message as ModelMessage;
  }

  const msg = message as Record<string, unknown>;
  const { role, content } = msg;

  switch (role) {
    case 'system':
      // System messages remain string-based
      return {
        role: 'system',
        content: typeof content === 'string' ? content : '',
      };

    case 'user':
      // User messages can be string or array of parts
      if (typeof content === 'string') {
        return {
          role: 'user',
          content,
        };
      }

      if (Array.isArray(content)) {
        return {
          role: 'user',
          // biome-ignore lint/suspicious/noExplicitAny: necessary for v4 to v5 conversion
          content: content.map(convertContentPart) as any,
        };
      }

      return { role: 'user', content: '' };

    case 'assistant':
      // Assistant messages can be string or array of parts
      if (typeof content === 'string') {
        return {
          role: 'assistant',
          content,
        };
      }

      if (Array.isArray(content)) {
        return {
          role: 'assistant',
          // biome-ignore lint/suspicious/noExplicitAny: necessary for v4 to v5 conversion
          content: content.map(convertContentPart) as any,
        };
      }

      return { role: 'assistant', content: '' };

    case 'tool':
      // Tool messages are always arrays of ToolResultPart
      if (Array.isArray(content)) {
        // Convert and flatten nested results
        const convertedContent = [];
        for (const part of content) {
          const converted = convertToolResultPart(part);
          if (converted !== null) {
            if (Array.isArray(converted)) {
              // Flatten nested arrays (from wrapper tool results)
              convertedContent.push(...converted);
            } else {
              convertedContent.push(converted);
            }
          }
        }

        return {
          role: 'tool',
          // biome-ignore lint/suspicious/noExplicitAny: necessary for v4 to v5 conversion
          content: convertedContent as any,
        };
      }

      return { role: 'tool', content: [] };

    default:
      // Pass through unknown roles
      return message as ModelMessage;
  }
}

/**
 * Convert content parts from v4 to v5 format
 */
function convertContentPart(part: unknown): unknown {
  if (!part || typeof part !== 'object' || !('type' in part)) {
    return part;
  }

  const p = part as Record<string, unknown>;
  switch (p.type) {
    case 'text':
      // Text parts remain the same
      return part;

    case 'image':
      // Convert mimeType → mediaType
      if ('mimeType' in p) {
        const { mimeType, ...rest } = p;
        return {
          ...rest,
          mediaType: mimeType,
        };
      }
      return part;

    case 'file':
      // Convert mimeType → mediaType
      if ('mimeType' in p) {
        const { mimeType, ...rest } = p;
        return {
          ...rest,
          mediaType: mimeType,
        };
      }
      return part;

    case 'tool-call':
      // Tool calls: args → input (AI SDK v5 change)
      if ('args' in p) {
        const { args, ...rest } = p;
        return { ...rest, input: args };
      }
      return part;

    default:
      return part;
  }
}

/**
 * Convert tool result parts from v4 to v5 format
 */
function convertToolResultPart(part: unknown): unknown | unknown[] | null {
  if (!part || typeof part !== 'object') {
    return part;
  }

  const p = part as Record<string, unknown>;

  if (p.type !== 'tool-result') {
    return part;
  }

  // Check if this is a wrapper with empty toolCallId/toolName and nested results
  if (
    'toolCallId' in p &&
    (p.toolCallId === '' || !p.toolCallId) &&
    'toolName' in p &&
    (p.toolName === '' || !p.toolName) &&
    'result' in p &&
    Array.isArray(p.result)
  ) {
    // This is a wrapper - extract and convert the nested tool results
    const nestedResults = [];
    for (const nestedItem of p.result) {
      if (
        nestedItem &&
        typeof nestedItem === 'object' &&
        'type' in nestedItem &&
        nestedItem.type === 'tool-result'
      ) {
        const converted = convertToolResultPart(nestedItem);
        if (converted !== null) {
          if (Array.isArray(converted)) {
            nestedResults.push(...converted);
          } else {
            nestedResults.push(converted);
          }
        }
      }
    }
    // Return the array of nested results to be flattened
    return nestedResults.length > 0 ? nestedResults : null;
  }

  // Convert result → output with proper structure
  if ('result' in p && !('output' in p)) {
    const { result, experimental_content, isError, ...rest } = p;

    // Ensure toolCallId exists and is valid
    // If it's missing or invalid, skip this result
    if (!rest.toolCallId || typeof rest.toolCallId !== 'string' || rest.toolCallId.trim() === '') {
      return null;
    }

    // Check if toolCallId matches the required pattern
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(rest.toolCallId as string)) {
      return null;
    }

    // Convert result to structured output format
    let output: { type: string; value: unknown };
    if (isError) {
      // Error results
      if (typeof result === 'string') {
        output = { type: 'error-text', value: result };
      } else {
        output = { type: 'error-json', value: result };
      }
    } else {
      // Success results
      if (typeof result === 'string') {
        output = { type: 'text', value: result };
      } else {
        output = { type: 'json', value: result };
      }
    }

    return {
      ...rest,
      output,
    };
  }

  return part;
}

/**
 * Converts an array of v4 CoreMessages to v5 ModelMessages
 */
export function convertCoreMessagesToModelMessages(messages: unknown[]): ModelMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.map(convertCoreMessageToModelMessage);
}

/**
 * Helper to check if content is already in v5 format
 * Useful when migrating codebases that might have mixed formats
 */
export function isV5ContentFormat(content: unknown): boolean {
  // Check for tool result with v5 output field
  if (Array.isArray(content) && content.length > 0) {
    const firstItem = content[0];
    if (firstItem?.type === 'tool-result' && 'output' in firstItem) {
      return true;
    }
  }
  return false;
}

/**
 * Smart conversion that handles both v4 and v5 formats
 * Useful during migration when you might have mixed message formats
 */
export function ensureModelMessageFormat(message: unknown): ModelMessage {
  // Already in v5 format if tool messages have 'output' field
  if (message && typeof message === 'object' && 'role' in message && 'content' in message) {
    const msg = message as Record<string, unknown>;
    if (msg.role === 'tool' && isV5ContentFormat(msg.content)) {
      return message as ModelMessage;
    }
  }

  // Convert from v4 format
  return convertCoreMessageToModelMessage(message);
}
