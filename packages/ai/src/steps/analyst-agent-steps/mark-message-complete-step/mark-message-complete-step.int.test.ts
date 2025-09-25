import { db } from '@buster/database/connection';
import { chats, messages } from '@buster/database/schema';
import type { AssetType } from '@buster/database/schema-types';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
      fileType: 'dashboard_file' as AssetType,
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
      fileType: 'metric_file' as AssetType,
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
