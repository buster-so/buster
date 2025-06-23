import { db, messages } from '@buster/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a test message record in the database
 * @param chatId - The chat ID to associate the message with
 * @param createdBy - The user ID who created the message
 * @returns The ID of the newly created message
 */
export async function createTestMessage(chatId: string, createdBy: string): Promise<string> {
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
}

/**
 * Creates a test message with minimal required fields
 * @returns The ID of the newly created message
 */
export async function createMinimalTestMessage(): Promise<string> {
  const messageId = uuidv4();
  const chatId = uuidv4();
  const userId = uuidv4();

  await db.insert(messages).values({
    id: messageId,
    chatId,
    createdBy: userId,
    title: 'Test Message',
    responseMessages: [],
    reasoning: {},
    rawLlmMessages: [],
    isCompleted: false,
  });

  return messageId;
}
