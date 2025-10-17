import { db } from '@buster/database/connection';
import type { User } from '@buster/database/queries';
import {
  chats,
  dataSources,
  messages,
  organizations,
  users,
  usersToOrganizations,
} from '@buster/database/schema';
import { and, eq, gte, isNotNull, isNull } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { handleExistingChat, softDeleteMessagesFromPoint } from './chat-helpers';

describe('Chat Message Redo Integration Tests', () => {
  // Test data IDs
  const testOrgId = '00000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000002';
  const testChatId = '00000000-0000-0000-0000-000000000003';
  const testDataSourceId = '00000000-0000-0000-0000-000000000004';

  // Message IDs for testing
  const message1Id = '00000000-0000-0000-0000-000000000010';
  const message2Id = '00000000-0000-0000-0000-000000000011';
  const message3Id = '00000000-0000-0000-0000-000000000012';
  const message4Id = '00000000-0000-0000-0000-000000000013';

  let testUser: User;

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanup();

    // Create test organization
    await db.insert(organizations).values({
      id: testOrgId,
      name: 'Test Organization for Redo',
      restrictNewUserInvitations: false,
      defaultRole: 'workspace_admin',
      domains: [],
    });

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        id: testUserId,
        email: 'test-redo@example.com',
        name: 'Test User Redo',
        avatarUrl: null,
      })
      .returning();

    testUser = user!;

    // Link user to organization
    await db.insert(usersToOrganizations).values({
      userId: testUserId,
      organizationId: testOrgId,
      role: 'workspace_admin',
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    // Create test data source
    await db.insert(dataSources).values({
      id: testDataSourceId,
      organizationId: testOrgId,
      name: 'Test Data Source',
      type: 'postgresql',
      secretId: '00000000-0000-0000-0000-000000000099', // dummy secret ID
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    // Create test chat
    await db.insert(chats).values({
      id: testChatId,
      title: 'Test Chat for Redo',
      organizationId: testOrgId,
      createdBy: testUserId,
      updatedBy: testUserId,
      publiclyAccessible: false,
    });

    // Create test messages with specific timestamps to ensure order
    const baseTime = new Date('2024-01-01T10:00:00Z');

    await db.insert(messages).values([
      {
        id: message1Id,
        chatId: testChatId,
        createdBy: testUserId,
        requestMessage: 'First message',
        responseMessages: {},
        reasoning: {},
        title: 'First message',
        rawLlmMessages: {},
        isCompleted: true,
        createdAt: new Date(baseTime.getTime()).toISOString(),
        updatedAt: new Date(baseTime.getTime()).toISOString(),
      },
      {
        id: message2Id,
        chatId: testChatId,
        createdBy: testUserId,
        requestMessage: 'Second message',
        responseMessages: {},
        reasoning: {},
        title: 'Second message',
        rawLlmMessages: {},
        isCompleted: true,
        createdAt: new Date(baseTime.getTime() + 1000).toISOString(),
        updatedAt: new Date(baseTime.getTime() + 1000).toISOString(),
      },
      {
        id: message3Id,
        chatId: testChatId,
        createdBy: testUserId,
        requestMessage: 'Third message',
        responseMessages: {},
        reasoning: {},
        title: 'Third message',
        rawLlmMessages: {},
        isCompleted: true,
        createdAt: new Date(baseTime.getTime() + 2000).toISOString(),
        updatedAt: new Date(baseTime.getTime() + 2000).toISOString(),
      },
      {
        id: message4Id,
        chatId: testChatId,
        createdBy: testUserId,
        requestMessage: 'Fourth message',
        responseMessages: {},
        reasoning: {},
        title: 'Fourth message',
        rawLlmMessages: {},
        isCompleted: true,
        createdAt: new Date(baseTime.getTime() + 3000).toISOString(),
        updatedAt: new Date(baseTime.getTime() + 3000).toISOString(),
      },
    ]);
  });

  afterAll(async () => {
    await cleanup();
  });

  async function cleanup() {
    // Delete in reverse order of foreign key dependencies
    await db.delete(messages).where(eq(messages.chatId, testChatId));
    await db.delete(chats).where(eq(chats.id, testChatId));
    await db.delete(usersToOrganizations).where(eq(usersToOrganizations.userId, testUserId));
    await db.delete(dataSources).where(eq(dataSources.id, testDataSourceId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(organizations).where(eq(organizations.id, testOrgId));
  }

  describe('softDeleteMessagesFromPoint', () => {
    it('should soft delete the specified message and all subsequent messages', async () => {
      // Soft delete from message 2 (should delete messages 2, 3 and 4, but NOT message 1)
      await softDeleteMessagesFromPoint(message2Id);

      // Check that message 1 is NOT deleted
      const activeMessages = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, testChatId), isNull(messages.deletedAt)));

      expect(activeMessages).toHaveLength(1);
      expect(activeMessages[0]?.id).toBe(message1Id);

      // Check that messages 2, 3 and 4 ARE deleted
      const deletedMessages = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, testChatId), isNotNull(messages.deletedAt)));

      expect(deletedMessages).toHaveLength(3);
      expect(deletedMessages.map((m) => m.id).sort()).toEqual(
        [message2Id, message3Id, message4Id].sort()
      );
    });

    it('should throw error for non-existent message', async () => {
      const fakeMessageId = '00000000-0000-0000-0000-999999999999';

      await expect(softDeleteMessagesFromPoint(fakeMessageId)).rejects.toThrow(
        `Message not found: ${fakeMessageId}`
      );
    });

    it('should handle edge case of deleting the last message only', async () => {
      // First, restore all messages for this test
      await db.update(messages).set({ deletedAt: null }).where(eq(messages.chatId, testChatId));

      // Delete from the last message (should only delete message 4)
      await softDeleteMessagesFromPoint(message4Id);

      // Check that messages 1, 2, 3 remain active
      const activeMessages = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, testChatId), isNull(messages.deletedAt)));

      expect(activeMessages).toHaveLength(3);
      expect(activeMessages.map((m) => m.id).sort()).toEqual(
        [message1Id, message2Id, message3Id].sort()
      );

      // Check that only message 4 is deleted
      const deletedMessages = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, testChatId), isNotNull(messages.deletedAt)));

      expect(deletedMessages).toHaveLength(1);
      expect(deletedMessages[0]?.id).toBe(message4Id);
    });
  });

  describe('handleExistingChat with redo functionality', () => {
    it('should create a new message after soft deleting from redo point', async () => {
      // Restore all messages
      await db.update(messages).set({ deletedAt: null }).where(eq(messages.chatId, testChatId));

      const newMessageId = '00000000-0000-0000-0000-000000000020';
      const newPrompt = 'New analysis from message 2';

      // Handle existing chat with redo from message 2
      const result = await handleExistingChat(
        testChatId,
        newMessageId,
        newPrompt,
        'auto',
        testUser,
        message2Id // redoFromMessageId
      );

      // Verify the result
      expect(result.chatId).toBe(testChatId);
      expect(result.messageId).toBe(newMessageId);
      expect(result.chat.id).toBe(testChatId);

      // Check that the new message was created
      const newMessage = await db
        .select()
        .from(messages)
        .where(eq(messages.id, newMessageId))
        .limit(1);

      expect(newMessage[0]).toBeDefined();
      expect(newMessage[0]?.requestMessage).toBe(newPrompt);
      expect(newMessage[0]?.deletedAt).toBeNull();

      // Verify messages 2, 3 and 4 are soft deleted
      const deletedMessages = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, testChatId), isNotNull(messages.deletedAt)));

      expect(deletedMessages.map((m) => m.id).sort()).toEqual(
        [message2Id, message3Id, message4Id].sort()
      );

      // Verify the chat response includes message 1 and the new message (replacement for message 2)
      const messageIds = result.chat.message_ids;
      expect(messageIds).toContain(message1Id);
      expect(messageIds).toContain(newMessageId);
      expect(messageIds).not.toContain(message2Id);
      expect(messageIds).not.toContain(message3Id);
      expect(messageIds).not.toContain(message4Id);
    });

    it('should handle redo from the first message', async () => {
      // First ensure we have a clean state - delete all existing messages
      await db.delete(messages).where(eq(messages.chatId, testChatId));

      // Recreate the test messages
      const baseTime = new Date('2024-01-01T10:00:00Z');
      await db.insert(messages).values([
        {
          id: message1Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'First message',
          responseMessages: {},
          reasoning: {},
          title: 'First message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime()).toISOString(),
          updatedAt: new Date(baseTime.getTime()).toISOString(),
        },
        {
          id: message2Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Second message',
          responseMessages: {},
          reasoning: {},
          title: 'Second message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 1000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 1000).toISOString(),
        },
        {
          id: message3Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Third message',
          responseMessages: {},
          reasoning: {},
          title: 'Third message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 2000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 2000).toISOString(),
        },
        {
          id: message4Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Fourth message',
          responseMessages: {},
          reasoning: {},
          title: 'Fourth message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 3000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 3000).toISOString(),
        },
      ]);

      const newMessageId = '00000000-0000-0000-0000-000000000021';
      const newPrompt = 'Complete redo from the beginning';

      const result = await handleExistingChat(
        testChatId,
        newMessageId,
        newPrompt,
        'auto',
        testUser,
        message1Id // redo from the very first message
      );

      // All original messages should be deleted
      const deletedMessages = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, testChatId), isNotNull(messages.deletedAt)));

      expect(deletedMessages).toHaveLength(4);

      // Only the new message should be active
      const activeMessages = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, testChatId), isNull(messages.deletedAt)));

      expect(activeMessages).toHaveLength(1);
      expect(activeMessages[0]?.id).toBe(newMessageId);
      expect(activeMessages[0]?.requestMessage).toBe(newPrompt);
    });

    it('should work correctly when there are already some deleted messages', async () => {
      // First ensure we have a clean state - delete all existing messages
      await db.delete(messages).where(eq(messages.chatId, testChatId));

      // Recreate the test messages
      const baseTime = new Date('2024-01-01T10:00:00Z');
      await db.insert(messages).values([
        {
          id: message1Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'First message',
          responseMessages: {},
          reasoning: {},
          title: 'First message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime()).toISOString(),
          updatedAt: new Date(baseTime.getTime()).toISOString(),
        },
        {
          id: message2Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Second message',
          responseMessages: {},
          reasoning: {},
          title: 'Second message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 1000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 1000).toISOString(),
        },
        {
          id: message3Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Third message',
          responseMessages: {},
          reasoning: {},
          title: 'Third message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 2000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 2000).toISOString(),
        },
        {
          id: message4Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Fourth message',
          responseMessages: {},
          reasoning: {},
          title: 'Fourth message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 3000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 3000).toISOString(),
        },
      ]);

      // Setup: Soft delete message 4 first
      await db
        .update(messages)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(messages.id, message4Id));

      const newMessageId = '00000000-0000-0000-0000-000000000022';
      const newPrompt = 'Redo with pre-existing deleted message';

      // Redo from message 2
      const result = await handleExistingChat(
        testChatId,
        newMessageId,
        newPrompt,
        'auto',
        testUser,
        message2Id
      );

      // Verify messages 2, 3 are now also deleted (4 was already deleted)
      const deletedMessages = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, testChatId), isNotNull(messages.deletedAt)));

      expect(deletedMessages).toHaveLength(3);

      // Verify only message 1 and the new message are active
      const activeMessages = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, testChatId), isNull(messages.deletedAt)))
        .orderBy(messages.createdAt);

      expect(activeMessages).toHaveLength(2);
      expect(activeMessages[0]?.id).toBe(message1Id);
      expect(activeMessages[1]?.id).toBe(newMessageId);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should derive chat_id from message_id when chat_id is not provided', async () => {
      // First ensure we have a clean state
      await db.delete(messages).where(eq(messages.chatId, testChatId));

      // Recreate test messages
      const baseTime = new Date('2024-01-01T10:00:00Z');
      await db.insert(messages).values([
        {
          id: message1Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'First message',
          responseMessages: {},
          reasoning: {},
          title: 'First message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime()).toISOString(),
          updatedAt: new Date(baseTime.getTime()).toISOString(),
        },
        {
          id: message2Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Second message',
          responseMessages: {},
          reasoning: {},
          title: 'Second message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 1000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 1000).toISOString(),
        },
      ]);

      // Import initializeChat to test directly
      const { initializeChat } = await import('./chat-service');

      // Call initializeChat with only message_id (no chat_id)
      const result = await initializeChat(
        {
          message_id: message2Id,
          prompt: 'Redo without providing chat_id',
        },
        testUser,
        testOrgId
      );

      // Verify it found the correct chat
      expect(result.chatId).toBe(testChatId);

      // Verify message 2 was deleted and new message created
      const allMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, testChatId))
        .orderBy(messages.createdAt);

      const activeMessages = allMessages.filter((m) => !m.deletedAt);
      const deletedMessages = allMessages.filter((m) => m.deletedAt);

      expect(activeMessages).toHaveLength(2); // message 1 and new message
      expect(deletedMessages).toHaveLength(1); // message 2
      expect(deletedMessages[0]?.id).toBe(message2Id);
    });

    it('should throw error when trying to redo from a message in a different chat', async () => {
      // Create another chat
      const anotherChatId = '00000000-0000-0000-0000-000000000005';
      const anotherMessageId = '00000000-0000-0000-0000-000000000030';

      await db.insert(chats).values({
        id: anotherChatId,
        title: 'Another Chat',
        organizationId: testOrgId,
        createdBy: testUserId,
        updatedBy: testUserId,
        publiclyAccessible: false,
      });

      await db.insert(messages).values({
        id: anotherMessageId,
        chatId: anotherChatId,
        createdBy: testUserId,
        requestMessage: 'Message in another chat',
        responseMessages: {},
        reasoning: {},
        title: 'Another message',
        rawLlmMessages: {},
        isCompleted: true,
      });

      // This should fail because the message belongs to a different chat
      // Note: The current implementation would actually soft-delete from the other chat
      // This test highlights a potential issue that should be addressed
      await expect(
        handleExistingChat(
          testChatId,
          '00000000-0000-0000-0000-000000000031',
          'This should fail',
          'auto',
          testUser,
          anotherMessageId
        )
      ).rejects.toThrow();

      // Cleanup
      await db.delete(messages).where(eq(messages.chatId, anotherChatId));
      await db.delete(chats).where(eq(chats.id, anotherChatId));
    });

    it('should handle sequential redo operations correctly', async () => {
      // First ensure we have a clean state - delete all existing messages
      await db.delete(messages).where(eq(messages.chatId, testChatId));

      // Recreate all test messages
      const baseTime = new Date('2024-01-01T10:00:00Z');
      await db.insert(messages).values([
        {
          id: message1Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'First message',
          responseMessages: {},
          reasoning: {},
          title: 'First message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime()).toISOString(),
          updatedAt: new Date(baseTime.getTime()).toISOString(),
        },
        {
          id: message2Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Second message',
          responseMessages: {},
          reasoning: {},
          title: 'Second message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 1000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 1000).toISOString(),
        },
        {
          id: message3Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Third message',
          responseMessages: {},
          reasoning: {},
          title: 'Third message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 2000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 2000).toISOString(),
        },
        {
          id: message4Id,
          chatId: testChatId,
          createdBy: testUserId,
          requestMessage: 'Fourth message',
          responseMessages: {},
          reasoning: {},
          title: 'Fourth message',
          rawLlmMessages: {},
          isCompleted: true,
          createdAt: new Date(baseTime.getTime() + 3000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 3000).toISOString(),
        },
      ]);

      const newMessageId1 = '00000000-0000-0000-0000-000000000040';
      const newMessageId2 = '00000000-0000-0000-0000-000000000041';

      // First redo from message 2
      const result1 = await handleExistingChat(
        testChatId,
        newMessageId1,
        'First redo',
        'auto',
        testUser,
        message2Id
      );
      expect(result1.messageId).toBe(newMessageId1);

      // Verify state after first redo
      let allMsgs = await db.select().from(messages).where(eq(messages.chatId, testChatId));

      let activeMessages = allMsgs.filter((m) => !m.deletedAt);
      let deletedMessages = allMsgs.filter((m) => m.deletedAt);

      expect(activeMessages).toHaveLength(2); // message1 and newMessage1
      expect(deletedMessages).toHaveLength(3); // messages 2, 3, 4

      // Second redo from the new message
      const result2 = await handleExistingChat(
        testChatId,
        newMessageId2,
        'Second redo',
        'auto',
        testUser,
        newMessageId1
      );
      expect(result2.messageId).toBe(newMessageId2);

      // Verify final state
      allMsgs = await db.select().from(messages).where(eq(messages.chatId, testChatId));

      activeMessages = allMsgs.filter((m) => !m.deletedAt);
      deletedMessages = allMsgs.filter((m) => m.deletedAt);

      expect(activeMessages).toHaveLength(2); // message1 and newMessage2
      expect(deletedMessages).toHaveLength(4); // messages 2, 3, 4, and newMessage1
    });
  });
});
