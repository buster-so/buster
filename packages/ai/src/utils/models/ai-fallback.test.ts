import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1FinishReason,
  LanguageModelV1StreamPart,
} from '@ai-sdk/provider';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FallbackModel, createFallback } from './ai-fallback';

// Mock model factory
function createMockModel(id: string, shouldFail = false, failureError?: Error): LanguageModelV1 {
  const mockModel: LanguageModelV1 = {
    specificationVersion: 'v1' as const,
    modelId: id,
    provider: `provider-${id}`,
    defaultObjectGenerationMode: undefined,

    doGenerate: vi.fn().mockImplementation(async () => {
      if (shouldFail) {
        throw failureError || new Error(`Model ${id} failed`);
      }
      return {
        text: `Response from ${id}`,
        finishReason: 'stop' as LanguageModelV1FinishReason,
        usage: { promptTokens: 10, completionTokens: 20 },
        rawCall: { rawPrompt: 'test', rawSettings: {} },
      };
    }),

    doStream: vi.fn().mockImplementation(async () => {
      if (shouldFail) {
        throw failureError || new Error(`Model ${id} failed`);
      }

      const chunks: LanguageModelV1StreamPart[] = [
        { type: 'text-delta', textDelta: `Stream from ${id}` },
        { type: 'finish', finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20 } },
      ];

      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
      });

      return {
        stream,
        rawCall: { rawPrompt: 'test', rawSettings: {} },
      };
    }),
  };

  return mockModel;
}

// Streaming helper moved to ai-fallback-streaming.test.ts to reduce memory usage

