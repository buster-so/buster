import type { CoreMessage } from 'ai';
import { eq } from 'drizzle-orm';

interface ReasoningEntry {
  id: string;
  [key: string]: unknown;
}
import { getDb, messages, updateMessageFields } from '@buster/database';
import {
  extractResponseMessages,
  formatLlmMessagesAsReasoning,
} from './format-llm-messages-as-reasoning';

/**
 * Saves conversation history to the database
 * Updates the rawLlmMessages field with the complete conversation history
 *
 * IMPORTANT: The conversationHistory should already be in the correct unbundled format
 * where each tool call and tool result are separate messages, not bundled together.
 *
 * @param messageId - The message ID to update
 * @param conversationHistory - The complete conversation history as CoreMessage[]
 * @returns Promise<void>
 */
export async function saveConversationHistory(
  messageId: string,
  conversationHistory: CoreMessage[]
): Promise<void> {
  try {
    const db = getDb();

    // Save the conversation history exactly as provided
    // It should already be in the correct unbundled format
    await db
      .update(messages)
      .set({
        rawLlmMessages: conversationHistory, // Drizzle will handle JSON serialization
        updatedAt: new Date().toISOString(),
      })
      .where(eq(messages.id, messageId));
  } catch (error) {
    throw new Error(
      `Failed to save conversation history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Helper to save conversation history from onStepFinish
 * Checks for messageId in runtime context before saving
 * Now also saves messages as reasoning entries
 *
 * @param messageId - The message ID to save to
 * @param stepMessages - The messages from step.response.messages
 * @param reasoningHistory - Optional reasoning history to save
 * @param responseHistory - Optional response history to save
 * @returns Promise<void>
 */
export async function saveConversationHistoryFromStep(
  messageId: string,
  stepMessages: CoreMessage[],
  reasoningHistory?: unknown[],
  responseHistory?: unknown[]
): Promise<{ newReasoningMessages: unknown[]; newResponseMessages: unknown[] }> {
  try {
    const db = getDb();

    // First, get the current reasoning to append to it
    const currentMessage = await db
      .select({ reasoning: messages.reasoning })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    const currentReasoning = Array.isArray(currentMessage[0]?.reasoning)
      ? currentMessage[0].reasoning
      : [];

    // Build the new reasoning by appending new messages as reasoning entries
    if (!Array.isArray(stepMessages)) {
      console.error('saveConversationHistoryFromStep: stepMessages is not an array');
      throw new Error('Invalid stepMessages: expected array');
    }

    // Extract reasoning messages
    const newReasoningEntries = formatLlmMessagesAsReasoning(stepMessages);

    // Extract response messages
    const newResponseEntries = extractResponseMessages(stepMessages);

    // Deduplicate reasoning by ID - keep track of existing IDs
    const existingIds = new Set(
      (currentReasoning as unknown[])
        .filter((r): r is ReasoningEntry => r != null && typeof r === 'object' && 'id' in r)
        .map((r) => (r as ReasoningEntry).id)
    );
    const deduplicatedNewEntries = (newReasoningEntries as unknown[]).filter(
      (entry): entry is ReasoningEntry =>
        entry != null &&
        typeof entry === 'object' &&
        'id' in entry &&
        !existingIds.has((entry as ReasoningEntry).id)
    );

    const updatedReasoning = [...currentReasoning, ...deduplicatedNewEntries];

    // Prepare update fields
    const updateFields: Record<string, unknown> = {
      rawLlmMessages: stepMessages,
      reasoning: updatedReasoning,
    };

    // Also store in separate fields for backward compatibility
    if (reasoningHistory && reasoningHistory.length > 0) {
      updateFields.reasoningMessages = reasoningHistory;
    }

    if (responseHistory && responseHistory.length > 0) {
      updateFields.responseMessages = responseHistory;
    }

    // Update all fields in a single call
    await updateMessageFields(messageId, updateFields);

    // Return the new messages for workflow usage
    return {
      newReasoningMessages: deduplicatedNewEntries,
      newResponseMessages: newResponseEntries,
    };
  } catch (error) {
    throw new Error(
      `Failed to save conversation history and reasoning: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Loads conversation history from the database
 * Used when continuing a conversation
 *
 * @param messageId - The message ID to load history from
 * @returns Promise<CoreMessage[] | null>
 */
export async function loadConversationHistory(messageId: string): Promise<CoreMessage[] | null> {
  try {
    const db = getDb();

    const result = await db
      .select({
        rawLlmMessages: messages.rawLlmMessages,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (result.length === 0 || !result[0]) {
      return null;
    }

    const rawMessages = result[0].rawLlmMessages;

    // Validate that rawLlmMessages is an array
    if (!Array.isArray(rawMessages)) {
      console.error('loadConversationHistory: rawLlmMessages is not an array:', typeof rawMessages);
      return null;
    }

    return rawMessages as CoreMessage[];
  } catch (error) {
    throw new Error(
      `Failed to load conversation history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
