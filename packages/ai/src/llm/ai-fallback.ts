import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2StreamPart,
  LanguageModelV2Usage,
  SharedV2ProviderMetadata,
} from '@ai-sdk/provider';

interface RetryableError extends Error {
  statusCode?: number;
}

interface Settings {
  models: LanguageModelV2[];
  retryAfterOutput?: boolean;
  modelResetInterval?: number;
  maxRetriesPerModel?: number;
  shouldRetryThisError?: (error: RetryableError) => boolean;
  onError?: (error: RetryableError, modelId: string) => void | Promise<void>;
}

export function createFallback(settings: Settings): FallbackModel {
  return new FallbackModel(settings);
}

const retryableStatusCodes = [
  401, // wrong API key
  403, // permission error, like cannot access model or from a non accessible region
  408, // request timeout
  409, // conflict
  413, // payload too large
  429, // too many requests/rate limits
  500, // server error (and above)
];
// Common error messages/codes that indicate server overload or temporary issues
const retryableErrors = [
  'overloaded',
  'service unavailable',
  'bad gateway',
  'too many requests',
  'internal server error',
  'gateway timeout',
  'rate_limit',
  'wrong-key',
  'unexpected',
  'capacity',
  'timeout',
  'server_error',
  '429', // Too Many Requests
  '500', // Internal Server Error
  '502', // Bad Gateway
  '503', // Service Unavailable
  '504', // Gateway Timeout
];

function defaultShouldRetryThisError(error: RetryableError): boolean {
  // Handle null/undefined errors
  if (!error) return false;

  const statusCode = error.statusCode;

  if (statusCode && (retryableStatusCodes.includes(statusCode) || statusCode >= 500)) {
    return true;
  }

  if (error.message) {
    const errorString = error.message.toLowerCase();
    return retryableErrors.some((errType) => errorString.includes(errType));
  }

  // Check error object properties for retryable patterns
  if (typeof error === 'object') {
    try {
      const errorString = JSON.stringify(error).toLowerCase();
      return retryableErrors.some((errType) => errorString.includes(errType));
    } catch {
      // JSON.stringify can throw on circular references
      return false;
    }
  }
  return false;
}

function simpleBackoff(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 10000); // 1s, 2s, 4s, 8s, max 10s
}

export class FallbackModel implements LanguageModelV2 {
  readonly specificationVersion = 'v2';

  get supportedUrls(): Record<string, RegExp[]> | PromiseLike<Record<string, RegExp[]>> {
    return this.getCurrentModel().supportedUrls;
  }

  get modelId(): string {
    return this.getCurrentModel().modelId;
  }
  readonly settings: Settings;

  private _currentModelIndex = 0;
  private lastModelReset: number = Date.now();
  private readonly modelResetInterval: number;
  retryAfterOutput: boolean;

  get currentModelIndex(): number {
    return this._currentModelIndex;
  }

  private set currentModelIndex(value: number) {
    this._currentModelIndex = value;
  }
  constructor(settings: Settings) {
    this.settings = settings;
    this.modelResetInterval = settings.modelResetInterval ?? 3 * 60 * 1000; // Default 3 minutes in ms
    this.retryAfterOutput = settings.retryAfterOutput ?? true;

    if (!this.settings.models[this._currentModelIndex]) {
      throw new Error('No models available in settings');
    }
  }

  get provider(): string {
    return this.getCurrentModel().provider;
  }

  private getCurrentModel(): LanguageModelV2 {
    const model = this.settings.models[this._currentModelIndex];
    if (!model) {
      throw new Error(`No model available at index ${this._currentModelIndex}`);
    }
    console.info(
      `[Fallback] Using model: ${model.modelId} (index: ${this._currentModelIndex}/${this.settings.models.length - 1})`
    );
    return model;
  }

  private checkAndResetModel() {
    // Only reset if we're not already on the primary model
    if (this.currentModelIndex === 0) return;

    const now = Date.now();
    if (now - this.lastModelReset >= this.modelResetInterval) {
      // Reset to primary model
      console.info(
        `[Fallback] Resetting to primary model after ${this.modelResetInterval}ms timeout`
      );
      this.currentModelIndex = 0;
      this.lastModelReset = now;
    }
  }

  private switchToNextModel() {
    const previousModel = this.settings.models[this.currentModelIndex]?.modelId || 'unknown';
    this.currentModelIndex = (this.currentModelIndex + 1) % this.settings.models.length;
    const nextModel = this.settings.models[this.currentModelIndex]?.modelId || 'unknown';
    console.warn(`Switching from model ${previousModel} to ${nextModel} due to error`);
  }

