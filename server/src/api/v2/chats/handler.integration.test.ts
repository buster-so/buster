import { describe, expect, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { User } from '@supabase/supabase-js';
import { db, eq, chats, messages } from '@buster/database';
import { 
  createTestChat, 
  createTestUser, 
  createTestOrganization,
  cleanupTestChats,
  cleanupTestMessages,
  withTestEnv
} from '@buster/test-utils';
import { tasks } from '@trigger.dev/sdk/v3';
import chatRoutes from './index';
import type { ChatWithMessages } from '../../../types/chat.types';

/**
 * Integration tests for chat creation endpoint
 * These tests use real database connections and test the full flow
 */
describe('Chat Handler Integration Tests', () => {
  let app: Hono;
  let testUserId: string;
  let testOrgId: string;
  let mockUser: User;

  beforeAll(async () => {
    // Create test organization and user
    testOrgId = await createTestOrganization();
    testUserId = await createTestUser(testOrgId);
    
    mockUser = {
      id: testUserId,
      email: 'test@example.com',
      user_metadata: {
        organization_id: testOrgId,
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;

    // Setup Hono app
    app = new Hono();
    app.use('*', async (c, next) => {
      c.set('supabaseUser', mockUser);
      await next();
    });
    app.route('/chats', chatRoutes);
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestChats(testUserId);
  });

  beforeEach(async () => {
    // Clear any existing test messages for the user's chats
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.createdBy, testUserId));
    
    for (const chat of userChats) {
      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id));
      
      const messageIds = chatMessages.map(m => m.id);
      if (messageIds.length > 0) {
        await cleanupTestMessages(messageIds);
      }
    }
  });

  async function makeRequest(body: any) {
    const request = new Request('http://localhost/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return app.request(request);
  }

  it('should create a new chat with prompt and verify database state', async () => {
    await withTestEnv(async () => {
      const prompt = 'What are our top revenue metrics?';
      
      const response = await makeRequest({ prompt });
      
      expect(response.status).toBe(200);
      const chatResponse = await response.json() as ChatWithMessages;
      
      // Verify response structure
      expect(chatResponse).toMatchObject({
        id: expect.any(String),
        title: prompt,
        is_favorited: false,
        message_ids: expect.arrayContaining([expect.any(String)]),
        messages: expect.any(Object),
        created_by: testUserId,
        created_by_id: testUserId,
        created_by_name: 'Test User',
        publicly_accessible: false,
        permission: 'owner',
      });

      // Verify database state - chat was created
      const [createdChat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatResponse.id));
      
      expect(createdChat).toBeDefined();
      expect(createdChat.title).toBe(prompt);
      expect(createdChat.organizationId).toBe(testOrgId);
      expect(createdChat.createdBy).toBe(testUserId);

      // Verify message was created
      const [createdMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatResponse.id));
      
      expect(createdMessage).toBeDefined();
      expect(createdMessage.requestMessage).toBe(prompt);
      expect(createdMessage.createdBy).toBe(testUserId);
      
      // Verify message is in response
      const messageId = chatResponse.message_ids[0];
      expect(chatResponse.messages[messageId]).toMatchObject({
        role: 'user',
        request_message: {
          request: prompt,
          sender_id: testUserId,
          sender_name: 'Test User',
        },
      });
    });
  });

  it('should add message to existing chat and maintain order', async () => {
    await withTestEnv(async () => {
      // Create initial chat
      const { chatId } = await createTestChat(testOrgId, testUserId);
      
      // Add first message
      const firstPrompt = 'First question';
      const firstResponse = await makeRequest({ 
        chat_id: chatId, 
        prompt: firstPrompt 
      });
      
      expect(firstResponse.status).toBe(200);
      const firstChat = await firstResponse.json() as ChatWithMessages;
      
      // Add second message
      const secondPrompt = 'Follow-up question';
      const secondResponse = await makeRequest({ 
        chat_id: chatId, 
        prompt: secondPrompt 
      });
      
      expect(secondResponse.status).toBe(200);
      const secondChat = await secondResponse.json() as ChatWithMessages;
      
      // Verify both messages are in the response
      expect(secondChat.message_ids.length).toBe(2);
      
      // Verify database has both messages
      const dbMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt);
      
      expect(dbMessages.length).toBe(2);
      expect(dbMessages[0].requestMessage).toBe(firstPrompt);
      expect(dbMessages[1].requestMessage).toBe(secondPrompt);
    });
  });

  it('should handle concurrent message creation to same chat', async () => {
    await withTestEnv(async () => {
      const { chatId } = await createTestChat(testOrgId, testUserId);
      
      // Create multiple messages concurrently
      const prompts = [
        'Concurrent message 1',
        'Concurrent message 2',
        'Concurrent message 3',
      ];
      
      const responses = await Promise.all(
        prompts.map(prompt => makeRequest({ chat_id: chatId, prompt }))
      );
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Verify all messages were created in database
      const dbMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId));
      
      expect(dbMessages.length).toBe(3);
      const dbPrompts = dbMessages.map(m => m.requestMessage).sort();
      expect(dbPrompts).toEqual(prompts.sort());
    });
  });

  it('should handle permission denial for unauthorized chat access', async () => {
    await withTestEnv(async () => {
      // Create chat with different user
      const otherUserId = await createTestUser(testOrgId);
      const { chatId } = await createTestChat(testOrgId, otherUserId);
      
      // Try to add message as different user
      const response = await makeRequest({
        chat_id: chatId,
        prompt: 'Unauthorized access attempt',
      });
      
      expect(response.status).toBe(403);
      const error = await response.json();
      expect(error.message).toContain('permission');
      
      // Verify no message was created
      const dbMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId));
      
      expect(dbMessages.length).toBe(0);
    });
  });

  it('should handle non-existent chat gracefully', async () => {
    await withTestEnv(async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await makeRequest({
        chat_id: fakeId,
        prompt: 'Message to non-existent chat',
      });
      
      expect(response.status).toBe(404);
      const error = await response.json();
      expect(error.message).toContain('not found');
    });
  });

  it('should handle database errors gracefully', async () => {
    await withTestEnv(async () => {
      // Create a user without organization (invalid state)
      const invalidUser = {
        ...mockUser,
        user_metadata: { ...mockUser.user_metadata, organization_id: undefined },
      };
      
      const appWithInvalidUser = new Hono();
      appWithInvalidUser.use('*', async (c, next) => {
        c.set('supabaseUser', invalidUser);
        await next();
      });
      appWithInvalidUser.route('/chats', chatRoutes);
      
      const request = new Request('http://localhost/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Test' }),
      });
      
      const response = await appWithInvalidUser.request(request);
      
      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.message).toContain('organization');
    });
  });

  it('should validate trigger task is called with correct payload', async () => {
    await withTestEnv(async () => {
      // Mock trigger to verify it's called
      const triggerSpy = vi.spyOn(tasks, 'trigger');
      
      const response = await makeRequest({
        prompt: 'Test trigger integration',
      });
      
      expect(response.status).toBe(200);
      const chat = await response.json() as ChatWithMessages;
      
      // Verify trigger was called with correct message_id
      expect(triggerSpy).toHaveBeenCalledWith('analyst-agent-task', {
        message_id: chat.message_ids[0],
      });
      
      triggerSpy.mockRestore();
    });
  });

  it('should handle trigger failures without failing the request', async () => {
    await withTestEnv(async () => {
      // Mock trigger to throw error
      const triggerSpy = vi.spyOn(tasks, 'trigger').mockRejectedValue(
        new Error('Trigger service unavailable')
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = await makeRequest({
        prompt: 'Test with trigger failure',
      });
      
      // Request should still succeed
      expect(response.status).toBe(200);
      const chat = await response.json() as ChatWithMessages;
      
      // Verify chat and message were created despite trigger failure
      const [dbChat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chat.id));
      
      expect(dbChat).toBeDefined();
      
      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to trigger analyst agent task:',
        expect.any(Error)
      );
      
      triggerSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  it('should handle asset-based chat creation', async () => {
    await withTestEnv(async () => {
      // Mock generateAssetMessages to return test data
      const generateAssetMessagesSpy = vi.fn().mockResolvedValue([
        {
          id: 'asset-msg-1',
          chatId: 'test-chat',
          createdBy: testUserId,
          requestMessage: 'Let me analyze this metric for you.',
          responseMessages: {},
          reasoning: {},
          title: 'Asset analysis',
          rawLlmMessages: {},
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          finalReasoningMessage: null,
          feedback: null,
        },
      ]);
      
      // Temporarily mock the import
      vi.doMock('@buster/database', async () => {
        const actual = await vi.importActual('@buster/database');
        return {
          ...actual,
          generateAssetMessages: generateAssetMessagesSpy,
        };
      });
      
      const response = await makeRequest({
        asset_id: '123e4567-e89b-12d3-a456-426614174000',
        asset_type: 'metric_file',
      });
      
      expect(response.status).toBe(200);
      const chat = await response.json() as ChatWithMessages;
      
      // Verify asset messages were added
      expect(chat.message_ids).toContain('asset-msg-1');
      
      vi.doUnmock('@buster/database');
    });
  });
});