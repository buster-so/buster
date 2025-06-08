import { chats, db } from '@buster/database';
import { v4 as uuidv4 } from 'uuid';
import { createTestOrganization } from '../organizations/createTestOrganization';
import { createTestUser } from '../users/createTestUser';

/**
 * Creates a test chat record in the database
 * @param organizationId - The organization ID to associate the chat with (auto-generated if not provided)
 * @param createdBy - The user ID who created the chat (auto-generated if not provided)
 * @returns An object containing the chat ID, organization ID, and user ID
 */
export async function createTestChat(
  organizationId?: string,
  createdBy?: string
): Promise<{
  chatId: string;
  organizationId: string;
  userId: string;
}> {
  const chatId = uuidv4();
  
  // Create organization and user if not provided
  const orgId = organizationId || await createTestOrganization();
  const userId = createdBy || await createTestUser();

  await db.insert(chats).values({
    id: chatId,
    title: 'Test Chat',
    organizationId: orgId,
    createdBy: userId,
    updatedBy: userId,
    publiclyAccessible: false,
  });

  return {
    chatId,
    organizationId: orgId,
    userId,
  };
}