  private async retry<T>(fn: () => PromiseLike<T>): Promise<T> {
    let lastError: RetryableError | undefined;
    const initialModel = this.currentModelIndex;
    const maxRetriesPerModel = this.settings.maxRetriesPerModel ?? 2;

    do {
      let modelRetryCount = 0;

      // Retry current model up to maxRetriesPerModel times
      while (modelRetryCount < maxRetriesPerModel) {
        try {
          const result = await fn();
          if (modelRetryCount > 0 || this.currentModelIndex !== initialModel) {
            console.info(
              `[Fallback] Request succeeded on model ${this.modelId} after ${modelRetryCount} retries`
            );
          }
          return result;
        } catch (error) {
          lastError = error as RetryableError;
          const shouldRetry = this.settings.shouldRetryThisError || defaultShouldRetryThisError;

          if (!shouldRetry(lastError)) {
            throw lastError; // Non-retryable error
          }

          if (this.settings.onError) {
            try {
              await this.settings.onError(lastError, this.modelId);
            } catch {
              // Don't let onError callback failures break the retry logic
            }
          }

          modelRetryCount++;

          if (modelRetryCount < maxRetriesPerModel) {
            // Wait before retrying same model
            await new Promise((resolve) => setTimeout(resolve, simpleBackoff(modelRetryCount - 1)));
          }
        }
      }

      // All retries for this model exhausted, switch to next model
      console.warn(
        `Model ${this.modelId} exhausted ${maxRetriesPerModel} retries, switching to next model`
      );
      this.switchToNextModel();

      if (this.currentModelIndex === initialModel) {
        throw lastError; // Tried all models
      }
    } while (this.currentModelIndex !== initialModel);

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error('Retry failed');
  }

  doGenerate(options: LanguageModelV2CallOptions): PromiseLike<{
    content: LanguageModelV2Content[];
    finishReason: LanguageModelV2FinishReason;
    usage: LanguageModelV2Usage;
    providerMetadata?: SharedV2ProviderMetadata;
    request?: { body?: unknown };
    response?: {
      headers?: Record<string, string>;
      id?: string;
      timestamp?: Date;
      modelId?: string;
    };
    warnings: LanguageModelV2CallWarning[];
  }> {
    this.checkAndResetModel();
    return this.retry(() => this.getCurrentModel().doGenerate(options));
  }

  doStream(options: LanguageModelV2CallOptions): PromiseLike<{
    stream: ReadableStream<LanguageModelV2StreamPart>;
    request?: { body?: unknown };
    response?: { headers?: Record<string, string> };
  }> {
    this.checkAndResetModel();
    const self = this;
    const shouldRetry = this.settings.shouldRetryThisError || defaultShouldRetryThisError;
    console.info(`[Fallback] Starting stream request...`);
    return this.retry(async () => {
      const result = await self.getCurrentModel().doStream(options);

      let hasStreamedAny = false;
      // Wrap the stream to handle errors and switch providers if needed
      const wrappedStream = new ReadableStream<LanguageModelV2StreamPart>({
        async start(controller) {
          try {
            const reader = result.stream.getReader();

            let streamedChunks = 0;
            while (true) {
              const result = await reader.read();

              const { done, value } = result;
              if (!hasStreamedAny && value && typeof value === 'object' && 'error' in value) {
                const error = value.error as RetryableError;
                if (shouldRetry(error)) {
                  throw error;
                }
              }

              if (done) {
                console.info(
                  `[Fallback] Stream completed successfully. Streamed ${streamedChunks} chunks from ${self.modelId}`
                );
                break;
              }
              controller.enqueue(value);
              streamedChunks++;

              if (value?.type !== 'stream-start') {
                hasStreamedAny = true;
              }
            }
            controller.close();
          } catch (error) {
            // Check if this is a normal stream termination
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isNormalTermination =
              errorMessage === 'terminated' ||
              errorMessage.includes('terminated') ||
              errorMessage === 'aborted' ||
              errorMessage.includes('aborted');

            // If it's a normal termination and we've already streamed content, just close normally
            if (isNormalTermination && hasStreamedAny) {
              controller.close();
              return;
            }

            if (self.settings.onError) {
              try {
                await self.settings.onError(error as RetryableError, self.modelId);
              } catch {
                // Don't let onError callback failures break the retry logic
              }
            }
            if (!hasStreamedAny || self.retryAfterOutput) {
              // If nothing was streamed yet, switch models and retry
              console.warn(`Stream error on ${self.modelId}, attempting fallback...`);
              self.switchToNextModel();

              // Prevent infinite recursion - if we've tried all models, fail
              if (self.currentModelIndex === 0) {
                console.error('All models exhausted, failing request');
                controller.error(error);
                return;
              }

              try {
                // Get the next model directly instead of recursive call
                const nextModel = self.getCurrentModel();
                const nextResult = await nextModel.doStream(options);
                const nextReader = nextResult.stream.getReader();
                while (true) {
                  const { done, value } = await nextReader.read();
                  if (done) break;
                  controller.enqueue(value);
                }
                controller.close();
              } catch (nextError) {
                controller.error(nextError);
              }
              return;
            }
            controller.error(error);
          }
        },
      });

      return {
        stream: wrappedStream,
        ...(result.request && { request: result.request }),
        ...(result.response && { response: result.response }),
      };
    });
  }
}
