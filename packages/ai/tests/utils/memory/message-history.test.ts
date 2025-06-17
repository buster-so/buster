import type { CoreMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import {
  extractMessageHistory,
  getAllToolsUsed,
  getConversationSummary,
  getLastToolUsed,
  isToolCallOnlyMessage,
  properlyInterleaveMessages,
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
          content: [
            {
              type: 'tool-result',
              result: {},
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
            { type: 'tool-result', result: {}, toolName: 'submitThoughts', toolCallId: 'tool-2' },
          ],
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
          content: [
            {
              type: 'tool-result',
              result: {},
              toolName: 'searchDataCatalog',
              toolCallId: 'tool-1',
            },
          ],
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
          content: [
            { type: 'tool-result', result: {}, toolName: 'analyzeData', toolCallId: 'tool-2' },
          ],
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

  describe('Sequential Message Order Preservation', () => {
    test('should preserve exact sequential order from database example', () => {
      // This is the exact structure from the user's database - already properly formatted
      const databaseMessages: CoreMessage[] = [
        {
          role: 'user',
          content: 'Who is my top customer?',
        },
        {
          id: 'msg-i1amHfpBlmzzAyug8Ef44bA5',
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'toolu_01LmHSAwa8MeggWntV8gE1fG',
              toolName: 'sequentialThinking',
              args: {
                thought:
                  'I need to address the TODO list items for this user request about finding their top customer...',
                isRevision: false,
                thoughtNumber: 1,
                totalThoughts: 2,
                needsMoreThoughts: false,
                nextThoughtNeeded: true,
              },
            },
          ],
        },
        {
          id: 'msg-ShmUEel0j2bB3OiE6Ppq3I5p',
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              result: { success: true },
              toolName: 'sequentialThinking',
              toolCallId: 'toolu_01LmHSAwa8MeggWntV8gE1fG',
            },
          ],
        },
        {
          id: 'msg-IPte9fkHKgLPlN2aSK1p3IMu',
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'toolu_015T6fk9RhcJ9AuCYDtdsQba',
              toolName: 'sequentialThinking',
              args: {
                thought: 'Since I have no database documentation provided...',
                isRevision: false,
                thoughtNumber: 2,
                totalThoughts: 3,
                needsMoreThoughts: false,
                nextThoughtNeeded: true,
              },
            },
          ],
        },
        {
          id: 'msg-5VbpdbtSO23tlSzPkGADeWAQ',
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              result: { success: true },
              toolName: 'sequentialThinking',
              toolCallId: 'toolu_015T6fk9RhcJ9AuCYDtdsQba',
            },
          ],
        },
        {
          id: 'msg-xHUaA4q3WvHmMIb6CuUG6Nzh',
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'toolu_01QtPVf5tYPydXeXWGoCKbpH',
              toolName: 'executeSql',
              args: {
                statements: [
                  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 25",
                  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name LIKE '%customer%' LIMIT 25",
                  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name LIKE '%order%' LIMIT 25",
                ],
              },
            },
          ],
        },
        {
          id: 'msg-sP5Ek2YYL7ITx9BjMHfQ7kwu',
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              result: {
                results: [
                  /* ... */
                ],
              },
              toolName: 'executeSql',
              toolCallId: 'toolu_01QtPVf5tYPydXeXWGoCKbpH',
            },
          ],
        },
      ];

      // Extract message history should NOT modify the structure
      const extracted = extractMessageHistory(databaseMessages);

      // Should be exactly the same
      expect(extracted).toEqual(databaseMessages);
      expect(extracted).toHaveLength(7);

      // Verify the sequential pattern is preserved
      expect(extracted[0].role).toBe('user');
      expect(extracted[1].role).toBe('assistant');
      expect(extracted[2].role).toBe('tool');
      expect(extracted[3].role).toBe('assistant');
      expect(extracted[4].role).toBe('tool');
      expect(extracted[5].role).toBe('assistant');
      expect(extracted[6].role).toBe('tool');

      // Verify tool calls and results are properly paired
      const toolCallIds = [
        'toolu_01LmHSAwa8MeggWntV8gE1fG',
        'toolu_015T6fk9RhcJ9AuCYDtdsQba',
        'toolu_01QtPVf5tYPydXeXWGoCKbpH',
      ];

      for (let i = 0; i < toolCallIds.length; i++) {
        const assistantIdx = 1 + i * 2;
        const toolIdx = 2 + i * 2;

        // Get tool call ID from assistant message
        const assistantContent = extracted[assistantIdx].content as never[];
        const toolCall = assistantContent[0];
        expect(toolCall.toolCallId).toBe(toolCallIds[i]);

        // Verify matching tool result
        const toolContent = extracted[toolIdx].content as never[];
        const toolResult = toolContent[0];
        expect(toolResult.toolCallId).toBe(toolCallIds[i]);
      }
    });

    test('should handle messages bundled incorrectly (the bug scenario)', () => {
      // This represents what might come from the AI SDK if it bundles messages
      const bundledMessages: CoreMessage[] = [
        {
          role: 'user',
          content: 'Who is my top customer?',
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'toolu_1',
              toolName: 'think',
              args: { thought: 'First thought' },
            },
            {
              type: 'tool-call',
              toolCallId: 'toolu_2',
              toolName: 'analyze',
              args: { data: 'customers' },
            },
            {
              type: 'tool-call',
              toolCallId: 'toolu_3',
              toolName: 'finalize',
              args: { result: 'done' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'toolu_1',
              toolName: 'think',
              result: { success: true },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'toolu_2',
              toolName: 'analyze',
              result: { success: true },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'toolu_3',
              toolName: 'finalize',
              result: { success: true },
            },
          ],
        },
      ];

      // extractMessageHistory should now fix the bundling
      const extracted = extractMessageHistory(bundledMessages);

      // Should have been properly interleaved
      expect(extracted).toHaveLength(7); // user + 3*(assistant + tool)

      // Verify the sequential pattern
      expect(extracted[0].role).toBe('user');
      expect(extracted[1].role).toBe('assistant');
      expect(extracted[2].role).toBe('tool');
      expect(extracted[3].role).toBe('assistant');
      expect(extracted[4].role).toBe('tool');
      expect(extracted[5].role).toBe('assistant');
      expect(extracted[6].role).toBe('tool');

      // Verify each assistant message has only one tool call
      expect(extracted[1].content).toHaveLength(1);
      expect(extracted[1].content[0].toolCallId).toBe('toolu_1');

      expect(extracted[3].content).toHaveLength(1);
      expect(extracted[3].content[0].toolCallId).toBe('toolu_2');

      expect(extracted[5].content).toHaveLength(1);
      expect(extracted[5].content[0].toolCallId).toBe('toolu_3');
    });
  });

  describe('properlyInterleaveMessages', () => {
    test('should interleave bundled tool calls with their results', () => {
      const bundled: CoreMessage[] = [
        { role: 'user', content: 'Test' },
        {
          role: 'assistant',
          content: [
            { type: 'tool-call', toolCallId: 'id1', toolName: 'tool1', args: {} },
            { type: 'tool-call', toolCallId: 'id2', toolName: 'tool2', args: {} },
          ],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', toolCallId: 'id1', toolName: 'tool1', result: {} }],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', toolCallId: 'id2', toolName: 'tool2', result: {} }],
        },
      ];

      const interleaved = properlyInterleaveMessages(bundled);

      expect(interleaved).toHaveLength(5);
      expect(interleaved[0].role).toBe('user');
      expect(interleaved[1].role).toBe('assistant');
      expect(interleaved[1].content[0].toolCallId).toBe('id1');
      expect(interleaved[2].role).toBe('tool');
      expect(interleaved[2].content[0].toolCallId).toBe('id1');
      expect(interleaved[3].role).toBe('assistant');
      expect(interleaved[3].content[0].toolCallId).toBe('id2');
      expect(interleaved[4].role).toBe('tool');
      expect(interleaved[4].content[0].toolCallId).toBe('id2');
    });

    test('should handle mixed content (text + tool calls)', () => {
      const mixed: CoreMessage[] = [
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me help you with that.' },
            { type: 'tool-call', toolCallId: 'id1', toolName: 'analyze', args: {} },
            { type: 'tool-call', toolCallId: 'id2', toolName: 'finalize', args: {} },
          ],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', toolCallId: 'id1', toolName: 'analyze', result: {} }],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', toolCallId: 'id2', toolName: 'finalize', result: {} }],
        },
      ];

      const interleaved = properlyInterleaveMessages(mixed);

      expect(interleaved).toHaveLength(5);
      expect(interleaved[0].role).toBe('assistant');
      expect(interleaved[0].content).toEqual([
        { type: 'text', text: 'Let me help you with that.' },
      ]);
      expect(interleaved[1].role).toBe('assistant');
      expect(interleaved[1].content[0].toolCallId).toBe('id1');
      expect(interleaved[2].role).toBe('tool');
      expect(interleaved[3].role).toBe('assistant');
      expect(interleaved[3].content[0].toolCallId).toBe('id2');
      expect(interleaved[4].role).toBe('tool');
    });

    test('should handle conversation with follow-up questions', () => {
      const conversation: CoreMessage[] = [
        // First question
        { role: 'user', content: 'What is our revenue?' },
        {
          role: 'assistant',
          content: [
            { type: 'tool-call', toolCallId: 't1', toolName: 'sql', args: { query: 'revenue' } },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 't1',
              toolName: 'sql',
              result: { revenue: 1000000 },
            },
          ],
        },
        {
          role: 'assistant',
          content: 'Your revenue is $1M.',
        },
        // Follow-up question
        { role: 'user', content: 'What about profit?' },
        {
          role: 'assistant',
          content: [
            { type: 'tool-call', toolCallId: 't2', toolName: 'sql', args: { query: 'profit' } },
          ],
        },
        {
          role: 'tool',
          content: [
            { type: 'tool-result', toolCallId: 't2', toolName: 'sql', result: { profit: 200000 } },
          ],
        },
      ];

      const result = properlyInterleaveMessages(conversation);

      // Should remain mostly unchanged as it's already properly formatted
      // (but IDs may be added to assistant messages with tool calls)
      expect(result).toHaveLength(7);
      expect(result[0]).toEqual(conversation[0]); // user message unchanged
      expect(result[1].role).toBe('assistant');
      expect(result[1].content).toEqual(conversation[1].content);
      expect(result[2]).toEqual(conversation[2]); // tool result unchanged
      expect(result[3]).toEqual(conversation[3]); // assistant text unchanged
      expect(result[4]).toEqual(conversation[4]); // user message unchanged
      expect(result[5].role).toBe('assistant');
      expect(result[5].content).toEqual(conversation[5].content);
      expect(result[6]).toEqual(conversation[6]); // tool result unchanged
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
