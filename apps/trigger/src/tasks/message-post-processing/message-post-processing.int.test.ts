import { eq, getDb, messages } from '@buster/database';
import {
  cleanupTestChats,
  cleanupTestMessages,
  createTestChat,
  createTestMessage,
  createTestUser,
} from '@buster/test-utils';
import { tasks } from '@trigger.dev/sdk/v3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { messagePostProcessingTask } from './message-post-processing';
import type { TaskOutput } from './types';

// Skip integration tests if TEST_DATABASE_URL is not set
const skipIntegrationTests = !process.env.DATABASE_URL;

describe.skipIf(skipIntegrationTests)('messagePostProcessingTask integration', () => {
  let testUserId: string;
  let testChatId: string;
  let testMessageId: string;
  let testOrgId: string;

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
    const result = await tasks.triggerAndPoll<typeof messagePostProcessingTask>(
      'message-post-processing',
      { messageId },
      { pollIntervalMs: 2000 }
    );

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.status).toBe('COMPLETED');
    expect(result.output).toBeDefined();
    expect(result.output?.success).toBe(true);
    expect(result.output?.messageId).toBe(messageId);
    expect(result.output?.result?.success).toBe(true);
    expect(result.output?.result?.workflowCompleted).toBe(true);

    // Verify database was updated
    const db = getDb();
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
    const result = await tasks.triggerAndPoll<typeof messagePostProcessingTask>(
      'message-post-processing',
      { messageId: followUpMessageId },
      { pollIntervalMs: 2000 }
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
    const messageId = 'a3206f20-35d1-4a6c-84a7-48f8f222c39f';

    // Execute task
    const result = await tasks.triggerAndPoll<typeof messagePostProcessingTask>(
      'message-post-processing',
      { messageId },
      { pollIntervalMs: 2000 }
    );

    // Should still process successfully
    expect(result).toBeDefined();
    expect(result.status).toBe('COMPLETED');
    expect(result.output?.success).toBe(true);
    expect(result.output?.messageId).toBe(messageId);

    // Cleanup - reset postProcessingMessage to null
    const db = getDb();
    await db
      .update(messages)
      .set({ postProcessingMessage: null })
      .where(eq(messages.id, messageId));
  });

  it('should fail gracefully when message does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const result = await tasks.triggerAndPoll<typeof messagePostProcessingTask>(
      'message-post-processing',
      { messageId: nonExistentId },
      { pollIntervalMs: 2000 }
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.output?.success).toBe(false);
    expect(result.output?.error?.code).toBe('MESSAGE_NOT_FOUND');
  });

  it('should complete within timeout', async () => {
    // Use prepopulated message ID
    const messageId = 'a3206f20-35d1-4a6c-84a7-48f8f222c39f';

    const startTime = Date.now();

    await tasks.triggerAndPoll<typeof messagePostProcessingTask>(
      'message-post-processing',
      { messageId },
      { pollIntervalMs: 2000 }
    );

    const duration = Date.now() - startTime;

    // Should complete within 60 seconds (task timeout)
    expect(duration).toBeLessThan(60000);

    // Cleanup - reset postProcessingMessage to null
    const db = getDb();
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
    const result = await tasks.triggerAndPoll<typeof messagePostProcessingTask>(
      'message-post-processing',
      { messageId: largeMessageId },
      { pollIntervalMs: 2000 }
    );

    expect(result).toBeDefined();
    expect(result.status).toBe('COMPLETED');
    expect(result.output?.success).toBe(true);
    expect(result.output?.messageId).toBe(largeMessageId);
  });
});
