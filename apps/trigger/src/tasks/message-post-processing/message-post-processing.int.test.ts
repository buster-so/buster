import {
  chats,
  db as dbImport,
  dbInitialized,
  eq,
  messages,
  organizations,
  users,
} from '@buster/database';
import { runs, tasks } from '@trigger.dev/sdk';
import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { messagePostProcessingTask } from './message-post-processing';

// Helper functions for test data creation
export interface CreateTestMessageOptions {
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

    await dbImport.insert(organizations).values({
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

    await dbImport.insert(users).values({
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

    await dbImport.insert(chats).values({
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

    await dbImport.insert(messages).values(messageData);

    return messageId;
  } catch (error) {
    throw new Error(
      `Failed to create test message: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function cleanupTestChats(chatIds: string[]): Promise<void> {
  for (const chatId of chatIds) {
    try {
      await dbImport.delete(chats).where(eq(chats.id, chatId));
    } catch (error) {
      console.warn(`Failed to cleanup test chat ${chatId}:`, error);
    }
  }
}

async function cleanupTestMessages(messageIds: string[]): Promise<void> {
  for (const messageId of messageIds) {
    try {
      await dbImport.delete(messages).where(eq(messages.id, messageId));
    } catch (error) {
      console.warn(`Failed to cleanup test message ${messageId}:`, error);
    }
  }
}

// Skip integration tests if TEST_DATABASE_URL is not set
const skipIntegrationTests = !process.env.DATABASE_URL;

describe.skipIf(skipIntegrationTests)('messagePostProcessingTask integration', () => {
  let testUserId: string;
  let testChatId: string;
  let testMessageId: string;
  let testOrgId: string;

  async function triggerAndPollMessagePostProcessing(
    payload: { messageId: string },
    pollIntervalMs = 2000,
    timeoutMs = 60000
  ) {
    const handle = await tasks.trigger<typeof messagePostProcessingTask>(
      'message-post-processing',
      payload
    );

    const start = Date.now();
    // poll until terminal state or timeout
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const run = await runs.retrieve(handle.id);
      if (run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELED') {
        return run;
      }

      if (Date.now() - start > timeoutMs) {
        return run;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  beforeAll(async () => {
    // Use specific test user with datasets and permissions
    testUserId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';

    const testChatResult = await createTestChat();
    testChatId = testChatResult.chatId;
    testOrgId = testChatResult.organizationId;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testChatId) {
      // Note: cleanupTestMessages expects message IDs, not chat IDs
      // For now, we'll just clean up the chat which should cascade delete messages
      await cleanupTestChats([testChatId]);
    }
  });

  it('should successfully process new message (not follow-up)', async () => {
    // Use prepopulated message ID
    const messageId = 'a3206f20-35d1-4a6c-84a7-48f8f222c39f';

    // Execute task
    const result = await triggerAndPollMessagePostProcessing({ messageId }, 2000);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.status).toBe('COMPLETED');
    expect(result.output).toBeDefined();
    expect(result.output?.success).toBe(true);
    expect(result.output?.messageId).toBe(messageId);
    expect(result.output?.result?.success).toBe(true);
    expect(result.output?.result?.workflowCompleted).toBe(true);

    // Verify database was updated
    const db = await dbInitialized;
    const updatedMessage = await db
      .select({ postProcessingMessage: messages.postProcessingMessage })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    expect(updatedMessage[0]?.postProcessingMessage).toBeDefined();

    // Cleanup - reset postProcessingMessage to null
    await db
      .update(messages)
      .set({ postProcessingMessage: null })
      .where(eq(messages.id, messageId));
  });

  it('should successfully process follow-up message', async () => {
    // Create first message with post-processing result
    const firstMessageId = await createTestMessage(testChatId, testUserId, {
      requestMessage: 'Tell me about databases',
      rawLlmMessages: [
        { role: 'user' as const, content: 'Tell me about databases' },
        { role: 'assistant' as const, content: 'Databases are organized collections of data.' },
      ],
    });

    // Manually add post-processing result to first message
    const db = await dbInitialized;
    await db
      .update(messages)
      .set({
        postProcessingMessage: {
          initial: {
            assumptions: ['User wants general database information'],
            flagForReview: false,
          },
        },
      })
      .where(eq(messages.id, firstMessageId));

    // Create follow-up message
    const followUpMessageId = await createTestMessage(testChatId, testUserId, {
      requestMessage: 'What about NoSQL databases?',
      rawLlmMessages: [
        { role: 'user' as const, content: 'What about NoSQL databases?' },
        { role: 'assistant' as const, content: 'NoSQL databases are non-relational databases.' },
      ],
    });

    // Execute task for follow-up
    const result = await triggerAndPollMessagePostProcessing(
      { messageId: followUpMessageId },
      2000
    );

    // Verify it's a follow-up result
    expect(result).toBeDefined();
    expect(result.status).toBe('COMPLETED');
    expect(result.output?.success).toBe(true);
    expect(result.output?.messageId).toBe(followUpMessageId);
    expect(result.output?.result?.success).toBe(true);
    expect(result.output?.result?.workflowCompleted).toBe(true);
  });

  it('should handle message with no conversation history', async () => {
    // Use prepopulated message ID
    const messageId = '203744bd-439f-4b3c-9ea2-ddfe243c5afe';

    // Execute task
    const result = await triggerAndPollMessagePostProcessing({ messageId }, 2000);

    // Should still process successfully
    expect(result).toBeDefined();
    expect(result.status).toBe('COMPLETED');
    expect(result.output?.success).toBe(true);
    expect(result.output?.messageId).toBe(messageId);

    // Cleanup - reset postProcessingMessage to null
    const db = await dbInitialized;
    await db
      .update(messages)
      .set({ postProcessingMessage: null })
      .where(eq(messages.id, messageId));
  });

  it('should fail gracefully when message does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const result = await triggerAndPollMessagePostProcessing({ messageId: nonExistentId }, 2000);

    expect(result.status).toBe('COMPLETED');
    expect(result.output?.success).toBe(false);
    expect(result.output?.error?.code).toBe('MESSAGE_NOT_FOUND');
  });

  it('should complete within timeout', async () => {
    // Use prepopulated message ID
    const messageId = 'a3206f20-35d1-4a6c-84a7-48f8f222c39f';

    const startTime = Date.now();

    await triggerAndPollMessagePostProcessing({ messageId }, 2000);

    const duration = Date.now() - startTime;

    // Should complete within 60 seconds (task timeout)
    expect(duration).toBeLessThan(60000);

    // Cleanup - reset postProcessingMessage to null
    const db = await dbInitialized;
    await db
      .update(messages)
      .set({ postProcessingMessage: null })
      .where(eq(messages.id, messageId));
  });

  it('should handle large conversation histories', async () => {
    // Create many messages in the chat
    const largeHistory = [];
    for (let i = 0; i < 50; i++) {
      largeHistory.push(
        { role: 'user' as const, content: `Question ${i}` },
        { role: 'assistant' as const, content: `Answer ${i}` }
      );
    }

    const largeMessageId = await createTestMessage(testChatId, testUserId, {
      requestMessage: 'Large history test',
      rawLlmMessages: largeHistory,
    });

    // Should still process successfully
    const result = await triggerAndPollMessagePostProcessing({ messageId: largeMessageId }, 2000);

    expect(result).toBeDefined();
    expect(result.status).toBe('COMPLETED');
    expect(result.output?.success).toBe(true);
    expect(result.output?.messageId).toBe(largeMessageId);
  });
});
