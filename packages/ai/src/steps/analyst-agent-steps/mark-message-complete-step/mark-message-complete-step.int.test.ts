import { chats, db, messages, organizations, users } from '@buster/database';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Helper functions for test data creation
interface CreateTestMessageOptions {
  requestMessage?: string;
  title?: string;
  // biome-ignore lint/suspicious/noExplicitAny: because this is for testing it seems fine
  responseMessages?: any;
  // biome-ignore lint/suspicious/noExplicitAny: because this is for testing it seems fine
  reasoning?: any;
  // biome-ignore lint/suspicious/noExplicitAny: because this is for testing it seems fine
  rawLlmMessages?: any;
  finalReasoningMessage?: string;
  isCompleted?: boolean;
  feedback?: string;
}

async function createTestOrganization(params?: {
  name?: string;
}): Promise<string> {
  try {
    const organizationId = uuidv4();
    const name = params?.name || `Test Organization ${uuidv4()}`;

    await db.insert(organizations).values({
      id: organizationId,
      name,
    });

    return organizationId;
  } catch (error) {
    throw new Error(
      `Failed to create test organization: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function createTestUser(params?: {
  email?: string;
  name?: string;
}): Promise<string> {
  try {
    const userId = uuidv4();
    const email = params?.email || `test-${uuidv4()}@example.com`;
    const name = params?.name || 'Test User';

    await db.insert(users).values({
      id: userId,
      email,
      name,
    });

    return userId;
  } catch (error) {
    throw new Error(
      `Failed to create test user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function createTestChat(
  organizationId?: string,
  createdBy?: string
): Promise<{
  chatId: string;
  organizationId: string;
  userId: string;
}> {
  try {
    const chatId = uuidv4();

    // Create organization and user if not provided
    const orgId = organizationId || (await createTestOrganization());
    const userId = createdBy || (await createTestUser());

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
  } catch (error) {
    throw new Error(
      `Failed to create test chat: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function createTestMessage(
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
import { markMessageComplete } from './mark-message-complete-step';

describe('markMessageComplete integration test', () => {
  let testChatId: string;
  let testMessageId: string;
  let testUserId: string;
  let testOrganizationId: string;

  beforeEach(async () => {
    // Create test chat which automatically creates org and user
    const chatData = await createTestChat();
    testChatId = chatData.chatId;
    testUserId = chatData.userId;
    testOrganizationId = chatData.organizationId;

    // Create a test message - returns just the ID string
    testMessageId = await createTestMessage(testChatId, testUserId, {
      isCompleted: false, // Start with uncompleted message for testing
      finalReasoningMessage: '',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should mark a message as complete with final reasoning message', async () => {
    const result = await markMessageComplete({
      messageId: testMessageId,
      chatId: testChatId,
      finalReasoningMessage: 'Task completed successfully',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe(testMessageId);
    expect(result.completedAt).toBeDefined();

    // Verify the message was updated in the database
    const [updatedMessage] = await db.select().from(messages).where(eq(messages.id, testMessageId));

    expect(updatedMessage?.isCompleted).toBe(true);
    expect(updatedMessage?.finalReasoningMessage).toBe('Task completed successfully');
  });

  it('should update chat with selected file information', async () => {
    const selectedFile = {
      fileId: '123e4567-e89b-12d3-a456-426614174000',
      fileType: 'dashboard',
      versionNumber: 1,
    };

    const result = await markMessageComplete({
      messageId: testMessageId,
      chatId: testChatId,
      finalReasoningMessage: 'File created',
      selectedFile,
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe(testMessageId);

    // Wait a moment for database update to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the chat was updated with file information
    const [updatedChat] = await db.select().from(chats).where(eq(chats.id, testChatId));

    expect(updatedChat).toBeDefined();
    expect(updatedChat?.mostRecentFileId).toBe(selectedFile.fileId);
    expect(updatedChat?.mostRecentFileType).toBe(selectedFile.fileType);
    expect(updatedChat?.mostRecentVersionNumber).toBe(selectedFile.versionNumber);
  });

  it('should handle missing messageId gracefully', async () => {
    const result = await markMessageComplete({
      finalReasoningMessage: 'No message to mark',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('');
    expect(result.completedAt).toBeDefined();
  });

  it('should use default reasoning message when not provided', async () => {
    const result = await markMessageComplete({
      messageId: testMessageId,
      chatId: testChatId,
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe(testMessageId);

    // Verify the default message was used - need to ensure messageId is defined
    if (testMessageId) {
      const [updatedMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, testMessageId));

      expect(updatedMessage?.finalReasoningMessage).toBe('complete');
    }
  });

  it('should not update chat when chatId is missing', async () => {
    const selectedFile = {
      fileId: '123e4567-e89b-12d3-a456-426614174000',
      fileType: 'metric',
      versionNumber: 2,
    };

    const result = await markMessageComplete({
      messageId: testMessageId,
      finalReasoningMessage: 'File created',
      selectedFile,
      // chatId intentionally omitted
    });

    expect(result.success).toBe(true);

    // Verify the chat was not updated
    const [chat] = await db.select().from(chats).where(eq(chats.id, testChatId));

    expect(chat?.mostRecentFileId).toBeNull();
  });
});
