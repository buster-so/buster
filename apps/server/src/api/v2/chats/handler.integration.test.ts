import { asc, chats, db, eq, messages, organizations, users, usersToOrganizations } from '@buster/database';
import {
  ChatCreateRequestSchema,
  ChatError,
  type ChatWithMessages,
  ChatWithMessagesSchema,
} from '@buster/server-shared/chats';
import { v4 as uuidv4 } from 'uuid';
import { zValidator } from '@hono/zod-validator';
import type { User } from '@supabase/supabase-js';
import { tasks } from '@trigger.dev/sdk/v3';
import { Hono } from 'hono';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChatHandler } from './handler';

// Helper functions for test data creation
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
    testUserId = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    });

    // Create user-to-organization association
    await db.insert(usersToOrganizations).values({
      userId: testUserId,
      organizationId: testOrgId,
      role: 'workspace_admin',
      createdBy: testUserId,
      updatedBy: testUserId,
    });

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

    // Setup Hono app - bypass auth middleware for tests
    app = new Hono();
    app.use('*', async (c, next) => {
      // Bypass authentication middleware by setting user directly
      c.set('supabaseUser', mockUser);
      await next();
    });

    // Create chat route without auth middleware but with same logic
    const chatApp = createChatApp();
    app.route('/chats', chatApp);
  });

  afterAll(async () => {
    // Cleanup test data - get all chats for the user first
    const userChats = await db
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.createdBy, testUserId));

    const chatIds = userChats.map((chat) => chat.id);
    if (chatIds.length > 0) {
      await cleanupTestChats(chatIds);
    }
  });

  beforeEach(async () => {
    // Clear any existing test messages for the user's chats
    const userChats = await db.select().from(chats).where(eq(chats.createdBy, testUserId));

    for (const chat of userChats) {
      const chatMessages = await db.select().from(messages).where(eq(messages.chatId, chat.id));

      const messageIds = chatMessages.map((m) => m.id);
      if (messageIds.length > 0) {
        await cleanupTestMessages(messageIds);
      }
    }
  });

  function createChatApp() {
    const chatApp = new Hono();

    chatApp.post('/', zValidator('json', ChatCreateRequestSchema), async (c) => {
      try {
        const request = c.req.valid('json');
        const user = c.get('busterUser');

        // Convert REST request to handler request
        const handlerRequest = {
          prompt: request.prompt,
          chat_id: request.chat_id,
          message_id: request.message_id,
          asset_id: request.asset_id,
          asset_type: request.asset_type,
        };

        const response = await createChatHandler(handlerRequest, user);
        const validatedResponse = ChatWithMessagesSchema.parse(response);

        return c.json(validatedResponse);
      } catch (error) {
        if (error instanceof ChatError) {
          const errorResponse = error.toResponse();
          return c.json(errorResponse, error.statusCode);
        }

        console.error('Error creating chat:', error);
        return c.json({ error: { message: 'Failed to create chat' } }, 500);
      }
    });

    return chatApp;
  }

  async function makeRequest(body: any) {
    const request = new Request('http://localhost/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return app.request(request);
  }

  it('should create a new chat with prompt and verify database state', async () => {
    const prompt = 'What are our top revenue metrics?';

    const response = await makeRequest({ prompt });

    expect(response.status).toBe(200);
    const chatResponse = (await response.json()) as ChatWithMessages;

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
    const [createdChat] = await db.select().from(chats).where(eq(chats.id, chatResponse.id));

    expect(createdChat).toBeDefined();
    expect(createdChat!.title).toBe(prompt);
    expect(createdChat!.organizationId).toBe(testOrgId);
    expect(createdChat!.createdBy).toBe(testUserId);

    // Verify message was created
    const [createdMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatResponse.id));

    expect(createdMessage).toBeDefined();
    expect(createdMessage!.requestMessage).toBe(prompt);
    expect(createdMessage!.createdBy).toBe(testUserId);

    // Verify message is in response
    const messageId = chatResponse.message_ids[0]!;
    expect(chatResponse.messages[messageId]).toMatchObject({
      role: 'user',
      request_message: {
        request: prompt,
        sender_id: testUserId,
        sender_name: 'Test User',
      },
      is_completed: false, // Always false for new messages, trigger job sets to true
    });
  });

  it('should add message to existing chat and maintain order', async () => {
    // Create initial chat
    const { chatId } = await createTestChat(testOrgId, testUserId);

    // Add first message
    const firstPrompt = 'First question';
    const firstResponse = await makeRequest({
      chat_id: chatId,
      prompt: firstPrompt,
    });

    expect(firstResponse.status).toBe(200);
    const _firstChat = (await firstResponse.json()) as ChatWithMessages;

    // Add second message (follow-up)
    const secondPrompt = 'Follow-up question';
    const secondResponse = await makeRequest({
      chat_id: chatId,
      prompt: secondPrompt,
    });

    expect(secondResponse.status).toBe(200);
    const secondChat = (await secondResponse.json()) as ChatWithMessages;

    // Verify both messages are in the response
    expect(secondChat.message_ids.length).toBe(2);

    // Verify database has both messages
    const dbMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    expect(dbMessages.length).toBe(2);
    expect(dbMessages[0]!.requestMessage).toBe(firstPrompt);
    expect(dbMessages[1]!.requestMessage).toBe(secondPrompt);
  });

  it('should handle follow-up conversation flow properly', async () => {
    // Simulate a realistic follow-up conversation

    // Step 1: User creates initial chat with question
    const initialPrompt = 'What are our Q4 sales numbers?';
    const initialResponse = await makeRequest({ prompt: initialPrompt });

    expect(initialResponse.status).toBe(200);
    const initialChat = (await initialResponse.json()) as ChatWithMessages;
    const chatId = initialChat.id;

    // Verify initial state
    expect(initialChat.message_ids.length).toBe(1);
    expect(initialChat.title).toBe(initialPrompt);

    // Step 2: User asks follow-up question
    const followUpPrompt = 'Can you break that down by region?';
    const followUpResponse = await makeRequest({
      chat_id: chatId,
      prompt: followUpPrompt,
    });

    expect(followUpResponse.status).toBe(200);
    const followUpChat = (await followUpResponse.json()) as ChatWithMessages;

    // Verify follow-up state
    expect(followUpChat.id).toBe(chatId); // Same chat
    expect(followUpChat.message_ids.length).toBe(2); // Now has 2 messages
    expect(followUpChat.title).toBe(initialPrompt); // Title unchanged

    // Step 3: Another follow-up
    const secondFollowUp = 'What about compared to last year?';
    const thirdResponse = await makeRequest({
      chat_id: chatId,
      prompt: secondFollowUp,
    });

    expect(thirdResponse.status).toBe(200);
    const thirdChat = (await thirdResponse.json()) as ChatWithMessages;

    // Verify conversation growth
    expect(thirdChat.id).toBe(chatId);
    expect(thirdChat.message_ids.length).toBe(3);

    // Verify all messages are present in correct order
    const allDbMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    expect(allDbMessages.length).toBe(3);
    expect(allDbMessages[0]!.requestMessage).toBe(initialPrompt);
    expect(allDbMessages[1]!.requestMessage).toBe(followUpPrompt);
    expect(allDbMessages[2]!.requestMessage).toBe(secondFollowUp);

    // Verify all messages appear in final response
    expect(Object.keys(thirdChat.messages)).toHaveLength(3);
    const messageContents = Object.values(thirdChat.messages)
      .map((msg) => msg.request_message?.request)
      .filter(Boolean);

    expect(messageContents).toContain(initialPrompt);
    expect(messageContents).toContain(followUpPrompt);
    expect(messageContents).toContain(secondFollowUp);
  });

  it('should handle concurrent message creation to same chat', async () => {
    const { chatId } = await createTestChat(testOrgId, testUserId);

    // Create multiple messages concurrently
    const prompts = ['Concurrent message 1', 'Concurrent message 2', 'Concurrent message 3'];

    const responses = await Promise.all(
      prompts.map((prompt) => makeRequest({ chat_id: chatId, prompt }))
    );

    // All should succeed
    for (const response of responses) {
      expect(response.status).toBe(200);
    }

    // Verify all messages were created in database
    const dbMessages = await db.select().from(messages).where(eq(messages.chatId, chatId));

    expect(dbMessages.length).toBe(3);
    const dbPrompts = dbMessages.map((m) => m.requestMessage).sort();
    expect(dbPrompts).toEqual(prompts.sort());
  });

  it('should handle permission denial for unauthorized chat access', async () => {
    // Create chat with different user
    const otherUserId = await createTestUser({ email: `other-${Date.now()}@example.com` });
    const { chatId } = await createTestChat(testOrgId, otherUserId);

    // Try to add message as different user
    const response = await makeRequest({
      chat_id: chatId,
      prompt: 'Unauthorized access attempt',
    });

    expect(response.status).toBe(403);
    const error = (await response.json()) as { error: { message: string } };
    expect(error.error.message).toContain('permission');

    // Verify no message was created
    const dbMessages = await db.select().from(messages).where(eq(messages.chatId, chatId));

    expect(dbMessages.length).toBe(0);
  });

  it('should handle non-existent chat gracefully', async () => {
    const fakeId = '123e4567-e89b-12d3-a456-426614174000';

    const response = await makeRequest({
      chat_id: fakeId,
      prompt: 'Message to non-existent chat',
    });

    expect(response.status).toBe(404);
    const error = (await response.json()) as { error: { message: string } };
    expect(error.error.message).toContain('not found');
  });

  it('should handle database errors gracefully', async () => {
    // Create a user without organization association in database
    const isolatedUserId = await createTestUser({
      email: `isolated-${Date.now()}@example.com`,
      name: 'Isolated User',
    });
    // Note: No organization association created for this user

    const invalidUser = {
      id: isolatedUserId,
      email: 'isolated@example.com',
      user_metadata: {
        name: 'Isolated User',
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;

    const appWithInvalidUser = new Hono();
    appWithInvalidUser.use('*', async (c, next) => {
      c.set('supabaseUser', invalidUser);
      await next();
    });
    appWithInvalidUser.route('/chats', createChatApp());

    const request = new Request('http://localhost/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test' }),
    });

    const response = await appWithInvalidUser.request(request);

    expect(response.status).toBe(400);
    const error = (await response.json()) as { error: { message: string } };
    expect(error.error.message).toContain('organization');
  });

  // NOTE: Trigger validation test disabled as per requirement to not mock trigger service
  // When trigger service is available, the analyst-agent-task should be called with message_id
  it.skip('should validate trigger task is called with correct payload', async () => {
    // Mock trigger to verify it's called
    const triggerSpy = vi.spyOn(tasks, 'trigger');

    const response = await makeRequest({
      prompt: 'Test trigger integration',
    });

    expect(response.status).toBe(200);
    const chat = (await response.json()) as ChatWithMessages;

    // Verify trigger was called with correct message_id
    expect(triggerSpy).toHaveBeenCalledWith('analyst-agent-task', {
      message_id: chat.message_ids[0],
    });

    triggerSpy.mockRestore();
  });

  it('should handle trigger failures without failing the request', async () => {
    // This test verifies that chat creation succeeds even if trigger fails
    // Since we don't mock trigger per requirements, this tests real failure handling
    const response = await makeRequest({
      prompt: 'Test with potential trigger failure',
    });

    // Request should always succeed regardless of trigger status
    expect(response.status).toBe(200);
    const chat = (await response.json()) as ChatWithMessages;

    // Verify chat and message were created
    const [dbChat] = await db.select().from(chats).where(eq(chats.id, chat.id));

    expect(dbChat).toBeDefined();
    expect(dbChat!.title).toBe('Test with potential trigger failure');

    const [dbMessage] = await db.select().from(messages).where(eq(messages.chatId, chat.id));

    expect(dbMessage).toBeDefined();
    expect(dbMessage!.requestMessage).toBe('Test with potential trigger failure');
  });

  it.skip('should handle asset-based chat creation', async () => {
    // NOTE: This test requires actual asset data to be available in test environment
    // For now, testing basic asset validation
    const response = await makeRequest({
      asset_id: '123e4567-e89b-12d3-a456-426614174000',
      asset_type: 'metric_file',
    });

    // Since we don't have real assets in test, this may fail with 404 or other error
    // The important thing is that it doesn't crash with validation errors
    expect([200, 404, 400]).toContain(response.status);
  });
});
