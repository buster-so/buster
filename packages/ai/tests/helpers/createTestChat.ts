import { db } from '../../../database/src/connection';
import { chats } from '../../../database/src/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a test chat record in the database
 * @param organizationId - The organization ID to associate the chat with
 * @param createdBy - The user ID who created the chat
 * @returns The ID of the newly created chat
 */
export async function createTestChat(organizationId: string, createdBy: string): Promise<string> {
  const chatId = uuidv4();

  await db.insert(chats).values({
    id: chatId,
    title: 'Test Chat',
    organizationId,
    createdBy,
    updatedBy: createdBy,
    publiclyAccessible: false,
  });

  return chatId;
}

/**
 * Creates a test chat with minimal required fields and auto-generated IDs
 * @returns An object containing the chat ID, organization ID, and user ID
 */
export async function createMinimalTestChat(): Promise<{
  chatId: string;
  organizationId: string;
  userId: string;
}> {
  const chatId = uuidv4();
  const organizationId = uuidv4();
  const userId = uuidv4();

  await db.insert(chats).values({
    id: chatId,
    title: 'Test Chat',
    organizationId,
    createdBy: userId,
    updatedBy: userId,
    publiclyAccessible: false,
  });

  return { chatId, organizationId, userId };
}
