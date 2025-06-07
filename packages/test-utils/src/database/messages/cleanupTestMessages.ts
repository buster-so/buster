import { db, messages, eq } from '@buster/database';

/**
 * Cleans up test message records from the database
 * @param messageIds - Array of message IDs to delete
 */
export async function cleanupTestMessages(messageIds: string[]): Promise<void> {
  for (const messageId of messageIds) {
    try {
      await db.delete(messages).where(eq(messages.id, messageId));
    } catch (error) {
      console.warn(`Failed to cleanup test message ${messageId}:`, error);
    }
  }
}

/**
 * Cleans up a single test message record
 * @param messageId - The message ID to delete
 */
export async function cleanupTestMessage(messageId: string): Promise<void> {
  await cleanupTestMessages([messageId]);
} 