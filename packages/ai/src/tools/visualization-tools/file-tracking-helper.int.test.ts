import { randomUUID } from 'node:crypto';
import { dataSources, db, eq, messagesToFiles, metricFiles, chats, messages, organizations, users } from '@buster/database';
import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { trackFileAssociations } from './file-tracking-helper';

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

async function createTestDataSource(params?: {
  organizationId?: string;
  createdBy?: string;
  name?: string;
  type?: string;
}): Promise<{
  dataSourceId: string;
  organizationId: string;
  userId: string;
  dataSourceType: string;
}> {
  try {
    const dataSourceId = uuidv4();

    // Create organization and user if not provided
    const organizationId = params?.organizationId || (await createTestOrganization());
    const userId = params?.createdBy || (await createTestUser());
    const secretId = uuidv4();
    const dataSourceType = params?.type || 'postgresql';
    const name = params?.name || `Test Data Source ${uuidv4()}`;

    await db.insert(dataSources).values({
      id: dataSourceId,
      name,
      type: dataSourceType,
      secretId,
      organizationId,
      createdBy: userId,
      updatedBy: userId,
      onboardingStatus: 'completed',
    });

    return {
      dataSourceId,
      organizationId,
      userId,
      dataSourceType,
    };
  } catch (error) {
    throw new Error(
      `Failed to create test data source: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function cleanupTestChats(chatIds: string[]): Promise<void> {
  for (const chatId of chatIds) {
    try {
      await db.delete(chats).where(eq(chats.id, chatId));
    } catch (error) {
      console.warn(`Failed to cleanup test chat ${chatId}:`, error);
    }
  }
}

async function cleanupTestMessages(messageIds: string[]): Promise<void> {
  for (const messageId of messageIds) {
    try {
      await db.delete(messages).where(eq(messages.id, messageId));
    } catch (error) {
      console.warn(`Failed to cleanup test message ${messageId}:`, error);
    }
  }
}

interface TestEnvironment {
  cleanup: () => Promise<void>;
  reset: () => Promise<void>;
}

async function setupTestEnvironment(): Promise<TestEnvironment> {
  // Store original environment variables
  const originalEnv = { ...process.env };

  // Set test-specific environment variables
  process.env.NODE_ENV = 'test';
  // Use DATABASE_URL from .env file loaded by vitest config

  const cleanup = async () => {
    // Restore original environment
    process.env = originalEnv;
  };

  const reset = async () => {
    // Reset to test state without full cleanup
    process.env.NODE_ENV = 'test';
  };

  return {
    cleanup,
    reset,
  };
}

async function cleanupTestEnvironment(): Promise<void> {
  // No cleanup needed - vitest handles environment variables
}

describe('file-tracking-helper integration', () => {
  let testChatId: string;
  let testUserId: string;
  let testMessageId: string;
  let testOrganizationId: string;
  let testMetricFileId1: string;
  let testMetricFileId2: string;
  let testDataSourceId: string;

  beforeAll(async () => {
    await setupTestEnvironment();

    // Create test data
    const { chatId, userId, organizationId } = await createTestChat();
    testChatId = chatId;
    testUserId = userId;
    testOrganizationId = organizationId;

    const messageId = await createTestMessage(testChatId, testUserId, {
      requestMessage: 'Test message for file tracking',
    });
    testMessageId = messageId;

    // Create a test data source
    const { dataSourceId } = await createTestDataSource({
      organizationId: testOrganizationId,
      createdBy: testUserId,
      name: 'Test Data Source for File Tracking',
    });
    testDataSourceId = dataSourceId;

    // Create test metric files that we can reference
    testMetricFileId1 = randomUUID();
    testMetricFileId2 = randomUUID();

    await db.insert(metricFiles).values([
      {
        id: testMetricFileId1,
        name: 'Test Metric 1',
        fileName: 'test-metric-1.yml',
        content: { name: 'Test Metric 1', sql: 'SELECT 1' },
        organizationId: testOrganizationId,
        createdBy: testUserId,
        dataSourceId: testDataSourceId,
      },
      {
        id: testMetricFileId2,
        name: 'Test Metric 2',
        fileName: 'test-metric-2.yml',
        content: { name: 'Test Metric 2', sql: 'SELECT 2' },
        organizationId: testOrganizationId,
        createdBy: testUserId,
        dataSourceId: testDataSourceId,
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup test data
    // First, cleanup any message-to-file associations
    await db.delete(messagesToFiles).where(eq(messagesToFiles.messageId, testMessageId));

    // Then cleanup the metric files
    await db.delete(metricFiles).where(eq(metricFiles.id, testMetricFileId1));
    await db.delete(metricFiles).where(eq(metricFiles.id, testMetricFileId2));

    // Cleanup data source
    await db.delete(dataSources).where(eq(dataSources.id, testDataSourceId));

    // Finally cleanup messages and chats
    await cleanupTestMessages([testMessageId]);
    await cleanupTestChats([testChatId]);
    await cleanupTestEnvironment();
  });

  it('should track file associations successfully', async () => {
    const testFiles = [
      { id: testMetricFileId1, version: 1 },
      { id: testMetricFileId2, version: 2 },
    ];

    await trackFileAssociations({
      messageId: testMessageId,
      files: testFiles,
    });

    // Verify records were created
    const records = await db
      .select()
      .from(messagesToFiles)
      .where(eq(messagesToFiles.messageId, testMessageId));

    expect(records).toHaveLength(2);

    const record1 = records.find((r) => r.fileId === testMetricFileId1);
    const record2 = records.find((r) => r.fileId === testMetricFileId2);

    expect(record1).toBeDefined();
    expect(record1).toMatchObject({
      messageId: testMessageId,
      fileId: testMetricFileId1,
      versionNumber: 1,
      isDuplicate: false,
    });

    expect(record2).toBeDefined();
    expect(record2).toMatchObject({
      messageId: testMessageId,
      fileId: testMetricFileId2,
      versionNumber: 2,
      isDuplicate: false,
    });
  });

  it('should handle empty files array gracefully', async () => {
    await expect(
      trackFileAssociations({
        messageId: testMessageId,
        files: [],
      })
    ).resolves.not.toThrow();

    // The test should not create any new records
  });

  it('should handle missing messageId gracefully', async () => {
    await expect(
      trackFileAssociations({
        messageId: '',
        files: [{ id: testMetricFileId1, version: 1 }],
      })
    ).resolves.not.toThrow();

    // The function should return early and not attempt to query the database
  });

  it('should use default version number when not provided', async () => {
    // Create a new metric file for this test
    const testMetricFileId3 = randomUUID();
    await db.insert(metricFiles).values({
      id: testMetricFileId3,
      name: 'Test Metric 3',
      fileName: 'test-metric-3.yml',
      content: { name: 'Test Metric 3', sql: 'SELECT 3' },
      organizationId: testOrganizationId,
      createdBy: testUserId,
      dataSourceId: testDataSourceId,
    });

    const fileWithoutVersion = { id: testMetricFileId3 };

    await trackFileAssociations({
      messageId: testMessageId,
      files: [fileWithoutVersion],
    });

    // Verify record was created with default version
    const records = await db
      .select()
      .from(messagesToFiles)
      .where(eq(messagesToFiles.messageId, testMessageId));

    const matchingRecord = records.find((r) => r.fileId === testMetricFileId3);
    expect(matchingRecord).toBeDefined();
    expect(matchingRecord?.versionNumber).toBe(1);

    // Cleanup
    await db.delete(messagesToFiles).where(eq(messagesToFiles.fileId, testMetricFileId3));
    await db.delete(metricFiles).where(eq(metricFiles.id, testMetricFileId3));
  });

  it('should not throw on database errors', async () => {
    // Test with a non-existent messageId (which might cause FK constraint error)
    // But our implementation catches and logs errors without throwing
    const nonExistentMessageId = randomUUID();

    await expect(
      trackFileAssociations({
        messageId: nonExistentMessageId,
        files: [{ id: testMetricFileId1, version: 1 }],
      })
    ).resolves.not.toThrow();
  });
});
