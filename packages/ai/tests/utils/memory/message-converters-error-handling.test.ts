import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';
import {
  convertToolCallToMessage,
  extractMessagesFromToolCalls,
} from '../../../src/utils/memory/message-converters';

describe('message-converters error handling', () => {
  // Mock console.error to verify error logging
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('convertToolCallToMessage', () => {
    test('handles null toolCall gracefully', () => {
      const result = convertToolCallToMessage(null as never, null, 'completed');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'convertToolCallToMessage: Invalid toolCall:',
        null
      );
    });

    test('handles undefined toolCall gracefully', () => {
      const result = convertToolCallToMessage(undefined as never, null, 'completed');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'convertToolCallToMessage: Invalid toolCall:',
        undefined
      );
    });

    test('handles toolCall without toolName gracefully', () => {
      const toolCall = { toolCallId: 'test-id' } as never;
      const result = convertToolCallToMessage(toolCall, null, 'completed');

      expect(result).toBeNull();
    });

    test('handles invalid tool result for doneTool', () => {
      const toolCall = {
        toolName: 'doneTool',
        toolCallId: 'test-id',
      } as never;

      const result = convertToolCallToMessage(toolCall, 'invalid-result', 'completed');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse tool result:',
        expect.any(Error),
        'invalid-result'
      );
    });

    test('handles invalid JSON in sequential thinking result', () => {
      const toolCall = {
        toolName: 'sequentialThinking',
        toolCallId: 'test-id',
      } as never;

      const result = convertToolCallToMessage(toolCall, { invalid: 'data' }, 'completed');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse tool result:',
        expect.any(Error),
        { invalid: 'data' }
      );
    });
  });

  describe('extractMessagesFromToolCalls', () => {
    test('handles empty array of tool calls', () => {
      const result = extractMessagesFromToolCalls([]);

      expect(result).toEqual({
        reasoningMessages: [],
        responseMessages: [],
      });
    });

    test('skips invalid tool calls', () => {
      const toolCalls = [
        null,
        undefined,
        { notAToolCall: true },
        {
          toolName: 'doneTool',
          toolCallId: 'valid-id',
        },
      ] as never;

      const toolResults = new Map([['valid-id', { message: 'Test message' }]]);

      const result = extractMessagesFromToolCalls(toolCalls, toolResults);

      expect(result.responseMessages).toHaveLength(1);
      expect(result.reasoningMessages).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3); // For null, undefined, and invalid object
    });

    test('handles missing tool results gracefully', () => {
      const toolCalls = [
        {
          toolName: 'executeSql',
          toolCallId: 'test-id',
        },
      ] as never;

      const result = extractMessagesFromToolCalls(toolCalls, new Map());

      expect(result.reasoningMessages).toHaveLength(0);
      expect(result.responseMessages).toHaveLength(0);
    });
  });
});
