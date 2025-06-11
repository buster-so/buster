import type { CoreMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import { extractMessageHistory } from '../../../src/utils/memory/message-history';

describe('Workflow Message Flow', () => {
  test('should maintain sequential order when passing messages between steps', () => {
    // Simulate what comes out of think-and-prep step
    const thinkAndPrepOutput: CoreMessage[] = [
      {
        role: 'user',
        content: 'Who is my top customer?',
      },
      {
        id: 'msg-1',
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_1',
            toolName: 'sequentialThinking',
            args: { thought: 'Analyzing request...' },
          },
        ],
      },
      {
        id: 'msg-2',
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_1',
            toolName: 'sequentialThinking',
            result: { success: true },
          },
        ],
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_2',
            toolName: 'submitThoughts',
            args: {},
          },
        ],
      },
      {
        id: 'msg-4',
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_2',
            toolName: 'submitThoughts',
            result: {},
          },
        ],
      },
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
        id: 'msg-5',
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_3',
            toolName: 'executeSql',
            args: { statements: ['SELECT * FROM customers'] },
          },
        ],
      },
      {
        id: 'msg-6',
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_3',
            toolName: 'executeSql',
            result: { results: [] },
          },
        ],
      },
    ];

    // Extract complete history
    const completeHistory = extractMessageHistory(analystMessages);

    // Should have all messages in correct order
    expect(completeHistory).toHaveLength(7);
    
    // Verify the pattern
    expect(completeHistory[0].role).toBe('user');
    expect(completeHistory[1].role).toBe('assistant');
    expect(completeHistory[2].role).toBe('tool');
    expect(completeHistory[3].role).toBe('assistant');
    expect(completeHistory[4].role).toBe('tool');
    expect(completeHistory[5].role).toBe('assistant');
    expect(completeHistory[6].role).toBe('tool');
  });

  test('should handle follow-up conversation with existing history', () => {
    // First conversation saved in database
    const firstConversation: CoreMessage[] = [
      { role: 'user', content: 'Who is my top customer?' },
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: 't1', toolName: 'sql', args: {} },
        ],
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
    expect(extracted[0].content).toBe('Who is my top customer?');
    expect(extracted[3].content).toBe('Your top customer is ACME.');
    expect(extracted[4].content).toBe('What about their revenue?');
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
    const roles = fixed.map(m => m.role);
    expect(roles).toEqual(['user', 'assistant', 'tool', 'assistant', 'tool', 'assistant', 'tool']);

    // Verify tool calls are properly paired with results
    expect(fixed[1].content[0].toolCallId).toBe('id1');
    expect(fixed[2].content[0].toolCallId).toBe('id1');
    expect(fixed[3].content[0].toolCallId).toBe('id2');
    expect(fixed[4].content[0].toolCallId).toBe('id2');
    expect(fixed[5].content[0].toolCallId).toBe('id3');
    expect(fixed[6].content[0].toolCallId).toBe('id3');
  });

  test('should preserve message metadata (IDs, timestamps, etc)', () => {
    const messagesWithMetadata: CoreMessage[] = [
      {
        role: 'user',
        content: 'Test',
        // @ts-ignore - additional metadata
        timestamp: '2024-01-01T00:00:00Z',
      },
      {
        id: 'unique-id-123',
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: 'tool-id', toolName: 'test', args: {} },
        ],
        // @ts-ignore - additional metadata
        model: 'claude-3',
      },
      {
        id: 'tool-result-id',
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: 'tool-id', toolName: 'test', result: {} },
        ],
      },
    ];

    const extracted = extractMessageHistory(messagesWithMetadata);

    // Metadata should be preserved
    expect(extracted[0]).toHaveProperty('timestamp');
    expect(extracted[1]).toHaveProperty('id', 'unique-id-123');
    expect(extracted[1]).toHaveProperty('model');
    expect(extracted[2]).toHaveProperty('id', 'tool-result-id');
  });
});