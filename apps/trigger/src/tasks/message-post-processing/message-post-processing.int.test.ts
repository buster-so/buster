import { eq, getDb, messages } from '@buster/database';
import { cleanupTestChats, cleanupTestMessages, createTestChat, createTestMessage, createTestUser } from '@buster/test-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { messagePostProcessingTask } from './message-post-processing';

// Extract the run function from the task configuration
const runTask = (messagePostProcessingTask as any).run;
import type { TaskOutput } from './types';

// Skip integration tests if TEST_DATABASE_URL is not set
const skipIntegrationTests = !process.env.TEST_DATABASE_URL;

describe.skipIf(skipIntegrationTests)('messagePostProcessingTask integration', () => {
  let testUserId: string;
  let testChatId: string;
  let testMessageId: string;
  let testOrgId: string;

  beforeAll(async () => {
    // Create test data
    testUserId = await createTestUser({
      email: 'test-post-processing@example.com',
      name: 'Test User',
    });

    const testChatResult = await createTestChat();
    testChatId = testChatResult.chatId;
    testOrgId = testChatResult.organizationId;
    // Use the userId from createTestChat, not createTestUser
    testUserId = testChatResult.userId;
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
    // Create test message
    testMessageId = await createTestMessage(testChatId, testUserId, {
      requestMessage: 'What is the weather today?',
      rawLlmMessages: [
        { role: 'user' as const, content: 'What is the weather today?' },
        { role: 'assistant' as const, content: 'I cannot provide real-time weather information.' },
      ],
    });

    // Execute task
    const result = await runTask({
      messageId: testMessageId,
    });

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBe(testMessageId);
    expect(result.result).toBeDefined();
    expect(result.result?.success).toBe(true);
    expect(result.result?.workflowCompleted).toBe(true);

    // Verify database was updated
    const db = getDb();
    const updatedMessage = await db
      .select({ postProcessingMessage: messages.postProcessingMessage })
      .from(messages)
      .where(eq(messages.id, testMessageId))
      .limit(1);

    expect(updatedMessage[0]?.postProcessingMessage).toBeDefined();
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
    const db = getDb();
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
    const result = await runTask({
      messageId: followUpMessageId,
    });

    // Verify it's a follow-up result
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBe(followUpMessageId);
    expect(result.result).toBeDefined();
    expect(result.result?.success).toBe(true);
    expect(result.result?.workflowCompleted).toBe(true);
  });

  it('should handle message with no conversation history', async () => {
    // Create message with empty rawLlmMessages
    const emptyMessageId = await createTestMessage(testChatId, testUserId, {
      requestMessage: 'Empty test',
      rawLlmMessages: [],
    });

    // Execute task
    const result = await runTask({
      messageId: emptyMessageId,
    });

    // Should still process successfully
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBe(emptyMessageId);
  });

  it('should fail gracefully when message does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const result = await runTask({
      messageId: nonExistentId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('MESSAGE_NOT_FOUND');
  });

  it('should complete within timeout', async () => {
    // Create test message
    const perfTestMessageId = await createTestMessage(testChatId, testUserId, {
      requestMessage: 'Performance test',
      rawLlmMessages: [{ role: 'user' as const, content: 'Performance test' }],
    });

    const startTime = Date.now();

    await runTask({
      messageId: perfTestMessageId,
    });

    const duration = Date.now() - startTime;

    // Should complete within 60 seconds (task timeout)
    expect(duration).toBeLessThan(60000);
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
    const result = await runTask({
      messageId: largeMessageId,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBe(largeMessageId);
  });
});
