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
import { hasToolCallId, validateArrayAccess } from '../../../src/utils/validation-helpers';

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
      expect(validateArrayAccess(processed, 0, 'processed messages')?.role).toBe('user');
      expect(validateArrayAccess(processed, 1, 'processed messages')?.role).toBe('assistant');
      expect(validateArrayAccess(processed, 2, 'processed messages')?.role).toBe('tool');
      expect(validateArrayAccess(processed, 3, 'processed messages')?.role).toBe('assistant');
      expect(validateArrayAccess(processed, 4, 'processed messages')?.role).toBe('tool');
    });

    test('should unbundle messages that have mixed content', () => {
      const bundledMessages: CoreMessage[] = [
        {
          role: 'user',
          content: 'What are our top 5 products?',
        },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me analyze that for you.' },
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
      expect(validateArrayAccess(unbundled, 0, 'unbundled messages')?.role).toBe('user');
      expect(validateArrayAccess(unbundled, 1, 'unbundled messages')?.role).toBe('assistant');
      expect(validateArrayAccess(unbundled, 1, 'unbundled messages')?.content).toEqual([
        { type: 'text', text: 'Let me analyze that for you.' },
      ]);
      expect(validateArrayAccess(unbundled, 2, 'unbundled messages')?.role).toBe('assistant');
      const unbundled2 = validateArrayAccess(unbundled, 2, 'unbundled messages');
      expect(unbundled2 ? isToolCallOnlyMessage(unbundled2) : false).toBe(true);
      expect(validateArrayAccess(unbundled, 3, 'unbundled messages')?.role).toBe('assistant');
      const unbundled3 = validateArrayAccess(unbundled, 3, 'unbundled messages');
      expect(unbundled3 ? isToolCallOnlyMessage(unbundled3) : false).toBe(true);
      expect(validateArrayAccess(unbundled, 4, 'unbundled messages')?.role).toBe('tool');
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
          { type: 'text', text: 'Here is some text' },
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
      expect(validateArrayAccess(extracted, 0, 'extracted')?.role).toBe('user');
      expect(validateArrayAccess(extracted, 1, 'extracted')?.role).toBe('assistant');
      expect(validateArrayAccess(extracted, 2, 'extracted')?.role).toBe('tool');
      expect(validateArrayAccess(extracted, 3, 'extracted')?.role).toBe('assistant');
      expect(validateArrayAccess(extracted, 4, 'extracted')?.role).toBe('tool');
      expect(validateArrayAccess(extracted, 5, 'extracted')?.role).toBe('assistant');
      expect(validateArrayAccess(extracted, 6, 'extracted')?.role).toBe('tool');

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
        const assistantMsg = validateArrayAccess(extracted, assistantIdx, 'assistant message');
        const assistantContent = assistantMsg?.content;
        if (Array.isArray(assistantContent) && assistantContent.length > 0) {
          const toolCall = validateArrayAccess(assistantContent, 0, 'tool call');
          if (hasToolCallId(toolCall)) {
            expect(toolCall.toolCallId).toBe(validateArrayAccess(toolCallIds, i, 'tool call id'));
          }
        }

        // Verify matching tool result
        const toolMsg = validateArrayAccess(extracted, toolIdx, 'tool message');
        const toolContent = toolMsg?.content;
        if (Array.isArray(toolContent) && toolContent.length > 0) {
          const toolResult = validateArrayAccess(toolContent, 0, 'tool result');
          if (hasToolCallId(toolResult)) {
            expect(toolResult.toolCallId).toBe(validateArrayAccess(toolCallIds, i, 'tool call id'));
          }
        }
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
      expect(validateArrayAccess(extracted, 0, 'extracted')?.role).toBe('user');
      expect(validateArrayAccess(extracted, 1, 'extracted')?.role).toBe('assistant');
      expect(validateArrayAccess(extracted, 2, 'extracted')?.role).toBe('tool');
      expect(validateArrayAccess(extracted, 3, 'extracted')?.role).toBe('assistant');
      expect(validateArrayAccess(extracted, 4, 'extracted')?.role).toBe('tool');
      expect(validateArrayAccess(extracted, 5, 'extracted')?.role).toBe('assistant');
      expect(validateArrayAccess(extracted, 6, 'extracted')?.role).toBe('tool');

      // Verify each assistant message has only one tool call
      const extracted1 = validateArrayAccess(extracted, 1, 'extracted');
      expect(extracted1?.content).toHaveLength(1);
      const content1 = extracted1?.content;
      if (
        Array.isArray(content1) &&
        content1[0] &&
        typeof content1[0] === 'object' &&
        'toolCallId' in content1[0]
      ) {
        expect(content1[0].toolCallId).toBe('toolu_1');
      }

      const extracted3 = validateArrayAccess(extracted, 3, 'extracted');
      expect(extracted3?.content).toHaveLength(1);
      const content3 = extracted3?.content;
      if (
        Array.isArray(content3) &&
        content3[0] &&
        typeof content3[0] === 'object' &&
        'toolCallId' in content3[0]
      ) {
        expect(content3[0].toolCallId).toBe('toolu_2');
      }

      const extracted5 = validateArrayAccess(extracted, 5, 'extracted');
      expect(extracted5?.content).toHaveLength(1);
      const content5 = extracted5?.content;
      if (
        Array.isArray(content5) &&
        content5[0] &&
        typeof content5[0] === 'object' &&
        'toolCallId' in content5[0]
      ) {
        expect(content5[0].toolCallId).toBe('toolu_3');
      }
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
      expect(validateArrayAccess(interleaved, 0, 'interleaved')?.role).toBe('user');
      expect(validateArrayAccess(interleaved, 1, 'interleaved')?.role).toBe('assistant');
      const interleaved1 = validateArrayAccess(interleaved, 1, 'interleaved');
      const c1 = interleaved1?.content;
      if (Array.isArray(c1) && c1[0] && typeof c1[0] === 'object' && 'toolCallId' in c1[0]) {
        expect(c1[0].toolCallId).toBe('id1');
      }
      expect(validateArrayAccess(interleaved, 2, 'interleaved')?.role).toBe('tool');
      const interleaved2 = validateArrayAccess(interleaved, 2, 'interleaved');
      const c2 = interleaved2?.content;
      if (Array.isArray(c2) && c2[0] && typeof c2[0] === 'object' && 'toolCallId' in c2[0]) {
        expect(c2[0].toolCallId).toBe('id1');
      }
      expect(validateArrayAccess(interleaved, 3, 'interleaved')?.role).toBe('assistant');
      const interleaved3 = validateArrayAccess(interleaved, 3, 'interleaved');
      const c3 = interleaved3?.content;
      if (Array.isArray(c3) && c3[0] && typeof c3[0] === 'object' && 'toolCallId' in c3[0]) {
        expect(c3[0].toolCallId).toBe('id2');
      }
      expect(validateArrayAccess(interleaved, 4, 'interleaved')?.role).toBe('tool');
      const interleaved4 = validateArrayAccess(interleaved, 4, 'interleaved');
      const c4 = interleaved4?.content;
      if (Array.isArray(c4) && c4[0] && typeof c4[0] === 'object' && 'toolCallId' in c4[0]) {
        expect(c4[0].toolCallId).toBe('id2');
      }
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
      const ic1 = interleaved[1].content;
      if (Array.isArray(ic1) && ic1[0] && typeof ic1[0] === 'object' && 'toolCallId' in ic1[0]) {
        expect(ic1[0].toolCallId).toBe('id1');
      }
      expect(interleaved[2].role).toBe('tool');
      expect(interleaved[3].role).toBe('assistant');
      const ic3 = interleaved[3].content;
      if (Array.isArray(ic3) && ic3[0] && typeof ic3[0] === 'object' && 'toolCallId' in ic3[0]) {
        expect(ic3[0].toolCallId).toBe('id2');
      }
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
      expect(validateArrayAccess(conversation, 0, 'conversation')?.role).toBe('user');
      expect(validateArrayAccess(conversation, 1, 'conversation')?.role).toBe('assistant');
      const conv1 = validateArrayAccess(conversation, 1, 'conversation');
      expect(conv1 ? isToolCallOnlyMessage(conv1) : false).toBe(true);
      expect(validateArrayAccess(conversation, 2, 'conversation')?.role).toBe('tool');
      expect(validateArrayAccess(conversation, 3, 'conversation')?.role).toBe('assistant');
      const conv3 = validateArrayAccess(conversation, 3, 'conversation');
      expect(conv3 ? isToolCallOnlyMessage(conv3) : false).toBe(true);
      expect(validateArrayAccess(conversation, 4, 'conversation')?.role).toBe('tool');
      expect(validateArrayAccess(conversation, 5, 'conversation')?.role).toBe('user');
      expect(validateArrayAccess(conversation, 6, 'conversation')?.role).toBe('assistant');
      expect(validateArrayAccess(conversation, 7, 'conversation')?.role).toBe('tool');

      // Verify extraction preserves the structure (but may add IDs)
      const extracted = extractMessageHistory(conversation);
      expect(extracted).toHaveLength(8);

      // Check the roles and structure are preserved
      for (let i = 0; i < conversation.length; i++) {
        const extractedItem = validateArrayAccess(extracted, i, 'extracted');
        const conversationItem = validateArrayAccess(conversation, i, 'conversation');
        expect(extractedItem?.role).toBe(conversationItem?.role);
        expect(extractedItem?.content).toEqual(conversationItem?.content);
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
