import type { ToolCallOptions } from 'ai';
import { describe, expect, test, vi } from 'vitest';
import type {
  SequentialThinkingContext,
  SequentialThinkingInput,
  SequentialThinkingState,
} from './sequential-thinking-tool';
import { createSequentialThinkingDelta } from './sequential-thinking-tool-delta';
import { createSequentialThinkingFinish } from './sequential-thinking-tool-finish';
import { createSequentialThinkingStart } from './sequential-thinking-tool-start';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Sequential Thinking Tool Streaming Tests', () => {
  const mockContext: SequentialThinkingContext = {
    messageId: 'test-message-id-123',
  };

  describe('createSequentialThinkingStart', () => {
    test('should initialize state with entry_id on start', async () => {
      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: undefined,
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const startHandler = createSequentialThinkingStart(state, mockContext);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-123',
        messages: [],
      };

      await startHandler(options);

      expect(state.toolCallId).toBe('tool-call-123');
    });
  });

  describe('createSequentialThinkingDelta', () => {
    test('should accumulate delta text to args', async () => {
      const state: SequentialThinkingState = {
        toolCallId: 'tool-call-123',
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const deltaHandler = createSequentialThinkingDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"thought": "Starting to think',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"thought": "Starting to think');
      expect(state.thought).toBe('Starting to think');
    });

    test('should parse partial JSON and extract thought value', async () => {
      const state: SequentialThinkingState = {
        toolCallId: 'tool-call-123',
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const deltaHandler = createSequentialThinkingDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"thought": "This is my thinking process",',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.thought).toBe('This is my thinking process');
    });

    test('should handle nextThoughtNeeded boolean value', async () => {
      const state: SequentialThinkingState = {
        toolCallId: 'tool-call-123',
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const deltaHandler = createSequentialThinkingDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"thought": "Done thinking", "nextThoughtNeeded": false',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.thought).toBe('Done thinking');
      expect(state.nextThoughtNeeded).toBe(false);
    });

    test('should handle thoughtNumber value', async () => {
      const state: SequentialThinkingState = {
        toolCallId: 'tool-call-123',
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const deltaHandler = createSequentialThinkingDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"thought": "Step one", "thoughtNumber": 1, "nextThoughtNeeded": true}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.thought).toBe('Step one');
      expect(state.thoughtNumber).toBe(1);
      expect(state.nextThoughtNeeded).toBe(true);
    });

    test('should accumulate multiple deltas correctly', async () => {
      const state: SequentialThinkingState = {
        toolCallId: 'tool-call-123',
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const deltaHandler = createSequentialThinkingDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"thought": "Let me',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.thought).toBe('Let me');

      await deltaHandler({
        inputTextDelta: ' think through this problem',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.thought).toBe('Let me think through this problem');

      await deltaHandler({
        inputTextDelta: ' step by step", "thoughtNumber": 1}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.thought).toBe('Let me think through this problem step by step');
      expect(state.thoughtNumber).toBe(1);
    });

    test('should handle escaped characters in thought', async () => {
      const state: SequentialThinkingState = {
        toolCallId: 'tool-call-123',
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const deltaHandler = createSequentialThinkingDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"thought": "Thinking about \\"quotes\\" and \\\\backslashes"',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.thought).toBe('Thinking about "quotes" and \\backslashes');
    });

    test('should not update database when state does not change', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockClear();

      const state: SequentialThinkingState = {
        toolCallId: 'tool-call-123',
        args: '{"thought": "Already set"}',
        thought: 'Already set',
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const deltaHandler = createSequentialThinkingDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(updateMessageEntries).not.toHaveBeenCalled();
    });
  });

  describe('createSequentialThinkingFinish', () => {
    test('should update state with final input values', async () => {
      const state: SequentialThinkingState = {
        toolCallId: 'tool-call-123',
        args: '{"thought": "Partial"}',
        thought: 'Partial',
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const finishHandler = createSequentialThinkingFinish(state, mockContext);

      const input: SequentialThinkingInput = {
        thought: 'This is my complete thought process for solving the problem',
        nextThoughtNeeded: false,
        thoughtNumber: 3,
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.thought).toBe('This is my complete thought process for solving the problem');
      expect(state.nextThoughtNeeded).toBe(false);
      expect(state.thoughtNumber).toBe(3);
    });

    test('should normalize escaped text in final thought', async () => {
      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: undefined,
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const finishHandler = createSequentialThinkingFinish(state, mockContext);

      const input: SequentialThinkingInput = {
        thought: 'Final thought with \\\\"escaped quotes\\\\" and \\\\\\\\backslashes',
        nextThoughtNeeded: false,
        thoughtNumber: 2,
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-789',
        messages: [],
      });

      expect(state.thought).toBe('Final thought with "escaped quotes" and \\\\backslashes');
      expect(state.toolCallId).toBe('tool-call-789');
    });

    test('should update database with completed status on finish', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockClear();

      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: undefined,
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const finishHandler = createSequentialThinkingFinish(state, mockContext);

      const input: SequentialThinkingInput = {
        thought: 'Final thought',
        nextThoughtNeeded: false,
        thoughtNumber: 5,
      };

      await finishHandler({
        input,
        toolCallId: 'final-call',
        messages: [],
      });

      // Should update state
      expect(state.toolCallId).toBe('final-call');
      expect(state.thought).toBe('Final thought');
      expect(state.nextThoughtNeeded).toBe(false);
      expect(state.thoughtNumber).toBe(5);

      // Should update database with completed status
      expect(updateMessageEntries).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: mockContext.messageId,
        })
      );
    });
  });
});
