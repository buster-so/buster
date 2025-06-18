import type { CoreMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import { extractMessageHistory } from '../../../src/utils/memory/message-history';
import { validateArrayAccess } from '../../../src/utils/validation-helpers';

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
    const msg0 = validateArrayAccess(fixed, 0, 'fixed messages');
    const msg1 = validateArrayAccess(fixed, 1, 'fixed messages');
    const msg2 = validateArrayAccess(fixed, 2, 'fixed messages');
    const msg3 = validateArrayAccess(fixed, 3, 'fixed messages');
    const msg4 = validateArrayAccess(fixed, 4, 'fixed messages');
    const msg5 = validateArrayAccess(fixed, 5, 'fixed messages');
    const msg6 = validateArrayAccess(fixed, 6, 'fixed messages');

    expect(msg0.role).toBe('user');
    expect(msg1.role).toBe('assistant');
    if (msg1.role === 'assistant' && Array.isArray(msg1.content)) {
      const content = validateArrayAccess(msg1.content, 0, 'assistant content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('call_ABC123');
      }
    }
    expect(msg2.role).toBe('tool');
    if (msg2.role === 'tool' && Array.isArray(msg2.content)) {
      const content = validateArrayAccess(msg2.content, 0, 'tool content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('call_ABC123');
      }
    }
    expect(msg3.role).toBe('assistant');
    if (msg3.role === 'assistant' && Array.isArray(msg3.content)) {
      const content = validateArrayAccess(msg3.content, 0, 'assistant content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('call_DEF456');
      }
    }
    expect(msg4.role).toBe('tool');
    if (msg4.role === 'tool' && Array.isArray(msg4.content)) {
      const content = validateArrayAccess(msg4.content, 0, 'tool content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('call_DEF456');
      }
    }
    expect(msg5.role).toBe('assistant');
    if (msg5.role === 'assistant' && Array.isArray(msg5.content)) {
      const content = validateArrayAccess(msg5.content, 0, 'assistant content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('call_GHI789');
      }
    }
    expect(msg6.role).toBe('tool');
    if (msg6.role === 'tool' && Array.isArray(msg6.content)) {
      const content = validateArrayAccess(msg6.content, 0, 'tool content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('call_GHI789');
      }
    }
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
    const fixedMsg0 = validateArrayAccess(fixed, 0, 'fixed messages');
    const fixedMsg1 = validateArrayAccess(fixed, 1, 'fixed messages');
    const fixedMsg2 = validateArrayAccess(fixed, 2, 'fixed messages');
    const fixedMsg3 = validateArrayAccess(fixed, 3, 'fixed messages');
    const fixedMsg4 = validateArrayAccess(fixed, 4, 'fixed messages');
    const fixedMsg5 = validateArrayAccess(fixed, 5, 'fixed messages');
    const fixedMsg6 = validateArrayAccess(fixed, 6, 'fixed messages');

    const partialMsg0 = validateArrayAccess(partiallyBundled, 0, 'partially bundled messages');
    const partialMsg1 = validateArrayAccess(partiallyBundled, 1, 'partially bundled messages');
    const partialMsg2 = validateArrayAccess(partiallyBundled, 2, 'partially bundled messages');

    expect(fixedMsg0).toEqual(partialMsg0);
    expect(fixedMsg1).toEqual(partialMsg1);
    expect(fixedMsg2).toEqual(partialMsg2);

    // Second part should be unbundled
    if (fixedMsg3.role === 'assistant' && Array.isArray(fixedMsg3.content)) {
      const content = validateArrayAccess(fixedMsg3.content, 0, 'assistant content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('id2');
      }
    }
    if (fixedMsg4.role === 'tool' && Array.isArray(fixedMsg4.content)) {
      const content = validateArrayAccess(fixedMsg4.content, 0, 'tool content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('id2');
      }
    }
    if (fixedMsg5.role === 'assistant' && Array.isArray(fixedMsg5.content)) {
      const content = validateArrayAccess(fixedMsg5.content, 0, 'assistant content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('id3');
      }
    }
    if (fixedMsg6.role === 'tool' && Array.isArray(fixedMsg6.content)) {
      const content = validateArrayAccess(fixedMsg6.content, 0, 'tool content');
      if ('toolCallId' in content) {
        expect(content.toolCallId).toBe('id3');
      }
    }
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
