import { randomUUID } from 'node:crypto';
import { db, messages, updateMessageEntries, chats, organizations, users } from '@buster/database';
import { v4 as uuidv4 } from 'uuid';
import type { ModelMessage, ToolCallOptions } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';
import { createDoneToolDelta } from './done-tool-delta';
import { createDoneToolFinish } from './done-tool-finish';
import { createDoneToolStart } from './done-tool-start';

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

describe('Done Tool Integration Tests', () => {
  let testChatId: string;
  let testUserId: string;
  let testOrgId: string;
  let testMessageId: string;
  let mockContext: DoneToolContext;

  beforeEach(async () => {
    // createTestChat will auto-create org and user if not provided
    // It returns chatId, organizationId, and userId
    const { chatId, organizationId, userId } = await createTestChat();
    testChatId = chatId;
    testOrgId = organizationId;
    testUserId = userId;

    testMessageId = await createTestMessage(testChatId, testUserId);

    mockContext = {
      messageId: testMessageId,
      workflowStartTime: Date.now(),
    };
  });

  afterEach(async () => {
    if (testMessageId) {
      await db
        .update(messages)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(messages.id, testMessageId));
    }
  });

  describe('Database Message Updates', () => {
    test('should create initial entries when done tool starts', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message).toBeDefined();
      expect(message?.rawLlmMessages).toBeDefined();
      expect(message?.responseMessages).toBeDefined();
    });

    test('should update entries during streaming delta', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: '',
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const deltaHandler = createDoneToolDelta(mockContext, state);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      await deltaHandler({
        inputTextDelta: '{"final_response": "Partial response',
        toolCallId,
        messages: [],
      });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message?.rawLlmMessages).toBeDefined();
      expect(state.finalResponse).toBe('Partial response');
    });

    test('should finalize entries when done tool finishes', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: '',
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const finishHandler = createDoneToolFinish(mockContext, state);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      const input: DoneToolInput = {
        finalResponse: 'This is the complete final response',
      };

      await finishHandler({ input, toolCallId, messages: [] });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message?.rawLlmMessages).toBeDefined();
      expect(message?.responseMessages).toBeDefined();
    });
  });

  describe('Complete Streaming Flow', () => {
    test('should handle full streaming lifecycle with database updates', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: '',
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const deltaHandler = createDoneToolDelta(mockContext, state);
      const finishHandler = createDoneToolFinish(mockContext, state);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      const chunks = [
        '{"final_response": "## Analysis Complete\\n\\n',
        'The following tasks have been completed:\\n',
        '- Data processing: **Success**\\n',
        '- Report generation: **Success**\\n',
        '- Validation: **Passed**\\n\\n',
        'All operations completed successfully.',
        '"}',
      ];

      for (const chunk of chunks) {
        await deltaHandler({
          inputTextDelta: chunk,
          toolCallId,
          messages: [],
        });
      }

      const expectedResponse = `## Analysis Complete

The following tasks have been completed:
- Data processing: **Success**
- Report generation: **Success**
- Validation: **Passed**

All operations completed successfully.`;

      expect(state.finalResponse).toBe(expectedResponse);

      const input: DoneToolInput = {
        finalResponse: expectedResponse,
      };

      await finishHandler({ input, toolCallId, messages: [] });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message).toBeDefined();
      expect(message?.rawLlmMessages).toBeDefined();
      expect(message?.responseMessages).toBeDefined();
    });

    test('should handle multiple done tool invocations in sequence', async () => {
      const state1: DoneToolState = {
        toolCallId: undefined,
        args: '',
        finalResponse: undefined,
      };

      const state2: DoneToolState = {
        toolCallId: undefined,
        args: '',
        finalResponse: undefined,
      };

      const startHandler1 = createDoneToolStart(mockContext, state1);
      const finishHandler1 = createDoneToolFinish(mockContext, state1);

      const startHandler2 = createDoneToolStart(mockContext, state2);
      const finishHandler2 = createDoneToolFinish(mockContext, state2);

      const toolCallId1 = randomUUID();
      const toolCallId2 = randomUUID();

      await startHandler1({ toolCallId: toolCallId1, messages: [] });
      await finishHandler1({
        input: { finalResponse: 'First response' },
        toolCallId: toolCallId1,
        messages: [],
      });

      await startHandler2({ toolCallId: toolCallId2, messages: [] });
      await finishHandler2({
        input: { finalResponse: 'Second response' },
        toolCallId: toolCallId2,
        messages: [],
      });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message?.rawLlmMessages).toBeDefined();
      if (Array.isArray(message?.rawLlmMessages)) {
        expect(message?.rawLlmMessages.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const invalidContext: DoneToolContext = {
        messageId: 'non-existent-message-id',
        workflowStartTime: Date.now(),
      };

      const state: DoneToolState = {
        toolCallId: undefined,
        args: '',
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(invalidContext, state);
      const toolCallId = randomUUID();

      await expect(startHandler({ toolCallId, messages: [] })).resolves.not.toThrow();
      expect(state.toolCallId).toBe(toolCallId);
    });

    test('should continue processing even if database update fails', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: '',
        finalResponse: undefined,
      };

      const invalidContext: DoneToolContext = {
        messageId: 'invalid-id',
        workflowStartTime: Date.now(),
      };

      const deltaHandler = createDoneToolDelta(invalidContext, state);
      const toolCallId = randomUUID();

      await expect(
        deltaHandler({
          inputTextDelta: '{"final_response": "Test"}',
          toolCallId,
          messages: [],
        })
      ).resolves.not.toThrow();

      expect(state.finalResponse).toBe('Test');
    });
  });

  describe('Message Entry Modes', () => {
    test('should use append mode for start operations', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message?.rawLlmMessages).toBeDefined();
      if (Array.isArray(message?.rawLlmMessages)) {
        const initialLength = message?.rawLlmMessages.length;

        await startHandler({ toolCallId: randomUUID(), messages: [] });

        const [updatedMessage] = await db
          .select()
          .from(messages)
          .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

        if (Array.isArray(updatedMessage?.rawLlmMessages)) {
          expect(updatedMessage?.rawLlmMessages.length).toBeGreaterThan(initialLength);
        }
      }
    });

    test('should use update mode for delta and finish operations', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: '',
        finalResponse: undefined,
      };

      await updateMessageEntries({
        messageId: testMessageId,
        rawLlmMessages: [
          {
            role: 'assistant',
            content: [{ type: 'text', text: 'Initial' }],
          },
        ],
      });

      const deltaHandler = createDoneToolDelta(mockContext, state);
      const toolCallId = randomUUID();

      await deltaHandler({
        inputTextDelta: '{"final_response": "Updated content"}',
        toolCallId,
        messages: [],
      });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message?.rawLlmMessages).toBeDefined();
    });
  });
});
