import { NoSuchToolError } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { RetryWithHealingError } from './retry-error';
import {
  calculateBackoffDelay,
  createRetryOnErrorHandler,
  createUserFriendlyErrorMessage,
  extractDetailedErrorMessage,
  findHealingMessageInsertionIndex,
  handleRetryWithHealing,
  logMessagesAfterHealing,
  logRetryInfo,
} from './retry-helpers';
import type { CoreMessage, RetryableError } from './types';

// Mock the detectRetryableError function
vi.mock('../../../src/utils/retry/retry-agent-stream', () => ({
  detectRetryableError: vi.fn(),
}));

// Import the mocked function
import { detectRetryableError } from './retry-agent-stream';

describe('retry-helpers', () => {
  describe('createRetryOnErrorHandler', () => {
    it('should return early when max retries reached', async () => {
      const handler = createRetryOnErrorHandler({
        retryCount: 5,
        maxRetries: 5,
        workflowContext: { currentStep: 'think-and-prep' },
      });

      const error = new Error('Test error');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      await expect(handler({ error })).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'think-and-prep stream error caught in onError:',
        error
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('think-and-prep onError: Max retries reached', {
        retryCount: 5,
        maxRetries: 5,
      });

      consoleErrorSpy.mockRestore();
    });

    it('should throw RetryWithHealingError when specific healing strategy exists', async () => {
      const handler = createRetryOnErrorHandler({
        retryCount: 2,
        maxRetries: 5,
        workflowContext: { currentStep: 'think-and-prep' },
      });

      const error = new Error('Test error');
      const healingMessage: CoreMessage = {
        role: 'user',
        content: 'Healing message',
      };

      const retryableError: RetryableError = {
        type: 'no-such-tool',
        healingMessage,
        originalError: error,
      };

      (detectRetryableError as any).mockReturnValue(retryableError);

      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(handler({ error })).rejects.toThrow(RetryWithHealingError);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'think-and-prep onError: Setting up retry with specific healing',
        {
          retryCount: 3,
          maxRetries: 5,
          errorType: 'no-such-tool',
          healingMessage,
        }
      );

      consoleInfoSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should create generic healing message for unknown errors', async () => {
      const handler = createRetryOnErrorHandler({
        retryCount: 1,
        maxRetries: 5,
        workflowContext: { currentStep: 'think-and-prep' },
      });

      const error = new Error('Unknown error');
      (detectRetryableError as any).mockReturnValue(null);

      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError: any;
      try {
        await handler({ error });
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeInstanceOf(RetryWithHealingError);
      expect(thrownError.retryableError.type).toBe('unknown-error');
      expect(thrownError.retryableError.healingMessage.content).toContain('Unknown error');

      consoleInfoSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('extractDetailedErrorMessage', () => {
    it('should extract basic error message', () => {
      const error = new Error('Basic error');
      expect(extractDetailedErrorMessage(error)).toBe('Basic error');
    });

    it('should extract Zod validation errors', () => {
      const error = new Error('Validation failed');
      (error as any).cause = {
        errors: [
          { path: ['field', 'nested'], message: 'Required' },
          { path: ['other'], message: 'Invalid' },
        ],
      };

      const result = extractDetailedErrorMessage(error);
      expect(result).toBe(
        'Validation failed - Validation errors: field.nested: Required; other: Invalid'
      );
    });

    it('should include status code for API errors', () => {
      const error = new Error('API error');
      (error as any).statusCode = 404;

      const result = extractDetailedErrorMessage(error);
      expect(result).toBe('API error (Status: 404)');
    });

    it('should include response body for API errors', () => {
      const error = new Error('API error');
      (error as any).responseBody = { error: 'Not found', details: 'Resource missing' };

      const result = extractDetailedErrorMessage(error);
      expect(result).toContain('API error - Response: {"error":"Not found"');
    });

    it('should include tool name for tool errors', () => {
      const error = new Error('Tool error');
      (error as any).toolName = 'myTool';

      const result = extractDetailedErrorMessage(error);
      expect(result).toBe('Tool error (Tool: myTool)');
    });

    it('should include available tools for NoSuchToolError', () => {
      const error = new Error('Tool not found');
      (error as any).availableTools = ['tool1', 'tool2', 'tool3'];

      const result = extractDetailedErrorMessage(error);
      expect(result).toBe('Tool not found - Available tools: tool1, tool2, tool3');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      expect(extractDetailedErrorMessage(error)).toBe('String error');

      const objError = { message: 'Object error' };
      expect(extractDetailedErrorMessage(objError)).toBe('[object Object]');
    });

    it('should combine multiple error details', () => {
      const error = new Error('Complex error');
      (error as any).statusCode = 500;
      (error as any).toolName = 'complexTool';
      (error as any).responseBody = 'Server error details';

      const result = extractDetailedErrorMessage(error);
      expect(result).toBe(
        'Complex error (Status: 500) - Response: Server error details (Tool: complexTool)'
      );
    });
  });

  describe('findHealingMessageInsertionIndex', () => {
    it('should return end index for non-NoSuchToolError', () => {
      const retryableError: RetryableError = {
        type: 'unknown-error',
        healingMessage: { role: 'user', content: 'Healing' },
        originalError: new Error(),
      };

      const messages: CoreMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ];

      const result = findHealingMessageInsertionIndex(retryableError, messages);
      expect(result.insertionIndex).toBe(2);
      expect(result.updatedHealingMessage).toBe(retryableError.healingMessage);
    });

    it('should find correct insertion point for NoSuchToolError', () => {
      const healingMessage: CoreMessage = {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'placeholder',
            toolName: 'missingTool',
            result: { error: 'Tool not found' },
          },
        ],
      };

      const retryableError: RetryableError = {
        type: 'no-such-tool',
        healingMessage,
        originalError: new NoSuchToolError({
          toolName: 'missingTool',
          availableTools: ['tool1', 'tool2'],
        }),
      };

      const messages: CoreMessage[] = [
        { role: 'user', content: 'Do something' },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call123',
              toolName: 'missingTool',
              args: {},
            },
          ],
        },
        { role: 'user', content: 'Another message' },
      ];

      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const result = findHealingMessageInsertionIndex(retryableError, messages);

      expect(result.insertionIndex).toBe(2); // After assistant message
      expect((result.updatedHealingMessage.content as any)[0].toolCallId).toBe('call123');

      consoleInfoSpy.mockRestore();
    });

    it('should handle assistant message with existing tool results', () => {
      const healingMessage: CoreMessage = {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'placeholder',
            toolName: 'missingTool',
            result: { error: 'Tool not found' },
          },
        ],
      };

      const retryableError: RetryableError = {
        type: 'no-such-tool',
        healingMessage,
        originalError: new Error(),
      };

      const messages: CoreMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call1',
              toolName: 'existingTool',
              args: {},
            },
            {
              type: 'tool-call',
              toolCallId: 'call2',
              toolName: 'missingTool',
              args: {},
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call1',
              toolName: 'existingTool',
              result: { data: 'success' },
            },
          ],
        },
      ];

      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const result = findHealingMessageInsertionIndex(retryableError, messages);

      expect(result.insertionIndex).toBe(1); // After the assistant message (before the tool result)
      expect((result.updatedHealingMessage.content as any)[0].toolCallId).toBe('call2');

      consoleInfoSpy.mockRestore();
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      expect(calculateBackoffDelay(0)).toBe(1000); // 1 * 2^0 * 1000 = 1000
      expect(calculateBackoffDelay(1)).toBe(2000); // 1 * 2^1 * 1000 = 2000
      expect(calculateBackoffDelay(2)).toBe(4000); // 1 * 2^2 * 1000 = 4000
      expect(calculateBackoffDelay(3)).toBe(8000); // 1 * 2^3 * 1000 = 8000
    });

    it('should respect max delay', () => {
      expect(calculateBackoffDelay(4)).toBe(10000); // Would be 16000, capped at 10000
      expect(calculateBackoffDelay(5)).toBe(10000); // Would be 32000, capped at 10000
    });

    it('should respect custom max delay', () => {
      expect(calculateBackoffDelay(2, 3000)).toBe(3000); // Would be 4000, capped at 3000
      expect(calculateBackoffDelay(1, 1500)).toBe(1500); // Would be 2000, capped at 1500
    });
  });

  describe('createUserFriendlyErrorMessage', () => {
    it('should return database connection message for DATABASE_URL errors', () => {
      const error = new Error('Cannot connect to DATABASE_URL');
      expect(createUserFriendlyErrorMessage(error)).toBe(
        'Unable to connect to the analysis service. Please try again later.'
      );
    });

    it('should return API unavailable message for API/model errors', () => {
      const apiError = new Error('API request failed');
      expect(createUserFriendlyErrorMessage(apiError)).toBe(
        'The analysis service is temporarily unavailable. Please try again in a few moments.'
      );

      const modelError = new Error('model not responding');
      expect(createUserFriendlyErrorMessage(modelError)).toBe(
        'The analysis service is temporarily unavailable. Please try again in a few moments.'
      );
    });

    it('should return generic message for other errors', () => {
      const error = new Error('Random error');
      expect(createUserFriendlyErrorMessage(error)).toBe(
        'Something went wrong during the analysis. Please try again or contact support if the issue persists.'
      );
    });

    it('should handle non-Error objects', () => {
      expect(createUserFriendlyErrorMessage('string error')).toBe(
        'Something went wrong during the analysis. Please try again or contact support if the issue persists.'
      );
    });
  });

  describe('logRetryInfo', () => {
    it('should log retry information correctly', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const retryableError: RetryableError = {
        type: 'no-such-tool',
        healingMessage: { role: 'user', content: 'Healing' },
        originalError: new Error(),
      };

      logRetryInfo('TestStep', retryableError, 2, 5, 10, 4000, retryableError.healingMessage);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'TestStep: Retrying with healing message after backoff',
        {
          retryCount: 2,
          errorType: 'no-such-tool',
          insertionIndex: 5,
          totalMessages: 10,
          backoffDelay: 4000,
          healingMessageRole: 'user',
          healingMessageContent: 'Healing',
        }
      );

      consoleInfoSpy.mockRestore();
    });
  });

  describe('logMessagesAfterHealing', () => {
    it('should log message state correctly', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const healingMessage: CoreMessage = { role: 'user', content: 'Healing' };
      const messages: CoreMessage[] = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Second' },
        healingMessage,
        { role: 'user', content: 'Third' },
      ];

      logMessagesAfterHealing('TestStep', 3, messages, 2, healingMessage);

      expect(consoleInfoSpy).toHaveBeenCalledWith('TestStep: Messages after healing insertion', {
        originalCount: 3,
        updatedCount: 4,
        insertionIndex: 2,
        healingMessageIndex: 2,
        lastThreeMessages: [
          { role: 'assistant', content: 'Second' },
          { role: 'user', content: 'Healing' },
          { role: 'user', content: 'Third' },
        ],
      });

      consoleInfoSpy.mockRestore();
    });

    it('should handle complex message content', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const healingMessage: CoreMessage = {
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: '123', toolName: 'testTool', result: 'Result' },
        ],
      };

      const messages: CoreMessage[] = [
        { role: 'user', content: 'A'.repeat(200) }, // Long content
        healingMessage,
      ];

      logMessagesAfterHealing('TestStep', 1, messages, 1, healingMessage);

      const logCall = consoleInfoSpy.mock.calls[0];
      const loggedData = logCall![1] as any;
      expect(loggedData.lastThreeMessages[0].content).toBe('A'.repeat(100)); // Truncated

      consoleInfoSpy.mockRestore();
    });
  });

  describe('handleRetryWithHealing', () => {
    it('should handle network errors without healing', async () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const retryableError: RetryableError = {
        type: 'network-timeout',
        healingMessage: { role: 'user', content: 'Network error' },
        originalError: new Error('ETIMEDOUT'),
      };

      const messages: CoreMessage[] = [
        { role: 'user', content: 'Analyze data' },
        { role: 'assistant', content: 'Processing...' },
      ];

      const result = await handleRetryWithHealing(retryableError, messages, 2, {
        currentStep: 'analyst',
      });

      expect(result.shouldContinueWithoutHealing).toBe(true);
      expect(result.healedMessages).toEqual(messages); // Messages unchanged
      expect(result.backoffDelay).toBeGreaterThan(4000); // 2^2 * 1000 * 2 (multiplier)

      consoleInfoSpy.mockRestore();
    });

    it('should handle empty response by removing message', async () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const retryableError: RetryableError = {
        type: 'empty-response',
        healingMessage: { role: 'user', content: 'Please continue.' },
        originalError: new Error('Empty response'),
      };

      const messages: CoreMessage[] = [
        { role: 'user', content: 'Tell me about revenue' },
        { role: 'assistant', content: '' }, // Empty response
      ];

      const result = await handleRetryWithHealing(retryableError, messages, 1, {
        currentStep: 'think-and-prep',
      });

      expect(result.shouldContinueWithoutHealing).toBe(false);
      expect(result.healedMessages).toHaveLength(2);
      expect(result.healedMessages[0]?.content).toBe('Tell me about revenue');
      expect(result.healedMessages[1]?.content).toBe('Please continue with your preparation.');
      expect(result.backoffDelay).toBe(2000); // 2^1 * 1000

      consoleInfoSpy.mockRestore();
    });

    it('should handle tool errors with proper insertion', async () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const retryableError: RetryableError = {
        type: 'no-such-tool',
        healingMessage: {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'placeholder',
              toolName: 'invalidTool',
              result: { error: 'Tool not found' },
            },
          ],
        },
        originalError: new NoSuchToolError({
          toolName: 'invalidTool',
          availableTools: ['tool1', 'tool2'],
        }),
      };

      const messages: CoreMessage[] = [
        { role: 'user', content: 'Do something' },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call123',
              toolName: 'invalidTool',
              args: {},
            },
          ],
        },
      ];

      const result = await handleRetryWithHealing(retryableError, messages, 0, {
        currentStep: 'analyst',
      });

      expect(result.shouldContinueWithoutHealing).toBe(false);
      expect(result.healedMessages).toHaveLength(3);
      expect(result.healedMessages[2]?.role).toBe('tool');
      expect((result.healedMessages[2]?.content[0] as any).toolCallId).toBe('call123');
      expect(result.backoffDelay).toBe(1000); // 2^0 * 1000

      consoleInfoSpy.mockRestore();
    });

    it('should handle rate limit with increased backoff', async () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const retryableError: RetryableError = {
        type: 'rate-limit',
        healingMessage: { role: 'user', content: 'Rate limited' },
        originalError: new Error('429 Too Many Requests'),
      };

      const messages: CoreMessage[] = [{ role: 'user', content: 'Query' }];

      const result = await handleRetryWithHealing(retryableError, messages, 3, {
        currentStep: 'analyst',
      });

      expect(result.shouldContinueWithoutHealing).toBe(true);
      expect(result.backoffDelay).toBe(24000); // 2^3 * 1000 * 3 (rate limit multiplier)

      consoleInfoSpy.mockRestore();
    });
  });
});
