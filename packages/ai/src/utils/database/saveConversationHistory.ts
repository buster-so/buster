import type { CoreMessage } from 'ai';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../database/src/connection';
import { messages } from '../../../../database/src/schema';

/**
 * Saves conversation history to the database
 * Updates the rawLlmMessages field with the complete conversation history
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

    // Update the message with the new conversation history
    await db
      .update(messages)
      .set({
        rawLlmMessages: conversationHistory, // Drizzle will handle JSON serialization
        updatedAt: new Date().toISOString(),
      })
      .where(eq(messages.id, messageId));
  } catch (error) {
    console.error('Failed to save conversation history:', error);
    throw new Error(
      `Failed to save conversation history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Helper to save conversation history from onStepFinish
 * Checks for messageId in runtime context before saving
 *
 * @param runtimeContext - The runtime context that may contain messageId
 * @param stepMessages - The messages from step.response.messages
 * @returns Promise<void>
 */
export async function saveConversationHistoryFromStep(
  runtimeContext: { get: (key: string) => any },
  stepMessages: any[]
): Promise<void> {
  const messageId = runtimeContext.get('messageId');

  // Skip saving if no messageId (for testing/evaluation)
  if (!messageId) {
    return;
  }

  // Save the conversation history
  await saveConversationHistory(messageId, stepMessages as CoreMessage[]);
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

    if (result.length === 0) {
      return null;
    }

    return result[0].rawLlmMessages as CoreMessage[];
  } catch (error) {
    console.error('Failed to load conversation history:', error);
    return null;
  }
}