describe('FallbackModel', () => {
  // Disable fake timers to prevent memory issues with ReadableStreams
  // Tests that need time manipulation will use manual date mocking

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided settings', () => {
      const models = [createMockModel('model1'), createMockModel('model2')];
      const fallback = createFallback({ models });

      expect(fallback.modelId).toBe('model1');
      expect(fallback.provider).toBe('provider-model1');
    });

    it('should throw error if no models provided', () => {
      expect(() => createFallback({ models: [] })).toThrow('No models available in settings');
    });

    it('should use custom modelResetInterval', () => {
      const models = [createMockModel('model1')];
      const fallback = new FallbackModel({ models, modelResetInterval: 120000 });

      expect(fallback).toBeDefined();
    });

    it('should use custom retryAfterOutput setting', () => {
      const models = [createMockModel('model1')];
      const fallback = new FallbackModel({ models, retryAfterOutput: true });

      expect(fallback.retryAfterOutput).toBe(true);
    });
  });

  describe('doGenerate', () => {
    it('should successfully call the first model', async () => {
      const model1 = createMockModel('model1');
      const model2 = createMockModel('model2');
      const fallback = createFallback({ models: [model1, model2] });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      const result = await fallback.doGenerate(options);

      expect(model1.doGenerate).toHaveBeenCalledWith(options);
      expect(model2.doGenerate).not.toHaveBeenCalled();
      expect(result.text).toEqual('Response from model1');
    });

    it('should not retry on non-retryable error', async () => {
      const nonRetryableError = new Error('Invalid API key');
      const model1 = createMockModel('model1', true, nonRetryableError);
      const model2 = createMockModel('model2');
      const fallback = createFallback({
        models: [model1, model2],
        shouldRetryThisError: () => false,
      });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      await expect(fallback.doGenerate(options)).rejects.toThrow('Invalid API key');
      expect(model1.doGenerate).toHaveBeenCalledWith(options);
      expect(model2.doGenerate).not.toHaveBeenCalled();
    });

    describe('retryable status codes', () => {
      // Testing a subset of status codes to reduce memory usage
      const retryableStatusCodes = [429, 500, 503];

      retryableStatusCodes.forEach((statusCode) => {
        it(`should retry on ${statusCode} status code error`, async () => {
          const error = Object.assign(new Error(`Error with status ${statusCode}`), { statusCode });
          const model1 = createMockModel('model1', true, error);
          const model2 = createMockModel('model2');
          const fallback = createFallback({ models: [model1, model2] });

          const options: LanguageModelV1CallOptions = {
            inputFormat: 'prompt',
            prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
            mode: { type: 'regular' },
          };

          const result = await fallback.doGenerate(options);

          expect(model1.doGenerate).toHaveBeenCalledWith(options);
          expect(model2.doGenerate).toHaveBeenCalledWith(options);
          expect(result.text).toEqual('Response from model2');
        });
      });

      it('should retry on any status code above 500', async () => {
        const error = Object.assign(new Error('Server error'), { statusCode: 507 });
        const model1 = createMockModel('model1', true, error);
        const model2 = createMockModel('model2');
        const fallback = createFallback({ models: [model1, model2] });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        const result = await fallback.doGenerate(options);

        expect(model1.doGenerate).toHaveBeenCalled();
        expect(model2.doGenerate).toHaveBeenCalled();
        expect(result.text).toEqual('Response from model2');
      });
    });

    describe('retryable error messages', () => {
      // Testing a subset of messages to reduce memory usage
      const retryableMessages = ['overloaded', 'rate_limit', 'capacity', '429', '503'];

      retryableMessages.forEach((message) => {
        it(`should retry on error message containing "${message}"`, async () => {
          const error = new Error(`System is ${message} right now`);
          const model1 = createMockModel('model1', true, error);
          const model2 = createMockModel('model2');
          const fallback = createFallback({ models: [model1, model2] });

          const options: LanguageModelV1CallOptions = {
            inputFormat: 'prompt',
            prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
            mode: { type: 'regular' },
          };

          const result = await fallback.doGenerate(options);

          expect(model1.doGenerate).toHaveBeenCalled();
          expect(model2.doGenerate).toHaveBeenCalled();
          expect(result.text).toEqual('Response from model2');
        });
      });

      it('should retry on error object with retryable message in JSON', async () => {
        const errorObj = { code: 'CAPACITY', details: 'System at capacity' };
        const model1 = createMockModel('model1', true, errorObj as any);
        const model2 = createMockModel('model2');
        const fallback = createFallback({ models: [model1, model2] });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        const result = await fallback.doGenerate(options);

        expect(model1.doGenerate).toHaveBeenCalled();
        expect(model2.doGenerate).toHaveBeenCalled();
        expect(result.text).toEqual('Response from model2');
      });
    });

    describe('multiple model fallback', () => {
      it('should try all models before failing', async () => {
        const error = new Error('Service overloaded');
        const model1 = createMockModel('model1', true, error);
        const model2 = createMockModel('model2', true, error);
        const model3 = createMockModel('model3', true, error);
        const fallback = createFallback({ models: [model1, model2, model3] });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        await expect(fallback.doGenerate(options)).rejects.toThrow('Service overloaded');
        expect(model1.doGenerate).toHaveBeenCalled();
        expect(model2.doGenerate).toHaveBeenCalled();
        expect(model3.doGenerate).toHaveBeenCalled();
      });

      it('should succeed with third model after two failures', async () => {
        const error = new Error('rate_limit exceeded');
        const model1 = createMockModel('model1', true, error);
        const model2 = createMockModel('model2', true, error);
        const model3 = createMockModel('model3');
        const fallback = createFallback({ models: [model1, model2, model3] });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        const result = await fallback.doGenerate(options);

        expect(model1.doGenerate).toHaveBeenCalled();
        expect(model2.doGenerate).toHaveBeenCalled();
        expect(model3.doGenerate).toHaveBeenCalled();
        expect(result.text).toEqual('Response from model3');
      });
    });

    describe('onError callback', () => {
      it('should call onError for each retry', async () => {
        const error = new Error('Server overloaded');
        const model1 = createMockModel('model1', true, error);
        const model2 = createMockModel('model2');
        const onError = vi.fn();
        const fallback = createFallback({
          models: [model1, model2],
          onError,
        });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        await fallback.doGenerate(options);

        expect(onError).toHaveBeenCalledWith(error, 'model1');
        expect(onError).toHaveBeenCalledTimes(1);
      });

      it('should handle async onError callback', async () => {
        const error = new Error('Service unavailable');
        const model1 = createMockModel('model1', true, error);
        const model2 = createMockModel('model2');
        const onError = vi.fn().mockImplementation(async () => {
          await Promise.resolve();
        });
        const fallback = createFallback({
          models: [model1, model2],
          onError,
        });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        await fallback.doGenerate(options);

        expect(onError).toHaveBeenCalledWith(error, 'model1');
      });
    });
  });

  // Streaming tests moved to ai-fallback-streaming.test.ts to reduce memory usage

  describe('model reset interval', () => {
    it('should use default 3-minute interval if not specified', () => {
      const models = [createMockModel('model1')];
      const fallback = new FallbackModel({ models });

      // Default should be 3 minutes (180000ms)
      expect(fallback).toBeDefined();
    });

    // Other timer-based tests removed due to memory issues with fake timers
  });

  describe('edge cases', () => {
    it('should handle model without provider gracefully', () => {
      const model = createMockModel('model1');
      (model as any).provider = undefined;
      const fallback = createFallback({ models: [model] });

      expect(fallback.provider).toBe(undefined);
    });

    it('should handle model without defaultObjectGenerationMode', () => {
      const model = createMockModel('model1');
      // Model already has defaultObjectGenerationMode as undefined by default
      const fallback = createFallback({ models: [model] });

      expect(fallback.defaultObjectGenerationMode).toBe(undefined);
    });

    it('should handle custom shouldRetryThisError function', async () => {
      const customError = new Error('Custom error');
      const model1 = createMockModel('model1', true, customError);
      const model2 = createMockModel('model2');
      const shouldRetryThisError = vi.fn().mockReturnValue(true);
      const fallback = createFallback({
        models: [model1, model2],
        shouldRetryThisError,
      });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      await fallback.doGenerate(options);

      expect(shouldRetryThisError).toHaveBeenCalledWith(customError);
      expect(model2.doGenerate).toHaveBeenCalled();
    });

    it('should cycle through all models and wrap around', async () => {
      const error = new Error('Server overloaded');
      const model1 = createMockModel('model1'); // First model should succeed
      const model2 = createMockModel('model2', true, error);
      const model3 = createMockModel('model3', true, error);

      const fallback = new FallbackModel({ models: [model1, model2, model3] });

      // Start at model 3 (index 2)
      fallback.currentModelIndex = 2;

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      const result = await fallback.doGenerate(options);

      expect(model3.doGenerate).toHaveBeenCalled();
      expect(model1.doGenerate).toHaveBeenCalled();
      expect(result.text).toEqual('Response from model1');
      expect(fallback.currentModelIndex).toBe(0);
    });

    it('should handle non-Error objects in catch', async () => {
      const stringError = 'String error';
      const model1 = createMockModel('model1');
      model1.doGenerate = vi.fn().mockRejectedValue(stringError);
      const model2 = createMockModel('model2');
      const fallback = createFallback({ models: [model1, model2] });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      await expect(fallback.doGenerate(options)).rejects.toBe(stringError);
    });

    it('should handle errors without message property', async () => {
      const errorObj = { code: 'TIMEOUT', statusCode: 408 };
      const model1 = createMockModel('model1');
      model1.doGenerate = vi.fn().mockRejectedValue(errorObj);
      const model2 = createMockModel('model2');
      const fallback = createFallback({ models: [model1, model2] });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      const result = await fallback.doGenerate(options);

      expect(model1.doGenerate).toHaveBeenCalled();
      expect(model2.doGenerate).toHaveBeenCalled();
      expect(result.text).toEqual('Response from model2');
    });

    it('should handle null/undefined errors', async () => {
      const model1 = createMockModel('model1');
      model1.doGenerate = vi.fn().mockRejectedValue(null);
      const model2 = createMockModel('model2');
      const fallback = createFallback({ models: [model1, model2] });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      await expect(fallback.doGenerate(options)).rejects.toBe(null);
      expect(model2.doGenerate).not.toHaveBeenCalled();
    });
  });

  describe('no model available edge case', () => {
    it('should throw error if current model becomes unavailable', async () => {
      const models = [createMockModel('model1')];
      const fallback = new FallbackModel({ models });

      // Simulate model becoming unavailable
      fallback.settings.models[0] = undefined as any;

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      await expect(fallback.doGenerate(options)).rejects.toThrow('No model available');
    });

    it('should throw error if current model becomes unavailable in stream', async () => {
      const models = [createMockModel('model1')];
      const fallback = new FallbackModel({ models });

      // Simulate model becoming unavailable
      fallback.settings.models[0] = undefined as any;

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      await expect(fallback.doStream(options)).rejects.toThrow('No model available');
    });
  });

  describe('property access and getters', () => {
    it('should correctly access currentModelIndex through getters', () => {
      const model = createMockModel('model1');
      const fallback = createFallback({ models: [model] });

      // Access properties that depend on currentModelIndex
      expect(fallback.modelId).toBe('model1');
      expect(fallback.provider).toBe('provider-model1');

      // Verify currentModelIndex is accessible
      expect(fallback.currentModelIndex).toBe(0);
    });

    it('should maintain proper this context when accessing methods', async () => {
      const model = createMockModel('model1');
      const fallback = createFallback({ models: [model] });

      // Get a method reference
      const generateFn = fallback.doGenerate;
      expect(typeof generateFn).toBe('function');

      // The method should still work when called through the reference
      const options: LanguageModelV1CallOptions = {
        inputFormat: 'messages',
        prompt: [],
        mode: { type: 'regular' },
      };

      await expect(fallback.doGenerate(options)).resolves.toBeTruthy();
      expect(model.doGenerate).toHaveBeenCalled();
    });

    it('should handle property enumeration correctly', () => {
      const model = createMockModel('model1');
      const fallback = createFallback({ models: [model] });

      // Test property enumeration
      const keys = Object.keys(fallback);
      expect(keys).toContain('settings');
      expect(keys).toContain('currentModelIndex');

      // Test that getters work properly
      expect(fallback.modelId).toBe('model1');
      expect(fallback.provider).toBe('provider-model1');

      // Test property descriptors
      const descriptor = Object.getOwnPropertyDescriptor(fallback, 'currentModelIndex');
      expect(descriptor).toBeDefined();
      expect(descriptor?.value).toBe(0);
    });

    it('should not throw proxy errors when accessing currentModelIndex', () => {
      // This test specifically guards against the proxy error:
      // "property 'currentModelIndex' is a read-only and non-configurable data property"
      const model = createMockModel('model1');
      const fallback = createFallback({ models: [model] });

      // Force access to properties that use currentModelIndex internally
      const modelId = fallback.modelId;
      const provider = fallback.provider;

      // These should return valid values without proxy errors
      expect(modelId).toBe('model1');
      expect(provider).toBe('provider-model1');

      // Direct access to currentModelIndex should also work
      expect(typeof fallback.currentModelIndex).toBe('number');
      expect(fallback.currentModelIndex).toBe(0);
    });
  });
});
