import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';
import type { CoreMessage } from 'ai';
import { formatLlmMessagesAsReasoning } from '../../../src/utils/database/formatLlmMessagesAsReasoning';

describe('formatLlmMessagesAsReasoning error handling', () => {
  // Mock console.error to verify error logging
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  test('handles non-array input gracefully', () => {
    const result = formatLlmMessagesAsReasoning(null as any);
    
    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'formatLlmMessagesAsReasoning: Expected array of messages, got:',
      'object'
    );
  });

  test('handles undefined input gracefully', () => {
    const result = formatLlmMessagesAsReasoning(undefined as any);
    
    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'formatLlmMessagesAsReasoning: Expected array of messages, got:',
      'undefined'
    );
  });

  test('skips null messages in array', () => {
    const messages = [
      null,
      {
        role: 'user',
        content: 'Test message',
      },
      undefined,
    ] as any;
    
    const result = formatLlmMessagesAsReasoning(messages);
    
    expect(result).toHaveLength(1); // Only the valid message is processed
    expect(result[0]).toHaveProperty('type', 'text');
    expect(result[0]).toHaveProperty('message', 'Test message');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // For null and undefined
  });

  test('handles tool calls with missing args gracefully', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test-id',
            toolName: 'unknownTool', // Use unknown tool to test default case
            args: undefined as any, // Missing args
          },
        ],
      },
    ];
    
    const result = formatLlmMessagesAsReasoning(messages);
    
    // Should still create a reasoning message with default handling
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('title', 'unknownTool');
    expect(result[0]).toHaveProperty('message', '{}'); // Empty object stringified
  });

  test('handles circular references in tool args', () => {
    const circularObj: any = { a: 1 };
    circularObj.self = circularObj; // Create circular reference
    
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test-id',
            toolName: 'unknownTool',
            args: circularObj,
          },
        ],
      },
    ];
    
    const result = formatLlmMessagesAsReasoning(messages);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('message', '[Unable to display tool arguments]');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to stringify args for tool unknownTool:',
      expect.any(Error)
    );
  });

  test('continues processing after encountering an error', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'fail-id',
            toolName: 'sequentialThinking',
            args: undefined as any, // This will cause issues
          },
        ],
      },
      {
        role: 'user',
        content: 'Valid message after error',
      },
    ];
    
    const result = formatLlmMessagesAsReasoning(messages);
    
    // Should process both messages despite the error in the first
    expect(result).toHaveLength(2);
    expect(result[1]).toHaveProperty('message', 'Valid message after error');
  });

  test('handles messages with complex content arrays', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'image', image: 'data:image/png;base64,...' } as any,
          { type: 'text', text: 'World' },
        ],
      },
    ];
    
    const result = formatLlmMessagesAsReasoning(messages);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('message', 'Hello [image] World');
  });
});