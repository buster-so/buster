import { db, messages } from '@buster/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a test message record in the database
 * @param chatId - The chat ID to associate the message with
 * @param createdBy - The user ID who created the message
 * @returns The ID of the newly created message
 */
export async function createTestMessage(chatId: string, createdBy: string): Promise<string> {
  try {
    const messageId = uuidv4();

    await db.insert(messages).values({
      id: messageId,
      chatId,
      createdBy,
      title: 'Test Message',
      requestMessage: 'This is a test message request',
      responseMessages: [{ content: 'This is a test response' }],
      reasoning: { steps: ['Test reasoning step 1', 'Test reasoning step 2'] },
      rawLlmMessages: [],
      finalReasoningMessage: 'Test final reasoning',
      isCompleted: true,
    });

    return messageId;
  } catch (error) {
    throw new Error(`Failed to create test message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
