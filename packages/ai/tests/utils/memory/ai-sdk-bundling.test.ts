import type { CoreMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import { extractMessageHistory } from '../../../src/utils/memory/message-history';

describe('AI SDK Message Bundling Issues', () => {
  test('identify when AI SDK returns bundled messages', () => {
    // The AI SDK tends to bundle multiple tool calls in a single assistant message
    // when parallel tool calls are made, even with disableParallelToolCalls
    const aiSdkResponse: CoreMessage[] = [
      {
        role: 'user',
        content: 'Analyze our customer data',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_ABC123',
            toolName: 'sequentialThinking',
            args: { thought: 'First, I need to understand the data structure' },
          },
          {
            type: 'tool-call',
            toolCallId: 'call_DEF456',
            toolName: 'executeSql',
            args: { statements: ['SELECT COUNT(*) FROM customers'] },
          },
          {
            type: 'tool-call',
            toolCallId: 'call_GHI789',
            toolName: 'submitThoughts',
            args: {},
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_ABC123',
            toolName: 'sequentialThinking',
            result: { success: true },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_DEF456',
            toolName: 'executeSql',
            result: { results: [{ count: 100 }] },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_GHI789',
            toolName: 'submitThoughts',
            result: {},
          },
        ],
      },
    ];

    // Our extraction should fix this
    const fixed = extractMessageHistory(aiSdkResponse);

    // Should be properly interleaved now
    expect(fixed).toHaveLength(7); // user + 3*(assistant + tool)

    // Check the pattern
    expect(fixed[0].role).toBe('user');
    expect(fixed[1].role).toBe('assistant');
    expect(fixed[1].content[0].toolCallId).toBe('call_ABC123');
    expect(fixed[2].role).toBe('tool');
    expect(fixed[2].content[0].toolCallId).toBe('call_ABC123');
    expect(fixed[3].role).toBe('assistant');
    expect(fixed[3].content[0].toolCallId).toBe('call_DEF456');
    expect(fixed[4].role).toBe('tool');
    expect(fixed[4].content[0].toolCallId).toBe('call_DEF456');
    expect(fixed[5].role).toBe('assistant');
    expect(fixed[5].content[0].toolCallId).toBe('call_GHI789');
    expect(fixed[6].role).toBe('tool');
    expect(fixed[6].content[0].toolCallId).toBe('call_GHI789');
  });

  test('handle case where AI SDK partially bundles messages', () => {
    // Sometimes the AI SDK might bundle some calls but not others
    const partiallyBundled: CoreMessage[] = [
      {
        role: 'user',
        content: 'Test',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'id1',
            toolName: 'tool1',
            args: {},
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'id1',
            toolName: 'tool1',
            result: {},
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'id2',
            toolName: 'tool2',
            args: {},
          },
          {
            type: 'tool-call',
            toolCallId: 'id3',
            toolName: 'tool3',
            args: {},
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'id2',
            toolName: 'tool2',
            result: {},
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'id3',
            toolName: 'tool3',
            result: {},
          },
        ],
      },
    ];

    const fixed = extractMessageHistory(partiallyBundled);

    // Should fix only the bundled part
    expect(fixed).toHaveLength(7);

    // First part should remain unchanged
    expect(fixed[0]).toEqual(partiallyBundled[0]);
    expect(fixed[1]).toEqual(partiallyBundled[1]);
    expect(fixed[2]).toEqual(partiallyBundled[2]);

    // Second part should be unbundled
    expect(fixed[3].content[0].toolCallId).toBe('id2');
    expect(fixed[4].content[0].toolCallId).toBe('id2');
    expect(fixed[5].content[0].toolCallId).toBe('id3');
    expect(fixed[6].content[0].toolCallId).toBe('id3');
  });

  test('verify already correct messages pass through unchanged', () => {
    const correctlyFormatted: CoreMessage[] = [
      { role: 'user', content: 'Test' },
      {
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 'id1', toolName: 'tool1', args: {} }],
      },
      {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'id1', toolName: 'tool1', result: {} }],
      },
      {
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 'id2', toolName: 'tool2', args: {} }],
      },
      {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'id2', toolName: 'tool2', result: {} }],
      },
    ];

    const result = extractMessageHistory(correctlyFormatted);

    // Should be unchanged
    expect(result).toEqual(correctlyFormatted);
    expect(result).toHaveLength(5);
  });
});
