import type { AssistantContent, CoreMessage, ToolCallPart, ToolResultPart } from 'ai';
import { describe, expect, test } from 'vitest';
import { extractMessageHistory } from '../utils/memory/message-history';

describe('Message Bundling Debug', () => {
  test('should log what the AI SDK returns vs what we expect', () => {
    // This is what we WANT the messages to look like
    const expectedFormat: CoreMessage[] = [
      { role: 'user', content: 'Who is my top customer?' },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_1',
            toolName: 'sequentialThinking',
            args: { thought: 'First thought' },
          },
        ],
      },
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
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_2',
            toolName: 'executeSql',
            args: { statements: ['SELECT...'] },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_2',
            toolName: 'executeSql',
            result: { results: [] },
          },
        ],
      },
    ];

    // This is what the AI SDK MIGHT be returning (bundled)
    const bundledFormat: CoreMessage[] = [
      { role: 'user', content: 'Who is my top customer?' },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_1',
            toolName: 'sequentialThinking',
            args: { thought: 'First thought' },
          },
          {
            type: 'tool-call',
            toolCallId: 'toolu_2',
            toolName: 'executeSql',
            args: { statements: ['SELECT...'] },
          },
        ],
      },
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
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_2',
            toolName: 'executeSql',
            result: { results: [] },
          },
        ],
      },
    ];

    console.log('=== EXPECTED FORMAT ===');
    console.log('Message count:', expectedFormat.length);
    expectedFormat.forEach((msg, i) => {
      console.log(
        `[${i}] ${msg.role}:`,
        msg.role === 'assistant' || msg.role === 'tool'
          ? `${Array.isArray(msg.content) ? msg.content.length : 1} items`
          : 'text'
      );
    });

    console.log('\n=== BUNDLED FORMAT (FROM AI SDK) ===');
    console.log('Message count:', bundledFormat.length);
    bundledFormat.forEach((msg, i) => {
      console.log(
        `[${i}] ${msg.role}:`,
        msg.role === 'assistant' || msg.role === 'tool'
          ? `${Array.isArray(msg.content) ? msg.content.length : 1} items`
          : 'text'
      );
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        (msg.content as any[]).forEach((item: any, j) => {
          if (item.type === 'tool-call') {
            const toolCall = item as ToolCallPart;
            console.log(`    [${j}] tool-call: ${toolCall.toolName} (${toolCall.toolCallId})`);
          }
        });
      }
    });

    // Test our extraction function
    const extracted = extractMessageHistory(bundledFormat);

    console.log('\n=== AFTER EXTRACTION ===');
    console.log('Message count:', extracted.length);
    extracted.forEach((msg, i) => {
      console.log(
        `[${i}] ${msg.role}:`,
        msg.role === 'assistant' || msg.role === 'tool'
          ? `${Array.isArray(msg.content) ? msg.content.length : 1} items`
          : 'text'
      );
    });

    // Should be properly interleaved
    expect(extracted).toHaveLength(5);
    expect(extracted[0]?.role).toBe('user');
    expect(extracted[1]?.role).toBe('assistant');
    expect(extracted[2]?.role).toBe('tool');
    expect(extracted[3]?.role).toBe('assistant');
    expect(extracted[4]?.role).toBe('tool');
  });

  test('debug step.response.messages structure', () => {
    // Simulate what might come from step.response.messages
    const stepResponseMessages = [
      {
        role: 'user',
        content: 'Test prompt',
      },
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: 'id1', toolName: 'think', args: {} },
          { type: 'tool-call', toolCallId: 'id2', toolName: 'analyze', args: {} },
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
    ];

    console.log('\n=== SIMULATED step.response.messages ===');
    console.log(JSON.stringify(stepResponseMessages, null, 2));

    const extracted = extractMessageHistory(stepResponseMessages as CoreMessage[]);

    console.log('\n=== AFTER EXTRACTION ===');
    console.log(JSON.stringify(extracted, null, 2));

    // Verify it's properly interleaved
    expect(extracted).toHaveLength(5);
    const msg1 = extracted[1];
    const msg2 = extracted[2];
    const msg3 = extracted[3];
    const msg4 = extracted[4];

    if (msg1 && Array.isArray(msg1.content) && msg1.content[0]) {
      expect((msg1.content[0] as ToolCallPart).toolCallId).toBe('id1');
    }
    if (msg2 && Array.isArray(msg2.content) && msg2.content[0]) {
      expect((msg2.content[0] as ToolResultPart).toolCallId).toBe('id1');
    }
    if (msg3 && Array.isArray(msg3.content) && msg3.content[0]) {
      expect((msg3.content[0] as ToolCallPart).toolCallId).toBe('id2');
    }
    if (msg4 && Array.isArray(msg4.content) && msg4.content[0]) {
      expect((msg4.content[0] as ToolResultPart).toolCallId).toBe('id2');
    }
  });
});
