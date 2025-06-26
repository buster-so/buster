import { eq, getDb, messages } from '@buster/database';
import { cleanupTestChats, createTestChat } from '@buster/test-utils/database/chats';
import { cleanupTestMessages, createTestMessage } from '@buster/test-utils/database/messages';
import { createTestUser } from '@buster/test-utils/database/users';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { messagePostProcessingTask } from './message-post-processing';
import type { MessagePostProcessingTaskOutput } from './types';

// Skip integration tests if TEST_DATABASE_URL is not set
const skipIntegrationTests = !process.env.TEST_DATABASE_URL;

describe.skipIf(skipIntegrationTests)('messagePostProcessingTask integration', () => {
  let testUserId: string;
  let testChatId: string;
  let testMessageId: string;

  beforeAll(async () => {
    // Create test data
    const testUser = await createTestUser({
      email: 'test-post-processing@example.com',
      name: 'Test User',
    });
    testUserId = testUser.id;

    const testChat = await createTestChat({
      userId: testUserId,
      title: 'Test Post-Processing Chat',
    });
    testChatId = testChat.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testChatId) {
      await cleanupTestMessages(testChatId);
      await cleanupTestChats(testUserId);
    }
  });

  it('should successfully process new message (not follow-up)', async () => {
    // Create test message
    const testMessage = await createTestMessage({
      chatId: testChatId,
      role: 'user',
      content: 'What is the weather today?',
      rawLlmMessages: [
        { role: 'user', content: 'What is the weather today?' },
        { role: 'assistant', content: 'I cannot provide real-time weather information.' },
      ],
    });
    testMessageId = testMessage.id;

    // Execute task
    const result = await messagePostProcessingTask.run({
      messageId: testMessageId,
    });

    // Verify result structure
    expect(result).toBeDefined();
    expect(result).toMatchObject({
      initial: {
        assumptions: expect.any(Array),
        flagForReview: expect.any(Boolean),
      },
    });

    // Verify database was updated
    const db = getDb();
    const updatedMessage = await db
      .select({ postProcessingMessage: messages.postProcessingMessage })
      .from(messages)
      .where(eq(messages.id, testMessageId))
      .limit(1);

    expect(updatedMessage[0].postProcessingMessage).toEqual(result);
  });

  it('should successfully process follow-up message', async () => {
    // Create first message with post-processing result
    const firstMessage = await createTestMessage({
      chatId: testChatId,
      role: 'user',
      content: 'Tell me about databases',
      rawLlmMessages: [
        { role: 'user', content: 'Tell me about databases' },
        { role: 'assistant', content: 'Databases are organized collections of data.' },
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
      .where(eq(messages.id, firstMessage.id));

    // Create follow-up message
    const followUpMessage = await createTestMessage({
      chatId: testChatId,
      role: 'user',
      content: 'What about NoSQL databases?',
      rawLlmMessages: [
        { role: 'user', content: 'What about NoSQL databases?' },
        { role: 'assistant', content: 'NoSQL databases are non-relational databases.' },
      ],
    });

    // Execute task for follow-up
    const result = await messagePostProcessingTask.run({
      messageId: followUpMessage.id,
    });

    // Verify it's a follow-up result
    expect(result).toBeDefined();
    expect(result).toMatchObject({
      followUp: {
        suggestions: expect.any(Array),
        analysis: expect.any(String),
      },
    });
  });

  it('should handle message with no conversation history', async () => {
    // Create message with empty rawLlmMessages
    const emptyMessage = await createTestMessage({
      chatId: testChatId,
      role: 'user',
      content: 'Empty test',
      rawLlmMessages: [],
    });

    // Execute task
    const result = await messagePostProcessingTask.run({
      messageId: emptyMessage.id,
    });

    // Should still process successfully
    expect(result).toBeDefined();
  });

  it('should fail gracefully when message does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    await expect(
      messagePostProcessingTask.run({
        messageId: nonExistentId,
      })
    ).rejects.toThrow();
  });

  it('should complete within timeout', async () => {
    // Create test message
    const testMessage = await createTestMessage({
      chatId: testChatId,
      role: 'user',
      content: 'Performance test',
      rawLlmMessages: [{ role: 'user', content: 'Performance test' }],
    });

    const startTime = Date.now();

    await messagePostProcessingTask.run({
      messageId: testMessage.id,
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
        { role: 'user', content: `Question ${i}` },
        { role: 'assistant', content: `Answer ${i}` }
      );
    }

    const largeMessage = await createTestMessage({
      chatId: testChatId,
      role: 'user',
      content: 'Large history test',
      rawLlmMessages: largeHistory,
    });

    // Should still process successfully
    const result = await messagePostProcessingTask.run({
      messageId: largeMessage.id,
    });

    expect(result).toBeDefined();
  });
});
