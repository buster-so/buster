import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createTestChat,
  cleanupTestChats,
  createTestMessage,
  cleanupTestMessages,
  createTestDataSource,
} from '@buster/test-utils';
import { trackFileAssociations } from './file-tracking-helper';
import { db, messagesToFiles, eq, metricFiles, dataSources } from '@buster/database';
import { randomUUID } from 'node:crypto';

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
    
    const messageId = await createTestMessage(
      testChatId,
      testUserId,
      {
        requestMessage: 'Test message for file tracking'
      }
    );
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
    
    const record1 = records.find(r => r.fileId === testMetricFileId1);
    const record2 = records.find(r => r.fileId === testMetricFileId2);
    
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

    const matchingRecord = records.find(r => r.fileId === testMetricFileId3);
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