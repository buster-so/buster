import type { ModelMessage } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type StreamExecutor,
  calculateBackoffDelay,
  composeMiddleware,
  createMockAgent,
  createOverloadedError,
  createRetryExecutor,
  executeStreamAttempt,
  handleFailedAttempt,
  isOverloadedError,
  recoverMessages,
  retryMiddleware,
  retryStream,
  sleep,
  withAgentRetry,
} from './with-agent-retry';

// Mock fetchMessageEntries
vi.mock('@buster/database/queries', () => ({
  fetchMessageEntries: vi.fn(),
}));

import { fetchMessageEntries } from '@buster/database/queries';
const mockFetchMessageEntries = vi.mocked(fetchMessageEntries);

describe('with-agent-retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Pure Functions', () => {
    describe('isOverloadedError', () => {
      it('should detect direct overloaded error format', () => {
        expect(isOverloadedError({ type: 'overloaded_error', message: 'Overloaded' })).toBe(true);
      });

      it('should detect wrapped overloaded error', () => {
        expect(
          isOverloadedError({ data: { type: 'overloaded_error', message: 'Overloaded' } })
        ).toBe(true);
      });

      it('should detect error with overloaded message', () => {
        expect(isOverloadedError(new Error('System is overloaded'))).toBe(true);
        expect(isOverloadedError({ message: 'overloaded_error occurred' })).toBe(true);
      });

      it('should not detect non-overloaded errors', () => {
        expect(isOverloadedError(new Error('Regular error'))).toBe(false);
        expect(isOverloadedError({ type: 'other_error' })).toBe(false);
        expect(isOverloadedError(null)).toBe(false);
        expect(isOverloadedError(undefined)).toBe(false);
        expect(isOverloadedError('string error')).toBe(false);
        expect(isOverloadedError(123)).toBe(false);
        expect(isOverloadedError([])).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isOverloadedError({ message: null })).toBe(false);
        expect(isOverloadedError({ message: 123 })).toBe(false);
        expect(isOverloadedError({ data: null })).toBe(false);
        expect(isOverloadedError({ data: { type: 'wrong' } })).toBe(false);
      });
    });

    describe('calculateBackoffDelay', () => {
      it('should calculate exponential backoff correctly', () => {
        expect(calculateBackoffDelay(1, 1000)).toBe(1000);
        expect(calculateBackoffDelay(2, 1000)).toBe(2000);
        expect(calculateBackoffDelay(3, 1000)).toBe(4000);
        expect(calculateBackoffDelay(4, 1000)).toBe(8000);
      });

      it('should work with different base delays', () => {
        expect(calculateBackoffDelay(1, 500)).toBe(500);
        expect(calculateBackoffDelay(2, 500)).toBe(1000);
        expect(calculateBackoffDelay(3, 500)).toBe(2000);
      });
    });

    describe('sleep', () => {
      it('should resolve after specified duration', async () => {
        const startTime = Date.now();
        await sleep(100);
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeGreaterThanOrEqual(95); // Allow small variance
        expect(elapsed).toBeLessThan(150);
      });
    });
  });

  describe('Message Recovery', () => {
    describe('recoverMessages', () => {
      it('should return recovered messages when available', async () => {
        const recoveredMessages: ModelMessage[] = [
          { role: 'user', content: 'recovered1' },
          { role: 'assistant', content: 'recovered2' },
        ];
        const currentMessages: ModelMessage[] = [{ role: 'user', content: 'current' }];

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: recoveredMessages,
          responseMessages: [],
          reasoning: [],
        });

        const result = await recoverMessages('test-id', currentMessages);
        expect(result).toEqual(recoveredMessages);
        expect(mockFetchMessageEntries).toHaveBeenCalledWith('test-id');
      });

      it('should return current messages when no recovered messages available', async () => {
        const currentMessages: ModelMessage[] = [{ role: 'user', content: 'current' }];

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: [],
          responseMessages: [],
          reasoning: [],
        });

        const result = await recoverMessages('test-id', currentMessages);
        expect(result).toEqual(currentMessages);
      });

      it('should throw when database returns null', async () => {
        mockFetchMessageEntries.mockResolvedValue(null);

        await expect(recoverMessages('test-id', [])).rejects.toThrow(
          'Cannot retry: message entries not found for test-id'
        );
      });

      it('should throw when database fetch fails', async () => {
        mockFetchMessageEntries.mockRejectedValue(new Error('DB error'));

        await expect(recoverMessages('test-id', [])).rejects.toThrow('DB error');
      });
    });
  });

  describe('Stream Execution', () => {
    describe('executeStreamAttempt', () => {
      it('should execute stream and return result', async () => {
        const mockResult = { response: Promise.resolve('success') };
        const agent = createMockAgent(async () => mockResult);
        const messages: ModelMessage[] = [{ role: 'user', content: 'test' }];

        const result = await executeStreamAttempt(agent, messages, 1, 3, 'test-id');

        expect(result).toEqual(mockResult);
      });
    });

    describe('handleFailedAttempt', () => {
      it('should prepare for retry on overloaded error', async () => {
        const recoveredMessages: ModelMessage[] = [{ role: 'user', content: 'recovered' }];

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: recoveredMessages,
          responseMessages: [],
          reasoning: [],
        });

        const onRetry = vi.fn();
        const result = await handleFailedAttempt(
          createOverloadedError(),
          1,
          3,
          'test-id',
          [],
          1000,
          onRetry
        );

        expect(result.shouldRetry).toBe(true);
        expect(result.nextMessages).toEqual(recoveredMessages);
        expect(result.delayMs).toBe(1000);
        expect(onRetry).toHaveBeenCalledWith(1, 1);
      });

      it('should retry on any error (including non-overloaded)', async () => {
        const currentMessages: ModelMessage[] = [{ role: 'user', content: 'test' }];
        const recoveredMessages: ModelMessage[] = [{ role: 'user', content: 'recovered' }];

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: recoveredMessages,
          responseMessages: [],
          reasoning: [],
        });

        const result = await handleFailedAttempt(
          new Error('Regular error'),
          1,
          3,
          'test-id',
          currentMessages,
          1000
        );

        expect(result.shouldRetry).toBe(true);
        expect(result.nextMessages).toEqual(recoveredMessages);
        expect(mockFetchMessageEntries).toHaveBeenCalledWith('test-id');
      });

      it('should not retry when max attempts reached', async () => {
        const result = await handleFailedAttempt(
          createOverloadedError(),
          3,
          3,
          'test-id',
          [],
          1000
        );

        expect(result.shouldRetry).toBe(false);
        expect(mockFetchMessageEntries).not.toHaveBeenCalled();
      });

      it('should continue with original messages when recovery fails', async () => {
        mockFetchMessageEntries.mockRejectedValue(new Error('DB error'));
        const originalMessages: ModelMessage[] = [{ role: 'user', content: 'original' }];

        const result = await handleFailedAttempt(
          createOverloadedError(),
          1,
          3,
          'test-id',
          originalMessages,
          1000
        );

        // We now continue with original messages when recovery fails
        expect(result.shouldRetry).toBe(true);
        expect(result.nextMessages).toEqual(originalMessages);
        expect(result.delayMs).toBe(1000);
      });
    });
  });

  describe('Retry Logic', () => {
    describe('retryStream', () => {
      it('should succeed on first attempt', async () => {
        const mockResult = { response: Promise.resolve('success') };
        const agent = createMockAgent(async () => mockResult);

        const result = await retryStream(agent, [], { messageId: 'test-id' });

        expect(result).toEqual(mockResult);
      });

      it('should retry and succeed after any error', async () => {
        const mockResult = { response: Promise.resolve('success') };
        let callCount = 0;

        const agent = createMockAgent(async () => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Random provider error');
          }
          return mockResult;
        });

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: [],
          responseMessages: [],
          reasoning: [],
        });

        const result = await retryStream(agent, [], {
          messageId: 'test-id',
          baseDelayMs: 10,
        });

        expect(result).toEqual(mockResult);
        expect(callCount).toBe(2);
      });

      it('should retry on various error types', async () => {
        const errors = [
          new Error('Internal Server Error'),
          new Error('Service Unavailable'),
          new Error('Too Many Requests'),
          createOverloadedError(),
        ];

        let callCount = 0;
        const mockResult = { response: Promise.resolve('success') };
        const agent = createMockAgent(async () => {
          if (callCount < errors.length) {
            throw errors[callCount++];
          }
          callCount++;
          return mockResult;
        });

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: [],
          responseMessages: [],
          reasoning: [],
        });

        const result = await retryStream(agent, [], {
          messageId: 'test-id',
          maxAttempts: 5,
          baseDelayMs: 10,
        });

        expect(result).toEqual(mockResult);
        expect(callCount).toBe(5);
      });

      it('should throw after max attempts', async () => {
        const agent = createMockAgent(async () => {
          throw new Error('Persistent error');
        });

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: [],
          responseMessages: [],
          reasoning: [],
        });

        await expect(
          retryStream(agent, [], {
            messageId: 'test-id',
            maxAttempts: 2,
            baseDelayMs: 10,
          })
        ).rejects.toThrow('Persistent error');
      });

      it('should call onRetry callback', async () => {
        const onRetry = vi.fn();
        let callCount = 0;

        const agent = createMockAgent(async () => {
          callCount++;
          if (callCount <= 2) {
            throw new Error('Temporary error');
          }
          return { response: Promise.resolve('success') };
        });

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: [{ role: 'user', content: 'test' }],
          responseMessages: [],
          reasoning: [],
        });

        await retryStream(agent, [], {
          messageId: 'test-id',
          baseDelayMs: 10,
          onRetry,
        });

        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(onRetry).toHaveBeenNthCalledWith(1, 1, 1);
        expect(onRetry).toHaveBeenNthCalledWith(2, 2, 1);
      });
    });
  });

  describe('Agent Wrapper', () => {
    describe('withAgentRetry', () => {
      it('should preserve agent properties', () => {
        const agent = {
          stream: vi.fn(),
          customProperty: 'test',
          anotherMethod: () => 'result',
        };

        const wrapped = withAgentRetry(agent, { messageId: 'test-id' });

        expect(wrapped.customProperty).toBe('test');
        expect(wrapped.anotherMethod()).toBe('result');
      });

      it('should wrap stream method with retry logic', async () => {
        const mockResult = { response: Promise.resolve('success') };
        const mockStreamFn = vi.fn().mockResolvedValue(mockResult);
        const agent = { stream: mockStreamFn };

        const wrapped = withAgentRetry(agent, { messageId: 'test-id' });
        const result = await wrapped.stream({ messages: [] });

        expect(result).toEqual(mockResult);
        expect(mockStreamFn).toHaveBeenCalledWith({ messages: [] });
      });

      it('should handle retries through wrapper', async () => {
        let callCount = 0;
        const mockStreamFn = vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            throw createOverloadedError();
          }
          return { response: Promise.resolve('success') };
        });

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: [],
          responseMessages: [],
          reasoning: [],
        });

        const agent = { stream: mockStreamFn };
        const wrapped = withAgentRetry(agent, {
          messageId: 'test-id',
          baseDelayMs: 10,
        });

        const result = await wrapped.stream({ messages: [] });

        expect(result.response).toBeDefined();
        expect(mockStreamFn).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Functional Composition', () => {
    describe('createRetryExecutor', () => {
      it('should create a retry-wrapped executor', async () => {
        let callCount = 0;
        const executor = async () => {
          callCount++;
          if (callCount === 1) {
            throw createOverloadedError();
          }
          return { response: Promise.resolve('success') };
        };

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: [],
          responseMessages: [],
          reasoning: [],
        });

        const retryExecutor = createRetryExecutor(executor, {
          messageId: 'test-id',
          baseDelayMs: 10,
        });

        const result = await retryExecutor([]);
        expect(result.response).toBeDefined();
        expect(callCount).toBe(2);
      });
    });

    describe('composeMiddleware', () => {
      it('should compose multiple middleware functions', async () => {
        const messages: ModelMessage[] = [];
        const callOrder: string[] = [];

        const middleware1 = (next: StreamExecutor<unknown>) => async (msgs: ModelMessage[]) => {
          callOrder.push('middleware1-before');
          const result = await next(msgs);
          callOrder.push('middleware1-after');
          return result;
        };

        const middleware2 = (next: StreamExecutor<unknown>) => async (msgs: ModelMessage[]) => {
          callOrder.push('middleware2-before');
          const result = await next(msgs);
          callOrder.push('middleware2-after');
          return result;
        };

        const baseExecutor = async (msgs: ModelMessage[]) => {
          callOrder.push('executor');
          return { response: Promise.resolve('success') };
        };

        const composed = composeMiddleware(middleware1, middleware2)(baseExecutor);
        await composed(messages);

        expect(callOrder).toEqual([
          'middleware1-before',
          'middleware2-before',
          'executor',
          'middleware2-after',
          'middleware1-after',
        ]);
      });
    });

    describe('retryMiddleware', () => {
      it('should add retry behavior as middleware', async () => {
        let callCount = 0;
        const baseExecutor = async () => {
          callCount++;
          if (callCount === 1) {
            throw createOverloadedError();
          }
          return { response: Promise.resolve('success') };
        };

        mockFetchMessageEntries.mockResolvedValue({
          rawLlmMessages: [],
          responseMessages: [],
          reasoning: [],
        });

        const withRetry = retryMiddleware({
          messageId: 'test-id',
          baseDelayMs: 10,
        })(baseExecutor);

        const result = (await withRetry([])) as { response: Promise<string> };
        expect(result.response).toBeDefined();
        expect(callCount).toBe(2);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle errors during stream consumption', async () => {
      const agent = createMockAgent(async () => {
        throw new Error('Stream error');
      });

      await expect(retryStream(agent, [], { messageId: 'test-id' })).rejects.toThrow(
        'Stream error'
      );
    });

    it('should handle partial retries with different error types', async () => {
      let callCount = 0;
      const agent = createMockAgent(async () => {
        callCount++;
        if (callCount === 1) {
          throw createOverloadedError();
        }
        if (callCount === 2) {
          throw new Error('Different error');
        }
        return { response: Promise.resolve('success') };
      });

      mockFetchMessageEntries.mockResolvedValue({
        rawLlmMessages: [],
        responseMessages: [],
        reasoning: [],
      });

      const result = await retryStream(agent, [], {
        messageId: 'test-id',
        baseDelayMs: 10,
      });

      expect(result).toEqual({ response: Promise.resolve('success') });
      expect(callCount).toBe(3);
    });

    it('should maintain message state across retries', async () => {
      const initialMessages: ModelMessage[] = [{ role: 'user', content: 'initial' }];
      const recoveredMessages: ModelMessage[] = [
        { role: 'user', content: 'initial' },
        { role: 'assistant', content: 'response' },
        { role: 'user', content: 'follow-up' },
      ];

      let callCount = 0;
      const receivedMessages: ModelMessage[][] = [];

      const agent = {
        stream: vi.fn().mockImplementation(async ({ messages }) => {
          receivedMessages.push(messages);
          callCount++;
          if (callCount === 1) {
            throw createOverloadedError();
          }
          return { response: Promise.resolve('success') };
        }),
      };

      mockFetchMessageEntries.mockResolvedValue({
        rawLlmMessages: recoveredMessages,
        responseMessages: [],
        reasoning: [],
      });

      const wrapped = withAgentRetry(agent, {
        messageId: 'test-id',
        baseDelayMs: 10,
      });

      await wrapped.stream({ messages: initialMessages });

      expect(receivedMessages[0]).toEqual(initialMessages);
      expect(receivedMessages[1]).toEqual(recoveredMessages);
    });
  });

  describe('Performance and Timing', () => {
    it('should respect exponential backoff timing', async () => {
      let callCount = 0;
      const agent = createMockAgent(async () => {
        callCount++;
        if (callCount <= 2) {
          throw createOverloadedError();
        }
        return { response: Promise.resolve('success') };
      });

      mockFetchMessageEntries.mockResolvedValue({
        rawLlmMessages: [],
        responseMessages: [],
        reasoning: [],
      });

      const startTime = Date.now();

      await retryStream(agent, [], {
        messageId: 'test-id',
        maxAttempts: 3,
        baseDelayMs: 100,
      });

      const elapsed = Date.now() - startTime;

      // Should wait 100ms after first failure and 200ms after second
      // Total minimum: 300ms
      expect(elapsed).toBeGreaterThanOrEqual(290); // Allow small variance
      expect(callCount).toBe(3);
    });
  });
});
