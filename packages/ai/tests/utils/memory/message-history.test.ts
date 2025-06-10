import type { CoreMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import {
  extractMessageHistory,
  getAllToolsUsed,
  getConversationSummary,
  getLastToolUsed,
  isToolCallOnlyMessage,
  unbundleMessages,
} from '../../../src/utils/memory/message-history';

describe('Message History Utilities', () => {
  describe('Message Format Validation', () => {
    test('should handle properly formatted unbundled messages', () => {
      const properMessages: CoreMessage[] = [
        {
          role: 'user',
          content: 'What are our top 5 products by revenue in the last quarter?',
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'sequentialThinking',
              toolCallId: 'toolu_01Um5qidhhwormgMx9mASBv2',
              args: {
                thought: 'I need to analyze the request...',
                isRevision: false,
                thoughtNumber: 1,
                totalThoughts: 1,
                needsMoreThoughts: false,
                nextThoughtNeeded: false,
              },
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
              toolCallId: 'toolu_01Um5qidhhwormgMx9mASBv2',
            },
          ],
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'submitThoughts',
              toolCallId: 'toolu_01LA17JT7CUATsE4YX2Dy8oz',
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
              toolCallId: 'toolu_01LA17JT7CUATsE4YX2Dy8oz',
            },
          ],
        },
      ];

      const processed = extractMessageHistory(properMessages);
      expect(processed).toHaveLength(5);
      expect(processed[0].role).toBe('user');
      expect(processed[1].role).toBe('assistant');
      expect(processed[2].role).toBe('tool');
      expect(processed[3].role).toBe('assistant');
      expect(processed[4].role).toBe('tool');
    });

    test('should unbundle messages that have mixed content', () => {
      const bundledMessages: CoreMessage[] = [
        {
          role: 'user',
          content: 'What are our top 5 products?',
        },
        {
          role: 'assistant',
          id: 'msg-123',
          content: [
            'Let me analyze that for you.',
            {
              type: 'tool-call',
              toolName: 'analyzeData',
              toolCallId: 'tool-1',
              args: { query: 'top 5 products' },
            },
            {
              type: 'tool-call',
              toolName: 'generateChart',
              toolCallId: 'tool-2',
              args: { type: 'bar' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              result: { data: 'product data' },
              toolName: 'analyzeData',
              toolCallId: 'tool-1',
            },
          ],
        },
      ];

      const unbundled = unbundleMessages(bundledMessages);

      // Should have: user, assistant (text), assistant (tool-1), assistant (tool-2), tool result
      expect(unbundled).toHaveLength(5);
      expect(unbundled[0].role).toBe('user');
      expect(unbundled[1].role).toBe('assistant');
      expect(unbundled[1].content).toBe('Let me analyze that for you.');
      expect(unbundled[2].role).toBe('assistant');
      expect(isToolCallOnlyMessage(unbundled[2])).toBe(true);
      expect(unbundled[3].role).toBe('assistant');
      expect(isToolCallOnlyMessage(unbundled[3])).toBe(true);
      expect(unbundled[4].role).toBe('tool');
    });
  });

  describe('Tool Detection', () => {
    test('should correctly identify the last tool used', () => {
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: 'Analyze this data',
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'sequentialThinking',
              toolCallId: 'tool-1',
              args: {},
            },
          ],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', result: {}, toolName: 'sequentialThinking', toolCallId: 'tool-1' }],
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
          content: [{ type: 'tool-result', result: {}, toolName: 'submitThoughts', toolCallId: 'tool-2' }],
        },
      ];

      const lastTool = getLastToolUsed(messages);
      expect(lastTool).toBe('submitThoughts');
    });

    test('should get all tools used in conversation', () => {
      const messages: CoreMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'searchDataCatalog',
              toolCallId: 'tool-1',
              args: {},
            },
          ],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', result: {}, toolName: 'searchDataCatalog', toolCallId: 'tool-1' }],
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'analyzeData',
              toolCallId: 'tool-2',
              args: {},
            },
          ],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', result: {}, toolName: 'analyzeData', toolCallId: 'tool-2' }],
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'searchDataCatalog',
              toolCallId: 'tool-3',
              args: {},
            },
          ],
        },
      ];

      const tools = getAllToolsUsed(messages);
      expect(tools).toContain('searchDataCatalog');
      expect(tools).toContain('analyzeData');
      expect(tools).toHaveLength(2); // Should not duplicate
    });
  });

  describe('Conversation Summary', () => {
    test('should correctly summarize conversation with proper message structure', () => {
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: 'First question',
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'think',
              toolCallId: 'tool-1',
              args: {},
            },
          ],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', result: {}, toolName: 'think', toolCallId: 'tool-1' }],
        },
        {
          role: 'assistant',
          content: 'Here is my response',
        },
        {
          role: 'user',
          content: 'Follow up question',
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'analyze',
              toolCallId: 'tool-2',
              args: {},
            },
          ],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', result: {}, toolName: 'analyze', toolCallId: 'tool-2' }],
        },
      ];

      const summary = getConversationSummary(messages);
      expect(summary.userMessages).toBe(2);
      expect(summary.assistantMessages).toBe(3); // 2 with tool calls, 1 with text
      expect(summary.toolCalls).toBe(2);
      expect(summary.toolResults).toBe(2);
      expect(summary.toolsUsed).toEqual(['think', 'analyze']);
    });
  });

  describe('Tool Call Only Messages', () => {
    test('should identify messages that only contain tool calls', () => {
      const toolCallOnlyMessage: CoreMessage = {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolName: 'submitThoughts',
            toolCallId: 'tool-1',
            args: {},
          },
        ],
      };

      const mixedMessage: CoreMessage = {
        role: 'assistant',
        content: [
          'Here is some text',
          {
            type: 'tool-call',
            toolName: 'submitThoughts',
            toolCallId: 'tool-1',
            args: {},
          },
        ],
      };

      const textOnlyMessage: CoreMessage = {
        role: 'assistant',
        content: 'Just text content',
      };

      expect(isToolCallOnlyMessage(toolCallOnlyMessage)).toBe(true);
      expect(isToolCallOnlyMessage(mixedMessage)).toBe(false);
      expect(isToolCallOnlyMessage(textOnlyMessage)).toBe(false);
    });
  });

  describe('Real-world Conversation Pattern', () => {
    test('should handle a complete conversation flow with multiple tool calls', () => {
      const conversation: CoreMessage[] = [
        {
          role: 'user',
          content: 'What are our top 5 products by revenue in the last quarter?',
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'sequentialThinking',
              toolCallId: 'toolu_01Um5qidhhwormgMx9mASBv2',
              args: {
                thought: 'Analyzing the request for top 5 products...',
              },
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
              toolCallId: 'toolu_01Um5qidhhwormgMx9mASBv2',
            },
          ],
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'submitThoughts',
              toolCallId: 'toolu_01LA17JT7CUATsE4YX2Dy8oz',
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
              toolCallId: 'toolu_01LA17JT7CUATsE4YX2Dy8oz',
            },
          ],
        },
        {
          role: 'user',
          content: 'Can you show me the year-over-year growth for these top products?',
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'sequentialThinking',
              toolCallId: 'toolu_01KkYSiZru6J8fvYdA9puoFX',
              args: {
                thought: 'Now analyzing year-over-year growth...',
              },
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
              toolCallId: 'toolu_01KkYSiZru6J8fvYdA9puoFX',
            },
          ],
        },
      ];

      // Verify the pattern is correct
      expect(conversation[0].role).toBe('user');
      expect(conversation[1].role).toBe('assistant');
      expect(isToolCallOnlyMessage(conversation[1])).toBe(true);
      expect(conversation[2].role).toBe('tool');
      expect(conversation[3].role).toBe('assistant');
      expect(isToolCallOnlyMessage(conversation[3])).toBe(true);
      expect(conversation[4].role).toBe('tool');
      expect(conversation[5].role).toBe('user');
      expect(conversation[6].role).toBe('assistant');
      expect(conversation[7].role).toBe('tool');

      // Verify extraction preserves the structure (but may add IDs)
      const extracted = extractMessageHistory(conversation);
      expect(extracted).toHaveLength(8);
      
      // Check the roles and structure are preserved
      for (let i = 0; i < conversation.length; i++) {
        expect(extracted[i].role).toBe(conversation[i].role);
        expect(extracted[i].content).toEqual(conversation[i].content);
      }

      // Verify summary is correct
      const summary = getConversationSummary(conversation);
      expect(summary.userMessages).toBe(2);
      expect(summary.assistantMessages).toBe(3);
      expect(summary.toolCalls).toBe(3);
      expect(summary.toolResults).toBe(3);
      expect(summary.toolsUsed).toEqual(['sequentialThinking', 'submitThoughts']);
    });
  });
});