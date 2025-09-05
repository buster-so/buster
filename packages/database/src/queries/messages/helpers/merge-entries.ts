import type { ModelMessage } from 'ai';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../schemas/message-schemas';

/**
 * Merges response messages by 'id' field, preserving order
 * New messages with matching IDs replace existing ones at their original position
 * New messages without matching IDs are appended
 */
export function mergeResponseMessages(
  existing: ChatMessageResponseMessage[],
  updates: ChatMessageResponseMessage[]
): ChatMessageResponseMessage[] {
  if (!existing || existing.length === 0) {
    return updates;
  }

  // Create a map of new messages by ID
  const updateMap = new Map<string, ChatMessageResponseMessage>();
  for (const msg of updates) {
    updateMap.set(msg.id, msg);
  }

  // Single pass: update existing and track what's been processed
  const result: ChatMessageResponseMessage[] = [];

  // Process existing messages, updating if needed
  for (const existingMsg of existing) {
    const updated = updateMap.get(existingMsg.id);
    if (updated) {
      result.push(updated);
      updateMap.delete(existingMsg.id); // Remove from map once processed
    } else {
      result.push(existingMsg);
    }
  }

  // Append any remaining new messages
  for (const updateMsg of updateMap.values()) {
    result.push(updateMsg);
  }

  return result;
}

/**
 * Merges reasoning messages by 'id' field, preserving order
 * New messages with matching IDs replace existing ones at their original position
 * New messages without matching IDs are appended
 */
export function mergeReasoningMessages(
  existing: ChatMessageReasoningMessage[],
  updates: ChatMessageReasoningMessage[]
): ChatMessageReasoningMessage[] {
  if (!existing || existing.length === 0) {
    return updates;
  }

  // Create a map of new messages by ID
  const updateMap = new Map<string, ChatMessageReasoningMessage>();
  for (const msg of updates) {
    updateMap.set(msg.id, msg);
  }

  // Single pass: update existing and track what's been processed
  const result: ChatMessageReasoningMessage[] = [];

  // Process existing messages, updating if needed
  for (const existingMsg of existing) {
    const updated = updateMap.get(existingMsg.id);
    if (updated) {
      result.push(updated);
      updateMap.delete(existingMsg.id); // Remove from map once processed
    } else {
      result.push(existingMsg);
    }
  }

  // Append any remaining new messages
  for (const updateMsg of updateMap.values()) {
    result.push(updateMsg);
  }

  return result;
}

/**
 * Creates a unique key for raw LLM messages based on role and tool call IDs
 */
function getRawLlmMessageKey(message: ModelMessage): string {
  const role = message.role || '';

  // Fast path for non-tool messages
  if (role !== 'assistant' && role !== 'tool') {
    return role;
  }

  // Extract tool call IDs if present
  if (Array.isArray(message.content)) {
    const toolCallIds: string[] = [];
    for (const item of message.content) {
      if (typeof item === 'object' && item !== null && 'toolCallId' in item) {
        const toolCallId = (item as { toolCallId?: unknown }).toolCallId;
        if (typeof toolCallId === 'string') {
          toolCallIds.push(toolCallId);
        }
      }
    }
    if (toolCallIds.length > 0) {
      return `${role}:${toolCallIds.sort().join(',')}`;
    }
  }

  return role;
}

/**
 * Merges raw LLM messages by combination of 'role' and 'toolCallId', preserving order
 * Messages with the same role and tool call IDs replace existing ones at their original position
 * New messages are appended
 */
export function mergeRawLlmMessages(
  existing: ModelMessage[],
  updates: ModelMessage[]
): ModelMessage[] {
  if (!existing || existing.length === 0) {
    return updates;
  }

  // Create a map of new messages by their unique key
  const updateMap = new Map<string, ModelMessage>();
  for (const msg of updates) {
    const key = getRawLlmMessageKey(msg);
    updateMap.set(key, msg);
  }

  // Single pass: update existing and track what's been processed
  const result: ModelMessage[] = [];

  // Process existing messages, updating if needed
  for (const existingMsg of existing) {
    const key = getRawLlmMessageKey(existingMsg);
    const updated = updateMap.get(key);
    if (updated) {
      result.push(updated);
      updateMap.delete(key); // Remove from map once processed
    } else {
      result.push(existingMsg);
    }
  }

  // Append any remaining new messages
  for (const updateMsg of updateMap.values()) {
    result.push(updateMsg);
  }

  return result;
}
