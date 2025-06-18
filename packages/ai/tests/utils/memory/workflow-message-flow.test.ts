import type {
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  ToolCallPart,
  ToolResultPart,
} from 'ai';
import { describe, expect, test } from 'vitest';
import { extractMessageHistory } from '../../../src/utils/memory/message-history';
import { validateArrayAccess } from '../../../src/utils/validation-helpers';

describe('Workflow Message Flow', () => {
  test('should maintain sequential order when passing messages between steps', () => {
    // Simulate what comes out of think-and-prep step
    const thinkAndPrepOutput: CoreMessage[] = [
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
            toolName: 'sequentialThinking',
            args: { thought: 'Analyzing request...' },
          },
        ],
      } as CoreAssistantMessage,
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_1',
            toolName: 'sequentialThinking',
            result: { success: true },
          },
        ],
      } as CoreToolMessage,
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_2',
            toolName: 'submitThoughts',
            args: {},
          },
        ],
      } as CoreAssistantMessage,
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_2',
            toolName: 'submitThoughts',
            result: {},
          },
        ],
      } as CoreToolMessage,
    ];

    // This is what gets passed to analyst step
    const messagesForAnalyst = extractMessageHistory(thinkAndPrepOutput);

    // Should maintain exact order
    expect(messagesForAnalyst).toEqual(thinkAndPrepOutput);
    expect(messagesForAnalyst).toHaveLength(5);

    // Simulate analyst adding more messages
    const analystMessages: CoreMessage[] = [
      ...messagesForAnalyst,
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_3',
            toolName: 'executeSql',
            args: { statements: ['SELECT * FROM customers'] },
          },
        ],
      } as CoreAssistantMessage,
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_3',
            toolName: 'executeSql',
            result: { results: [] },
          },
        ],
      } as CoreToolMessage,
    ];

    // Extract complete history
    const completeHistory = extractMessageHistory(analystMessages);

    // Should have all messages in correct order
    expect(completeHistory).toHaveLength(7);

    // Verify the pattern
    const msg0 = validateArrayAccess(completeHistory, 0, 'complete history');
    const msg1 = validateArrayAccess(completeHistory, 1, 'complete history');
    const msg2 = validateArrayAccess(completeHistory, 2, 'complete history');
    const msg3 = validateArrayAccess(completeHistory, 3, 'complete history');
    const msg4 = validateArrayAccess(completeHistory, 4, 'complete history');
    const msg5 = validateArrayAccess(completeHistory, 5, 'complete history');
    const msg6 = validateArrayAccess(completeHistory, 6, 'complete history');

    expect(msg0.role).toBe('user');
    expect(msg1.role).toBe('assistant');
    expect(msg2.role).toBe('tool');
    expect(msg3.role).toBe('assistant');
    expect(msg4.role).toBe('tool');
    expect(msg5.role).toBe('assistant');
    expect(msg6.role).toBe('tool');
  });

  test('should handle follow-up conversation with existing history', () => {
    // First conversation saved in database
    const firstConversation: CoreMessage[] = [
      { role: 'user', content: 'Who is my top customer?' },
      {
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 't1', toolName: 'sql', args: {} }],
      },
      {
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: 't1', toolName: 'sql', result: { customer: 'ACME' } },
        ],
      },
      {
        role: 'assistant',
        content: 'Your top customer is ACME.',
      },
    ];

    // User asks follow-up
    const followUpPrompt = 'What about their revenue?';

    // Build messages for new workflow run
    const messagesWithHistory: CoreMessage[] = [
      ...firstConversation,
      { role: 'user', content: followUpPrompt },
    ];

    // Extract for processing
    const extracted = extractMessageHistory(messagesWithHistory);

    // Should maintain conversation flow
    expect(extracted).toHaveLength(5);
    const extractedMsg0 = validateArrayAccess(extracted, 0, 'extracted messages');
    const extractedMsg3 = validateArrayAccess(extracted, 3, 'extracted messages');
    const extractedMsg4 = validateArrayAccess(extracted, 4, 'extracted messages');

    expect(extractedMsg0.content).toBe('Who is my top customer?');
    expect(extractedMsg3.content).toBe('Your top customer is ACME.');
    expect(extractedMsg4.content).toBe('What about their revenue?');
  });

  test('should handle edge case: bundled messages from AI SDK', () => {
    // If AI SDK returns bundled messages (bug scenario)
    const bundledFromSDK: CoreMessage[] = [
      { role: 'user', content: 'Analyze sales data' },
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: 'id1', toolName: 'think', args: {} },
          { type: 'tool-call', toolCallId: 'id2', toolName: 'analyze', args: {} },
          { type: 'tool-call', toolCallId: 'id3', toolName: 'report', args: {} },
        ],
      },
      {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'id1', toolName: 'think', result: {} }],
      },
      {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'id2', toolName: 'analyze', result: {} }],
      },
      {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'id3', toolName: 'report', result: {} }],
      },
    ];

    // extractMessageHistory should fix this
    const fixed = extractMessageHistory(bundledFromSDK);

    // Should be properly interleaved
    expect(fixed).toHaveLength(7);

    // Check sequential pattern
    const roles = fixed.map((m) => m.role);
    expect(roles).toEqual(['user', 'assistant', 'tool', 'assistant', 'tool', 'assistant', 'tool']);

    // Verify tool calls are properly paired with results
    const fixedMsg1 = validateArrayAccess(fixed, 1, 'fixed messages');
    const fixedMsg2 = validateArrayAccess(fixed, 2, 'fixed messages');
    const fixedMsg3 = validateArrayAccess(fixed, 3, 'fixed messages');
    const fixedMsg4 = validateArrayAccess(fixed, 4, 'fixed messages');
    const fixedMsg5 = validateArrayAccess(fixed, 5, 'fixed messages');
    const fixedMsg6 = validateArrayAccess(fixed, 6, 'fixed messages');

    if (fixedMsg1.role === 'assistant' && Array.isArray(fixedMsg1.content)) {
      const content1 = validateArrayAccess(fixedMsg1.content, 0, 'assistant content');
      if ('toolCallId' in content1) {
        expect(content1.toolCallId).toBe('id1');
      }
    }
    if (fixedMsg2.role === 'tool' && Array.isArray(fixedMsg2.content)) {
      const content2 = validateArrayAccess(fixedMsg2.content, 0, 'tool content');
      if ('toolCallId' in content2) {
        expect(content2.toolCallId).toBe('id1');
      }
    }
    if (fixedMsg3.role === 'assistant' && Array.isArray(fixedMsg3.content)) {
      const content3 = validateArrayAccess(fixedMsg3.content, 0, 'assistant content');
      if ('toolCallId' in content3) {
        expect(content3.toolCallId).toBe('id2');
      }
    }
    if (fixedMsg4.role === 'tool' && Array.isArray(fixedMsg4.content)) {
      const content4 = validateArrayAccess(fixedMsg4.content, 0, 'tool content');
      if ('toolCallId' in content4) {
        expect(content4.toolCallId).toBe('id2');
      }
    }
    if (fixedMsg5.role === 'assistant' && Array.isArray(fixedMsg5.content)) {
      const content5 = validateArrayAccess(fixedMsg5.content, 0, 'assistant content');
      if ('toolCallId' in content5) {
        expect(content5.toolCallId).toBe('id3');
      }
    }
    if (fixedMsg6.role === 'tool' && Array.isArray(fixedMsg6.content)) {
      const content6 = validateArrayAccess(fixedMsg6.content, 0, 'tool content');
      if ('toolCallId' in content6) {
        expect(content6.toolCallId).toBe('id3');
      }
    }
  });

  test('should preserve message metadata (IDs, timestamps, etc)', () => {
    const messagesWithMetadata = [
      {
        role: 'user',
        content: 'Test',
        // @ts-ignore - additional metadata
        timestamp: '2024-01-01T00:00:00Z',
      },
      {
        // @ts-ignore - additional metadata
        id: 'unique-id-123',
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 'tool-id', toolName: 'test', args: {} }],
        // @ts-ignore - additional metadata
        model: 'claude-3',
      },
      {
        // @ts-ignore - additional metadata
        id: 'tool-result-id',
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'tool-id', toolName: 'test', result: {} }],
      },
    ] as CoreMessage[];

    const extracted = extractMessageHistory(messagesWithMetadata);

    // Metadata should be preserved
    const extractedMsg0 = validateArrayAccess(extracted, 0, 'extracted metadata messages');
    const extractedMsg1 = validateArrayAccess(extracted, 1, 'extracted metadata messages');
    const extractedMsg2 = validateArrayAccess(extracted, 2, 'extracted metadata messages');

    expect(extractedMsg0).toHaveProperty('timestamp');
    expect(extractedMsg1).toHaveProperty('id', 'unique-id-123');
    expect(extractedMsg1).toHaveProperty('model');
    expect(extractedMsg2).toHaveProperty('id', 'tool-result-id');
  });
});
