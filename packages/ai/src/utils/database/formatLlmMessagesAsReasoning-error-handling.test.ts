import type { CoreMessage } from 'ai';
import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';
import { formatLlmMessagesAsReasoning } from './format-llm-messages-as-reasoning';

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
    const result = formatLlmMessagesAsReasoning(null as never);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'formatLlmMessagesAsReasoning: Expected array of messages, got:',
      'object'
    );
  });

  test('handles undefined input gracefully', () => {
    const result = formatLlmMessagesAsReasoning(undefined as never);

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
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test-id',
            toolName: 'sequentialThinking',
            args: {
              thought: 'Test message',
            },
          },
        ],
      },
      undefined,
    ] as never;

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
            args: undefined as never, // Missing args
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
    const circularObj: { a: number; self?: unknown } = { a: 1 };
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
            args: undefined as never, // This will be skipped because no thought
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'valid-id',
            toolName: 'sequentialThinking',
            args: {
              thought: 'Valid message after error',
            },
          },
        ],
      },
    ];

    const result = formatLlmMessagesAsReasoning(messages);

    // First message is skipped because sequentialThinking without args.thought returns null
    // Second message is processed
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('message', 'Valid message after error');
  });

  test('handles messages with complex content arrays', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test-id',
            toolName: 'sequentialThinking',
            args: {
              thought: 'Processing complex content',
            },
          },
        ],
      },
    ];

    const result = formatLlmMessagesAsReasoning(messages);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('message', 'Processing complex content');
  });
});
