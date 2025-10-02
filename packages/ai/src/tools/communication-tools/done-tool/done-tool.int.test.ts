import { randomUUID } from 'node:crypto';
import { db } from '@buster/database/connection';
import { updateMessageEntries } from '@buster/database/queries';
import { messages } from '@buster/database/schema';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import { and, eq, isNull } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';
import { createDoneToolDelta } from './done-tool-delta';
import { createDoneToolFinish } from './done-tool-finish';
import { createDoneToolStart } from './done-tool-start';

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
      chatId: testChatId,
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
        assetsToReturn: [],
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
        assetsToReturn: [],
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
        input: { assetsToReturn: [], finalResponse: 'First response' },
        toolCallId: toolCallId1,
        messages: [],
      });

      await startHandler2({ toolCallId: toolCallId2, messages: [] });
      await finishHandler2({
        input: { assetsToReturn: [], finalResponse: 'Second response' },
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
        chatId: testChatId,
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
        chatId: testChatId,
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
