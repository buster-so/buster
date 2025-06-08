import { createTestChat } from '../chats/createTestChat';
import { createTestMessage } from './createTestMessage';

/**
 * Creates a test message with full context (chat, organization, user)
 * @returns Complete test context for message testing
 */
export async function createTestMessageWithContext(): Promise<{
  messageId: string;
  userId: string;
  chatId: string;
  organizationId: string;
}> {
  try {
    // Create chat first (which creates organization and user context)
    const { chatId, organizationId, userId } = await createTestChat();
    
    // Create message in that chat
    const messageId = await createTestMessage(chatId, userId);
    
    return {
      messageId,
      userId,
      chatId,
      organizationId,
    };
  } catch (error) {
    throw new Error(`Failed to create test message with context: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}