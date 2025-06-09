import { db, messages } from '@buster/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Options for customizing the test message
 */
export interface CreateTestMessageOptions {
  requestMessage?: string;
  title?: string;
  responseMessages?: any;
  reasoning?: any;
  rawLlmMessages?: any;
  finalReasoningMessage?: string;
  isCompleted?: boolean;
  feedback?: string;
}

/**
 * Creates a test message record in the database
 * @param chatId - The chat ID to associate the message with
 * @param createdBy - The user ID who created the message
 * @param options - Optional configuration for the message fields
 * @returns The ID of the newly created message
 */
export async function createTestMessage(
  chatId: string,
  createdBy: string,
  options: CreateTestMessageOptions = {}
): Promise<string> {
  try {
    const messageId = uuidv4();

    // Use provided options or sensible defaults
    const messageData = {
      id: messageId,
      chatId,
      createdBy,
      title: options.title ?? 'Test Message',
      requestMessage: options.requestMessage ?? 'This is a test message request',
      responseMessages: options.responseMessages ?? [{ content: 'This is a test response' }],
      reasoning: options.reasoning ?? { steps: ['Test reasoning step 1', 'Test reasoning step 2'] },
      rawLlmMessages: options.rawLlmMessages ?? [],
      finalReasoningMessage: options.finalReasoningMessage ?? 'Test final reasoning',
      isCompleted: options.isCompleted ?? true,
      ...(options.feedback && { feedback: options.feedback }),
    };

    await db.insert(messages).values(messageData);

    return messageId;
  } catch (error) {
    throw new Error(
      `Failed to create test message: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
