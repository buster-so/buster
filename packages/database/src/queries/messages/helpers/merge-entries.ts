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

  // Keep track of which IDs we've already processed
  const processedIds = new Set<string>();

  // First pass: update existing messages in place
  const merged = existing.map((existingMsg) => {
    if (updateMap.has(existingMsg.id)) {
      processedIds.add(existingMsg.id);
      const updated = updateMap.get(existingMsg.id);
      if (!updated) {
        throw new Error(`Expected to find message with id ${existingMsg.id} in updateMap`);
      }
      return updated;
    }
    return existingMsg;
  });

  // Second pass: append new messages that weren't in existing
  for (const updateMsg of updates) {
    if (!processedIds.has(updateMsg.id)) {
      merged.push(updateMsg);
    }
  }

  return merged;
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

  // Keep track of which IDs we've already processed
  const processedIds = new Set<string>();

  // First pass: update existing messages in place
  const merged = existing.map((existingMsg) => {
    if (updateMap.has(existingMsg.id)) {
      processedIds.add(existingMsg.id);
      const updated = updateMap.get(existingMsg.id);
      if (!updated) {
        throw new Error(`Expected to find message with id ${existingMsg.id} in updateMap`);
      }
      return updated;
    }
    return existingMsg;
  });

  // Second pass: append new messages that weren't in existing
  for (const updateMsg of updates) {
    if (!processedIds.has(updateMsg.id)) {
      merged.push(updateMsg);
    }
  }

  return merged;
}

/**
 * Helper to extract tool call IDs from content
 */
function getToolCallIds(content: unknown): string {
  if (!content || typeof content !== 'object') {
    return '';
  }

  if (Array.isArray(content)) {
    const toolCallIds: string[] = [];
    for (const item of content) {
      if (typeof item === 'object' && item !== null && 'toolCallId' in item) {
        const toolCallId = (item as { toolCallId?: unknown }).toolCallId;
        if (typeof toolCallId === 'string') {
          toolCallIds.push(toolCallId);
        }
      }
    }
    return toolCallIds.sort().join(',');
  }

  return '';
}

/**
 * Creates a unique key for raw LLM messages based on role and tool call IDs
 */
function getRawLlmMessageKey(message: ModelMessage): string {
  const role = message.role || '';
  const toolCallIds = getToolCallIds(message.content);
  return `${role}:${toolCallIds}`;
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

  // Keep track of which keys we've already processed
  const processedKeys = new Set<string>();

  // First pass: update existing messages in place
  const merged = existing.map((existingMsg) => {
    const key = getRawLlmMessageKey(existingMsg);
    if (updateMap.has(key)) {
      processedKeys.add(key);
      const updated = updateMap.get(key);
      if (!updated) {
        throw new Error(`Expected to find message with key ${key} in updateMap`);
      }
      return updated;
    }
    return existingMsg;
  });

  // Second pass: append new messages that weren't in existing
  for (const updateMsg of updates) {
    const key = getRawLlmMessageKey(updateMsg);
    if (!processedKeys.has(key)) {
      merged.push(updateMsg);
    }
  }

  return merged;
}
