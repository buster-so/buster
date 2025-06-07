import { db, chats, eq } from '@buster/database';

/**
 * Cleans up test chat records from the database
 * @param chatIds - Array of chat IDs to delete
 */
export async function cleanupTestChats(chatIds: string[]): Promise<void> {
  for (const chatId of chatIds) {
    try {
      await db.delete(chats).where(eq(chats.id, chatId));
    } catch (error) {
      console.warn(`Failed to cleanup test chat ${chatId}:`, error);
    }
  }
}

/**
 * Cleans up a single test chat record
 * @param chatId - The chat ID to delete
 */
export async function cleanupTestChat(chatId: string): Promise<void> {
  await cleanupTestChats([chatId]);
} 