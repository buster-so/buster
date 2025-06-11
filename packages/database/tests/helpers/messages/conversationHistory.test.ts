import { cleanupTestEnvironment, setupTestEnvironment } from '@buster/test-utils';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import type { CoreMessage } from 'ai';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { getChatConversationHistory } from '../../../src/helpers/messages/chatConversationHistory';

describe('Conversation History Loading', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('should load conversation history in proper unbundled format', async () => {
    const { chatId, userId } = await createTestChat();

    // Create messages with proper unbundled structure
    const properConversationHistory: CoreMessage[] = [
      {
        role: 'user',
        content: 'What are our top 5 products by revenue?',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolName: 'sequentialThinking',
            toolCallId: 'tool-1',
            args: { thought: 'Analyzing request...' },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            result: { success: true },
            toolName: 'sequentialThinking',
            toolCallId: 'tool-1',
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolName: 'submitThoughts',
            toolCallId: 'tool-2',
            args: {},
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            result: {},
            toolName: 'submitThoughts',
            toolCallId: 'tool-2',
          },
        ],
      },
    ];

    // Create a message with this conversation history
    const messageId = await createTestMessage(chatId, userId, {
      rawLlmMessages: properConversationHistory,
      requestMessage: 'What are our top 5 products by revenue?',
    });

    // Load the conversation history
    const loadedHistory = await getChatConversationHistory({ messageId });

    // Verify the structure is preserved
    expect(loadedHistory).toHaveLength(5);
    expect(loadedHistory[0].role).toBe('user');
    expect(loadedHistory[1].role).toBe('assistant');
    expect(loadedHistory[2].role).toBe('tool');
    expect(loadedHistory[3].role).toBe('assistant');
    expect(loadedHistory[4].role).toBe('tool');

    // Verify tool calls are properly structured
    const firstAssistantMsg = loadedHistory[1];
    expect(firstAssistantMsg.content).toBeInstanceOf(Array);
    expect(firstAssistantMsg.content[0]).toHaveProperty('type', 'tool-call');
    expect(firstAssistantMsg.content[0]).toHaveProperty('toolName', 'sequentialThinking');

    // Verify tool results are properly structured
    const firstToolMsg = loadedHistory[2];
    expect(firstToolMsg.content).toBeInstanceOf(Array);
    expect(firstToolMsg.content[0]).toHaveProperty('type', 'tool-result');
    expect(firstToolMsg.content[0]).toHaveProperty('toolName', 'sequentialThinking');
  });

  test('should combine multiple messages from a chat while preserving order', async () => {
    const { chatId, userId } = await createTestChat();

    // First interaction
    const firstHistory: CoreMessage[] = [
      {
        role: 'user',
        content: 'First question',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolName: 'analyzeData',
            toolCallId: 'tool-1',
            args: {},
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            result: { data: 'result1' },
            toolName: 'analyzeData',
            toolCallId: 'tool-1',
          },
        ],
      },
    ];

    // Second interaction
    const secondHistory: CoreMessage[] = [
      {
        role: 'user',
        content: 'Follow-up question',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolName: 'generateChart',
            toolCallId: 'tool-2',
            args: {},
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            result: { chart: 'data' },
            toolName: 'generateChart',
            toolCallId: 'tool-2',
          },
        ],
      },
    ];

    // Create two messages in the same chat
    await createTestMessage(chatId, userId, {
      rawLlmMessages: firstHistory,
      requestMessage: 'First question',
    });

    const secondMessageId = await createTestMessage(chatId, userId, {
      rawLlmMessages: secondHistory,
      requestMessage: 'Follow-up question',
    });

    // Load conversation history from the second message
    const fullHistory = await getChatConversationHistory({ messageId: secondMessageId });

    // Should have all 6 messages in order
    expect(fullHistory).toHaveLength(6);

    // Verify the correct pattern
    expect(fullHistory[0].role).toBe('user');
    expect(fullHistory[0].content).toBe('First question');
    expect(fullHistory[1].role).toBe('assistant');
    expect(fullHistory[2].role).toBe('tool');
    expect(fullHistory[3].role).toBe('user');
    expect(fullHistory[3].content).toBe('Follow-up question');
    expect(fullHistory[4].role).toBe('assistant');
    expect(fullHistory[5].role).toBe('tool');

    // Verify tools are correct
    expect(fullHistory[1].content[0].toolName).toBe('analyzeData');
    expect(fullHistory[4].content[0].toolName).toBe('generateChart');
  });

  test('should handle empty conversation history', async () => {
    const { chatId, userId } = await createTestChat();

    const messageId = await createTestMessage(chatId, userId, {
      rawLlmMessages: [],
      requestMessage: 'Test message',
    });

    const history = await getChatConversationHistory({ messageId });
    expect(history).toEqual([]);
  });

  test('should maintain exact message structure without modification', async () => {
    const { chatId, userId } = await createTestChat();

    const complexHistory: CoreMessage[] = [
      {
        role: 'user',
        content: 'Complex request',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolName: 'complexTool',
            toolCallId: 'complex-1',
            args: {
              nested: {
                data: {
                  values: [1, 2, 3],
                  config: { mode: 'advanced' },
                },
              },
            },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            result: {
              complex: {
                output: {
                  data: 'processed',
                  metadata: { timestamp: '2024-01-01' },
                },
              },
            },
            toolName: 'complexTool',
            toolCallId: 'complex-1',
          },
        ],
      },
    ];

    const messageId = await createTestMessage(chatId, userId, {
      rawLlmMessages: complexHistory,
    });

    const loaded = await getChatConversationHistory({ messageId });

    // Deep equality check - structure should be exactly preserved
    expect(loaded).toEqual(complexHistory);
  });
});
